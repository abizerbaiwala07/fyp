from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    role: str = Field(default="student", description="User role (student/teacher/administrator/counselor)")
    institution: Optional[str] = Field(None, description="Institution name")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User password")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    institution: Optional[str] = None

class User(UserBase):
    id: Optional[str] = Field(None, alias="_id", description="MongoDB ObjectId as string")
    is_active: bool = Field(default=True, description="User account status")
    form_completed: bool = Field(default=False, description="Whether user has completed student form")
    student_id: Optional[str] = Field(None, description="Associated student record ID")
    firebase_uid: Optional[str] = Field(None, description="Firebase UID for Google auth (legacy)")
    clerk_user_id: Optional[str] = Field(None, description="Clerk user ID for authentication")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    institution: Optional[str] = None
    is_active: bool
    form_completed: bool
    student_id: Optional[str] = None
    created_at: datetime

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="Google ID token")

class FormCompletionUpdate(BaseModel):
    student_id: str = Field(..., description="Student record ID")