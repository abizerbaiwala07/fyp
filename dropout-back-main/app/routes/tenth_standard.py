from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timedelta, timezone
from app.models.student import Student, TenthStandardForm, TenthStandardResponse
from app.services.student_service import student_service
from app.services.ml_service import ml_service
from app.services.email_service import email_service
from app.database import get_database
from app.routes.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/tenth-standard", tags=["tenth-standard"]) 

@router.get("/dashboard/{student_id}")
async def get_tenth_standard_dashboard(
    student_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Provide dashboard data for compatibility with older frontend routes"""
    try:
        # Try to reuse students dashboard data if exists
        student = await student_service.get_student_by_student_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Access control: allow owner, admin, teacher
        if (current_user["email"] != getattr(student, 'user_email', current_user["email"]) and 
            current_user.get("role") not in ["admin", "teacher"]):
            raise HTTPException(status_code=403, detail="Access denied")

        doc = await db.student_dashboard_data.find_one({"student_id": student_id})
        data = doc.get("data") if doc else None
        if data is None:
            # Initialize empty dashboard data
            data = {
                "exam_scores": [],
                "study_streak": 0,
                "achievements": [],
                "total_study_time": 0,
                "progress_data": {"latest_score": 0, "progress_percentage": 0}
            }
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")

@router.get("/streak/{student_id}")
async def get_student_streak(
    student_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get student streak data without updating it"""
    try:
        # Verify student exists
        student = await student_service.get_student_by_student_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Access control: allow owner, admin, teacher
        if (current_user["email"] != getattr(student, 'user_email', current_user["email"]) and 
            current_user.get("role") not in ["admin", "teacher"]):
            raise HTTPException(status_code=403, detail="Access denied")

        # Get current streak data
        streak_collection = db.student_streaks
        streak_doc = await streak_collection.find_one({"student_id": student_id})
        
        if streak_doc:
            last_click = streak_doc.get("last_click")
            streak_count = streak_doc.get("streak_count", 0)
            
            can_update = True
            next_update_allowed = None
            
            if last_click:
                try:
                    # Handle different datetime formats
                    if isinstance(last_click, str):
                        if last_click.endswith('Z'):
                            last_click_time = datetime.fromisoformat(last_click.replace('Z', '+00:00'))
                        else:
                            last_click_time = datetime.fromisoformat(last_click)
                    else:
                        last_click_time = last_click
                    
                    now = datetime.now(timezone.utc)
                    time_diff = now - last_click_time
                    
                    # If less than 24 hours since last click, can't update
                    if time_diff.total_seconds() <= 24 * 60 * 60:
                        can_update = False
                        next_update_allowed = last_click_time + timedelta(hours=24)
                except Exception as e:
                    # If there's an error parsing the datetime, allow update
                    print(f"Error parsing last_click datetime: {e}")
                    can_update = True
            
            return {
                "success": True,
                "streak_count": streak_count,
                "last_click": last_click.isoformat() if hasattr(last_click, 'isoformat') else last_click,
                "can_update": can_update,
                "next_update_allowed": next_update_allowed.isoformat() if next_update_allowed else None
            }
        else:
            # No streak data yet
            return {
                "success": True,
                "streak_count": 0,
                "last_click": None,
                "can_update": True,
                "next_update_allowed": None
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting streak: {str(e)}")

@router.post("/streak/{student_id}")
async def update_student_streak(
    student_id: str,
    streak_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update student streak data when they click the daily streak button"""
    try:
        # Verify student exists
        student = await student_service.get_student_by_student_id(student_id)
        if not student:
            raise HTTPException(status_code=440, detail="Student not found")

        # Access control: allow owner, admin, teacher
        if (current_user["email"] != getattr(student, 'user_email', current_user["email"]) and 
            current_user.get("role") not in ["admin", "teacher"]):
            raise HTTPException(status_code=403, detail="Access denied")

        timestamp = streak_data.get("timestamp")
        if not timestamp:
            raise HTTPException(status_code=400, detail="Timestamp is required")

        # Get current streak data
        streak_collection = db.student_streaks
        streak_doc = await streak_collection.find_one({"student_id": student_id})
        
        current_streak_count = 0
        can_update_streak = True
        
        if streak_doc:
            last_click = streak_doc.get("last_click")
            current_streak_count = streak_doc.get("streak_count", 0)
            
            if last_click:
                try:
                    # Handle different datetime formats
                    if isinstance(last_click, str):
                        if last_click.endswith('Z'):
                            last_click_time = datetime.fromisoformat(last_click.replace('Z', '+00:00'))
                        else:
                            last_click_time = datetime.fromisoformat(last_click)
                    else:
                        last_click_time = last_click
                    
                    if isinstance(timestamp, str):
                        if timestamp.endswith('Z'):
                            current_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        else:
                            current_time = datetime.fromisoformat(timestamp)
                    else:
                        current_time = timestamp
                    
                    time_diff = current_time - last_click_time
                    
                    # If less than 24 hours since last click, don't allow update
                    if time_diff.total_seconds() <= 24 * 60 * 60:
                        can_update_streak = False
                        # Return current streak without updating
                        next_update_allowed = last_click_time + timedelta(hours=24)
                        return {
                            "success": False,
                            "streak_count": current_streak_count,
                            "message": "Streak can only be updated once every 24 hours",
                            "next_update_allowed": next_update_allowed.isoformat() if next_update_allowed else None
                        }
                except Exception as e:
                    # If there's an error parsing the datetime, log it but continue
                    print(f"Error parsing datetime: {e}")
        
        # If we can update the streak (first click or more than 24 hours since last click)
        if can_update_streak:
            new_streak_count = current_streak_count + 1
            
            # Update streak data
            await streak_collection.update_one(
                {"student_id": student_id},
                {
                    "$set": {
                        "student_id": student_id,
                        "streak_count": new_streak_count,
                        "last_click": timestamp,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
            
            # Handle datetime formatting for next_update_allowed
            try:
                if isinstance(timestamp, str):
                    if timestamp.endswith('Z'):
                        base_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    else:
                        base_time = datetime.fromisoformat(timestamp)
                else:
                    base_time = timestamp
                next_update_allowed = base_time + timedelta(hours=24)
            except Exception as e:
                print(f"Error calculating next_update_allowed: {e}")
                next_update_allowed = None

            return {
                "success": True,
                "streak_count": new_streak_count,
                "message": f"Streak updated to {new_streak_count} days",
                "next_update_allowed": next_update_allowed.isoformat() if next_update_allowed else None
            }
        else:
            # This shouldn't happen due to the early return above, but just in case
            return {
                "success": False,
                "streak_count": current_streak_count,
                "message": "Streak can only be updated once every 24 hours"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating streak: {str(e)}")

@router.post("/submit", response_model=TenthStandardResponse)
async def submit_tenth_standard_form(
    form_data: TenthStandardForm,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Submit 10th standard form and create student profile"""
    try:
        # Check if user already has a student profile
        if current_user.get("student_id"):
            # Return existing student data
            existing_student = await student_service.get_student_by_student_id(current_user["student_id"])
            if existing_student:
                dashboard_data = await get_dashboard_data(current_user["student_id"], db)
                return TenthStandardResponse(
                    student=existing_student,
                    dashboard_data=dashboard_data,
                    success_message="Welcome back! Your profile has been loaded."
                )
        
        # Generate unique student ID
        student_id = f"STU{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
        
        # Create student data
        student_data = Student(
            student_id=student_id,
            name=form_data.name,
            age=form_data.age,
            gender=form_data.gender,
            tenth_percentage=form_data.tenth_percentage,
            educational_path=form_data.educational_path,
            stream=form_data.stream,
            current_level=form_data.current_level,
            current_institution=form_data.current_institution,
            current_course=form_data.current_course,
            target_exam=form_data.target_exam,
            exam_year=form_data.exam_year,
            current_attendance=form_data.current_attendance,
            study_hours_daily=form_data.study_hours_daily,
            parent_education=form_data.parent_education,
            family_income=form_data.family_income,
            financial_support=form_data.financial_support,
            distance_from_school=form_data.distance_from_school,
            extracurricular_participation=form_data.extracurricular_participation,
            has_part_time_work=form_data.has_part_time_work,
            health_issues=form_data.health_issues,
            internet_access=form_data.internet_access,
            career_goal=form_data.career_goal,
            higher_education_plan=form_data.higher_education_plan,
            academic_focus=form_data.academic_focus,
            study_motivation=form_data.study_motivation,
            degree_type=form_data.degree_type,
            degree_year=form_data.degree_year,
            current_cgpa=form_data.current_cgpa,
            exam_start_month=form_data.exam_start_month,
            exam_end_month=form_data.exam_end_month,
            preparation_months=form_data.preparation_months,
            user_email=current_user["email"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Save student to database
        created_student = await student_service.create_student(student_data)
        
        # Update user record with student_id
        await db.users.update_one(
            {"email": current_user["email"]},
            {
                "$set": {
                    "student_id": student_id,
                    "form_completed": True,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Generate ML prediction
        try:
            prediction = ml_service.predict_dropout(created_student.dict())
            
            # Update student with prediction
            await student_service.update_student_prediction(
                student_id, 
                prediction["dropout_probability"], 
                prediction["risk_level"]
            )
            
            created_student.dropout_probability = prediction["dropout_probability"]
            created_student.risk_level = prediction["risk_level"]
            
        except Exception as ml_error:
            print(f"ML prediction failed: {ml_error}")
            # Continue without prediction
        
        # Create initial dashboard data
        dashboard_data = await create_initial_dashboard_data(student_id, created_student, db)
        
        return TenthStandardResponse(
            student=created_student,
            dashboard_data=dashboard_data,
            success_message="Profile created successfully! Welcome to your personalized dashboard."
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating student profile: {str(e)}")

async def get_dashboard_data(student_id: str, db):
    """Get dashboard data for existing student"""
    dashboard_doc = await db.student_dashboard_data.find_one({"student_id": student_id})
    return dashboard_doc.get("data") if dashboard_doc else None

async def create_initial_dashboard_data(student_id: str, student: Student, db):
    """Create initial dashboard data for new student"""
    initial_data = {
        "exam_scores": [],
        "study_streak": 0,
        "achievements": [],
        "total_study_time": 0,
        "progress_data": {
            "latest_score": 0,
            "progress_percentage": 0
        }
    }
    
    # Save to database
    await db.student_dashboard_data.update_one(
        {"student_id": student_id},
        {
            "$set": {
                "student_id": student_id,
                "user_email": student.user_email,
                "data": initial_data,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return initial_data