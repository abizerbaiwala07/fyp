from fastapi import APIRouter, Depends, HTTPException, Header, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from app.database import get_database
from app.config import settings
from app.models.user import (
    UserCreate, UserLogin, User, UserResponse, AuthResponse, 
    GoogleAuthRequest, FormCompletionUpdate
)
import asyncio
import httpx

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# google-auth for token verification
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as g_requests
except Exception:  # pragma: no cover
    id_token = None
    g_requests = None

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoogleVerifyPayload(BaseModel):
    id_token: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(db, email: str):
    user = await db.users.find_one({"email": email})
    return user

async def create_user(db, user_data: UserCreate):
    # Check if user already exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "institution": user_data.institution,
        "hashed_password": hashed_password,
        "is_active": True,
        "form_completed": False,
        "student_id": None,
        "firebase_uid": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return user_doc

async def authenticate_user(db, email: str, password: str):
    user = await get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

def user_to_response(user_doc: dict) -> UserResponse:
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc["role"],
        institution=user_doc.get("institution"),
        is_active=user_doc["is_active"],
        form_completed=user_doc["form_completed"],
        student_id=user_doc.get("student_id"),
        created_at=user_doc["created_at"]
    )

async def _verify_clerk_token(token: str) -> dict:
    """Verify a Clerk token which can be either:
    - a Clerk session ID (starts with "sess_")
    - a Clerk JWT (RS256)
    Returns a dict with at least: email, name, sub, picture, clerk_user_id
    """
    try:
        clerk_secret_key = getattr(settings, "CLERK_SECRET_KEY", None)
        if not clerk_secret_key or clerk_secret_key == "sk_test_your-clerk-secret-key-here":
            raise HTTPException(
                status_code=503,
                detail=(
                    "Clerk authentication not configured. Please add CLERK_SECRET_KEY to backend/.env file. "
                    "See CLERK_SETUP_GUIDE.md for instructions."
                ),
            )

        async with httpx.AsyncClient() as client:
            async def _fetch_user(user_id: str) -> dict:
                uresp = await client.get(
                    f"https://api.clerk.com/v1/users/{user_id}",
                    headers={
                        "Authorization": f"Bearer {clerk_secret_key}",
                        "Content-Type": "application/json",
                    },
                )
                if uresp.status_code != 200:
                    raise HTTPException(
                        status_code=401,
                        detail=f"Could not fetch user data: {uresp.status_code} {uresp.text}",
                    )
                return uresp.json()

            user_id: Optional[str] = None

            # Case 1: Session ID (preferred)
            if isinstance(token, str) and token.startswith("sess_"):
                sresp = await client.post(
                    f"https://api.clerk.com/v1/sessions/{token}/verify",
                    headers={
                        "Authorization": f"Bearer {clerk_secret_key}",
                        "Content-Type": "application/json",
                    },
                    json={}
                )
                if sresp.status_code == 200:
                    session_data = sresp.json()
                    user_id = session_data.get("user_id")
                else:
                    # Fall back to JWT verification below
                    pass

            # Case 2: JWT verification (fallback)
            if not user_id:
                # Verify a Clerk JWT via tokens/verify
                # See: https://clerk.com/docs/reference/backend-api/tag/Tokens#operation/VerifyJWT
                tresp = await client.post(
                    "https://api.clerk.com/v1/tokens/verify",
                    headers={
                        "Authorization": f"Bearer {clerk_secret_key}",
                        "Content-Type": "application/json",
                    },
                    json={"token": token},
                )
                if tresp.status_code != 200:
                    raise HTTPException(
                        status_code=401,
                        detail=f"Invalid Clerk token (tokens/verify): {tresp.status_code} {tresp.text}",
                    )
                tdata = tresp.json() or {}
                claims = tdata.get("claims") or tdata
                user_id = claims.get("sub") or claims.get("user_id") or tdata.get("user_id")
                if not user_id:
                    raise HTTPException(status_code=401, detail="No user ID in verified token")

            # Fetch user profile to obtain email/name
            user_data = await _fetch_user(user_id)

            # Extract email from email_addresses
            email_addresses = user_data.get("email_addresses", [])
            primary_email = None
            for email_obj in email_addresses:
                if email_obj.get("id") == user_data.get("primary_email_address_id"):
                    primary_email = email_obj.get("email_address")
                    break
            if not primary_email and email_addresses:
                primary_email = email_addresses[0].get("email_address")

            return {
                "email": primary_email,
                "name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
                "sub": user_id,
                "picture": user_data.get("image_url"),
                "clerk_user_id": user_id,
            }

    except HTTPException as he:
        # Preserve detailed errors raised above
        raise he
    except httpx.HTTPError as e:
        # Include response text when available for easier debugging
        resp_text = getattr(getattr(e, 'response', None), 'text', '')
        msg = resp_text or str(e)
        raise HTTPException(status_code=401, detail=f"Clerk token verification failed: {msg}")
    except Exception as e:
        # Ensure message is not empty
        msg = str(e) or repr(e)
        raise HTTPException(status_code=401, detail=f"Token verification error: {msg}")

async def _verify_google_token(token: str) -> dict:
    """Verify an ID token coming from Google Sign-In or Firebase Auth.
    Tries Firebase verification first (if google-auth supports it), then falls back to OAuth2 token verification.
    """
    if not id_token or not g_requests:
        raise HTTPException(status_code=500, detail="Google auth library not installed")

    request = g_requests.Request()
    google_client_id: Optional[str] = getattr(settings, "GOOGLE_CLIENT_ID", None)
    firebase_project_id: Optional[str] = getattr(settings, "FIREBASE_PROJECT_ID", None)

    # 1) Try Firebase ID token verification (works for Firebase Auth tokens)
    try:
        # verify_firebase_token is available in google-auth >= 2.0
        verify_firebase = getattr(id_token, "verify_firebase_token", None)
        if verify_firebase:
            if firebase_project_id:
                payload = verify_firebase(token, request, audience=firebase_project_id)
            else:
                payload = verify_firebase(token, request)
            if payload and payload.get("email"):
                return payload
    except Exception as e:
        # Continue to try OAuth2 verification below
        pass

    # 2) Fallback: standard Google OAuth2 ID token verification (for Google Sign-In tokens)
    try:
        if google_client_id:
            payload = id_token.verify_oauth2_token(token, request, audience=google_client_id)
        else:
            payload = id_token.verify_oauth2_token(token, request)
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid ID token: {str(e) or 'verification failed'}")

async def _get_user_from_header(authorization: Optional[str], db):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1]
    payload = await _verify_google_token(token)
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not present in token")

    user = await db.users.find_one({"email": email})
    if not user:
        # create a user record if not exists
        user = {
            "email": email,
            "name": payload.get("name"),
            "picture": payload.get("picture"),
            "form_completed": False,
            "created_at": asyncio.get_event_loop().time(),
        }
        await db.users.insert_one(user)
    return user, payload

# Email/Password Authentication Endpoints
@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate, db=Depends(get_database), request: Request = None):
    """Create a new user account with email and password"""
    try:
        user_doc = await create_user(db, user_data)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_doc["email"]}, expires_delta=access_token_expires
        )
        
        user_response = user_to_response(user_doc)
        
        response = AuthResponse(
            user=user_response,
            access_token=access_token,
            token_type="bearer"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@router.post("/login", response_model=AuthResponse)
async def login(user_credentials: UserLogin, db=Depends(get_database), request: Request = None):
    """Authenticate user with email and password"""
    user = await authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    user_response = user_to_response(user)
    
    response = AuthResponse(
        user=user_response,
        access_token=access_token,
        token_type="bearer"
    )
    
    # Add CORS headers
    origin = request.headers.get("origin", "*") if request else "*"
    json_response = JSONResponse(content=response.dict())
    return add_cors_headers(json_response, origin)

# Google Authentication Endpoints
@router.post("/google-verify", response_model=AuthResponse)
async def google_verify(payload: GoogleVerifyPayload, db=Depends(get_database), request: Request = None):
    """Verify Google ID token and create/login user"""
    token_info = await _verify_google_token(payload.id_token)
    email = token_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email missing in token")

    # Check if user exists
    existing_user = await get_user_by_email(db, email)
    
    if existing_user:
        # Update existing user with latest Google info
        await db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "name": token_info.get("name", existing_user.get("name")),
                    "firebase_uid": token_info.get("sub"),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        user = await db.users.find_one({"email": email})
    else:
        # Create new user from Google info
        user_doc = {
            "email": email,
            "name": token_info.get("name", ""),
            "role": "student",  # Default role for Google signup
            "institution": None,
            "is_active": True,
            "form_completed": False,
            "student_id": None,
            "firebase_uid": token_info.get("sub"),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = await db.users.insert_one(user_doc)
        user = await db.users.find_one({"_id": result.inserted_id})

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    user_response = user_to_response(user)
    
    response = AuthResponse(
        user=user_response,
        access_token=access_token,
        token_type="bearer"
    )
    
    # Add CORS headers
    origin = request.headers.get("origin", "*") if request else "*"
    json_response = JSONResponse(content=response.dict())
    return add_cors_headers(json_response, origin)

# JWT Token verification for protected routes
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db=Depends(get_database)):
    """Get current user from Authorization header.
    Supports either backend JWT (signed with SECRET_KEY) or a Firebase/Google ID token.
    """
    token = credentials.credentials
    email: Optional[str] = None

    # 1) Try backend JWT first
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        email = None

    # 2) If JWT decode failed, try verifying as Clerk token first, then Firebase/Google token
    if not email:
        try:
            token_info = await _verify_clerk_token(token)
            email = token_info.get("email")
        except HTTPException:
            # If Clerk verification fails, try Firebase/Google token
            try:
                token_info = await _verify_google_token(token)
                email = token_info.get("email")
            except HTTPException:
                # Preserve original 401 error for invalid token
                raise HTTPException(status_code=401, detail="Could not validate credentials")

    if not email:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    # Fetch or create user record
    user = await get_user_by_email(db, email)
    if user is None:
        # Create a minimal user if authenticated via Google/Firebase but not yet in DB
        user_doc = {
            "email": email,
            "name": None,
            "role": "student",
            "institution": None,
            "is_active": True,
            "form_completed": False,
            "student_id": None,
            "firebase_uid": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = await db.users.insert_one(user_doc)
        user = await db.users.find_one({"_id": result.inserted_id})

    return user

@router.get("/clerk-status")
async def check_clerk_status(request: Request = None):
    """Check if Clerk authentication is properly configured"""
    clerk_secret_key = getattr(settings, "CLERK_SECRET_KEY", None)
    
    if not clerk_secret_key or clerk_secret_key == "sk_test_your-clerk-secret-key-here":
        response_data = {
            "configured": False,
            "message": "Clerk secret key not configured. Please add CLERK_SECRET_KEY to backend/.env file.",
            "instructions": "See CLERK_SETUP_GUIDE.md for setup instructions."
        }
    else:
        response_data = {
            "configured": True,
            "message": "Clerk authentication is properly configured.",
            "secret_key_preview": f"{clerk_secret_key[:15]}..."
        }
    
    # Add CORS headers
    origin = request.headers.get("origin", "*") if request else "*"
    json_response = JSONResponse(content=response_data)
    return add_cors_headers(json_response, origin)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user), request: Request = None):
    """Get current user information"""
    response = user_to_response(current_user)
    
    # Add CORS headers
    origin = request.headers.get("origin", "*") if request else "*"
    json_response = JSONResponse(content=response.dict())
    return add_cors_headers(json_response, origin)


@router.post("/complete-form")
async def mark_form_completed(
    form_data: FormCompletionUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
    request: Request = None
):
    """Mark user's form as completed and associate with student record"""
    user_id = current_user["_id"]
    
    # Update user record
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "form_completed": True,
                "student_id": form_data.student_id,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": user_id})
    user_response = user_to_response(updated_user)
    
    response_data = {
        "user": user_response,
        "message": "Form marked as completed",
        "student_id": form_data.student_id
    }
    
    return response_data

@router.get("/dashboard")
async def get_user_dashboard(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
    request: Request = None
):
    """Get user's dashboard data"""
    try:
        user_email = current_user["email"]
        
        # Check if user has completed form and has student_id
        if not current_user.get("form_completed") or not current_user.get("student_id"):
            response_data = {
                "form_completed": False,
                "message": "Please complete the student assessment form first",
                "redirect_to": "/comprehensive-form"
            }
        else:
            student_id = current_user["student_id"]
            
            # Get student data
            student = await db.students.find_one({"student_id": student_id})
            if not student:
                response_data = {
                    "form_completed": False,
                    "message": "Student record not found. Please complete the form again.",
                    "redirect_to": "/comprehensive-form"
                }
            else:
                # Get dashboard data
                dashboard_data = await db.dashboard_data.find_one({"student_id": student_id})
                
                # Get interventions
                interventions = await db.interventions.find({"student_id": student_id}).to_list(length=None)
                
                response_data = {
                    "form_completed": True,
                    "student_id": student_id,
                    "student": student,
                    "dashboard_data": dashboard_data or {},
                    "interventions": interventions,
                    "redirect_to": f"/student-dashboard/{student_id}"
                }
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")

@router.post("/firebase-auth")
async def firebase_auth_login(
    authorization: str = Header(None),
    db=Depends(get_database),
    request: Request = None
):
    """Handle Firebase authentication and sync with backend.
    Accepts either a Firebase/Google ID token (RS256) or an existing backend JWT (HS256).
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Bearer token")
        
        incoming_token = authorization.split(" ", 1)[1]

        email: Optional[str] = None
        token_info = None

        # 0) If the incoming token is already our backend JWT (HS256), accept it
        try:
            payload = jwt.decode(incoming_token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
        except JWTError:
            email = None
        
        # 1) Otherwise verify as Firebase/Google token
        if not email:
            token_info = await _verify_google_token(incoming_token)
            email = token_info.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email missing in token")
        
        # Check if user exists in our database
        existing_user = await get_user_by_email(db, email)
        
        if existing_user:
            # Update existing user with latest Firebase info (if available)
            if token_info:
                await db.users.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "name": token_info.get("name", existing_user.get("name")),
                            "firebase_uid": token_info.get("sub"),
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
            user = await db.users.find_one({"email": email})
        else:
            # Create new user from token info or minimal data
            user_doc = {
                "email": email,
                "name": (token_info.get("name") if token_info else "") if email else "",
                "role": "student",
                "institution": None,
                "is_active": True,
                "form_completed": False,
                "student_id": None,
                "firebase_uid": (token_info.get("sub") if token_info else None),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            result = await db.users.insert_one(user_doc)
            user = await db.users.find_one({"_id": result.inserted_id})
        
        # If caller already sent a valid backend JWT, we can return it; else issue a new one
        try:
            jwt.decode(incoming_token, SECRET_KEY, algorithms=[ALGORITHM])
            access_token = incoming_token
        except JWTError:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user["email"]}, expires_delta=access_token_expires
            )
        
        user_response = user_to_response(user)
        
        response_data = AuthResponse(
            user=user_response,
            access_token=access_token,
            token_type="bearer"
        )
        
        return response_data
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Firebase authentication failed: {e}")

# Legacy endpoint for backward compatibility
@router.post("/google-verify-legacy")
async def google_verify_legacy(payload: GoogleVerifyPayload, db=Depends(get_database), request: Request = None):
    """Legacy Google verification endpoint"""
    token_info = await _verify_google_token(payload.id_token)
    email = token_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email missing in token")

    update = {
        "$set": {
            "email": email,
            "name": token_info.get("name"),
            "picture": token_info.get("picture"),
            "updated_at": datetime.now(timezone.utc)
        },
        "$setOnInsert": {
            "form_completed": False,
            "role": "student",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
    }
    await db.users.update_one({"email": email}, update, upsert=True)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    response_data = {"user": user}
    
    # Add CORS headers
    origin = request.headers.get("origin", "*") if request else "*"
    json_response = JSONResponse(content=response_data)
    return add_cors_headers(json_response, origin)

@router.post("/clerk-auth")
async def clerk_auth_login(
    authorization: str = Header(None),
    db=Depends(get_database),
    request: Request = None
):
    """Handle Clerk authentication and sync with backend.
    Accepts a Clerk session token and creates/updates user in our database.
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Bearer token")
        
        incoming_token = authorization.split(" ", 1)[1]
        email: Optional[str] = None
        token_info = None

        # 1) Try to decode as our backend JWT first (for existing sessions)
        try:
            payload = jwt.decode(incoming_token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
        except JWTError:
            email = None
        
        # 2) If not our JWT, verify as Clerk token
        if not email:
            token_info = await _verify_clerk_token(incoming_token)
            email = token_info.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email missing in token")
        
        # Check if user exists in our database
        existing_user = await get_user_by_email(db, email)
        
        if existing_user:
            # Update existing user with latest Clerk info (if available)
            if token_info:
                await db.users.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "name": token_info.get("name", existing_user.get("name")),
                            "clerk_user_id": token_info.get("clerk_user_id"),
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
            user = await db.users.find_one({"email": email})
        else:
            # Create new user from Clerk token info
            user_doc = {
                "email": email,
                "name": (token_info.get("name") if token_info else "") or "",
                "role": "student",  # Default role for Clerk signup
                "institution": None,
                "is_active": True,
                "form_completed": False,
                "student_id": None,
                "clerk_user_id": (token_info.get("clerk_user_id") if token_info else None),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            result = await db.users.insert_one(user_doc)
            user = await db.users.find_one({"_id": result.inserted_id})
        
        # If caller already sent a valid backend JWT, return it; else issue a new one
        try:
            jwt.decode(incoming_token, SECRET_KEY, algorithms=[ALGORITHM])
            access_token = incoming_token
        except JWTError:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user["email"]}, expires_delta=access_token_expires
            )
        
        user_response = user_to_response(user)
        
        response_data = AuthResponse(
            user=user_response,
            access_token=access_token,
            token_type="bearer"
        )
        
        return response_data
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Clerk authentication failed: {e}")