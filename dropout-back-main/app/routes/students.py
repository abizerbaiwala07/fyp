from fastapi import APIRouter, HTTPException, Query, Depends, File, UploadFile
from typing import List, Optional
from datetime import datetime, timezone
from app.models.student import (
    Student, StudentCreate, StudentUpdate, PredictionRequest, 
    PredictionResponse, Intervention, InterventionCreate
)
from app.services.student_service import student_service
from app.services.ml_service import ml_service
from app.services.ai_service import ai_service
from app.database import get_database
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/students", tags=["students"])

# Support both /api/students and /api/students/ to avoid 307 redirects that can drop Authorization on CORS
@router.post("/", response_model=Student)
@router.post("", response_model=Student, include_in_schema=False)
async def create_student(
    student: StudentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new student"""
    try:
        # Create student with user email linkage
        created_student = await student_service.create_student(student, current_user["email"])
        
        # Get prediction for the new student
        prediction = ml_service.predict_dropout(student)
        
        # Update student with prediction
        await student_service.update_student_prediction(
            created_student.student_id,
            prediction.dropout_probability,
            prediction.risk_level
        )
        
        # Return updated student
        return await student_service.get_student_by_student_id(created_student.student_id)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating student: {str(e)}")

@router.get("/my-profile", response_model=Student)
async def get_my_student_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's student profile"""
    try:
        # First try to get by student_id from user record
        if current_user.get("student_id"):
            student = await student_service.get_student_by_student_id(current_user["student_id"])
            if student:
                return student
        
        # Fallback to get by user email
        student = await student_service.get_student_by_user_email(current_user["email"])
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found. Please complete the assessment form.")
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching student profile: {str(e)}")

@router.get("/dashboard/{student_id}")
async def get_student_dashboard(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get student dashboard data"""
    try:
        # Get student info
        student = await student_service.get_student_by_student_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Check if user has access to this student's data
        db = await get_database()
        if not getattr(student, 'user_email', None):
            # Legacy record without linkage: associate to current user
            await db.users.update_one(
                {"email": current_user["email"]},
                {"$set": {"student_id": student.student_id, "form_completed": True, "updated_at": datetime.now(timezone.utc)}},
                upsert=True
            )
            await db.students.update_one(
                {"student_id": student.student_id},
                {"$set": {"user_email": current_user["email"], "updated_at": datetime.now(timezone.utc)}}
            )
            student.user_email = current_user["email"]
        elif (current_user["email"] != student.user_email and 
              current_user.get("role") not in ["admin", "teacher"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get dashboard data from database (legacy support)
        # But we prioritize unified data in Student object
        return {
            "student_info": {
                "name": student.name,
                "student_id": student.student_id,
                "age": student.age,
                "current_class": getattr(student, 'current_level', '12th'),
                "current_stream": getattr(student, 'stream', 'Science'),
                "tenth_percentage": getattr(student, 'tenth_percentage', 75),
                "current_attendance": getattr(student, 'attendance_rate', 85),
                "target_exam": getattr(student, 'target_exam', 'JEE Main'),
                "total_study_hours": student.total_study_hours,
                "daily_study_hours": student.daily_study_hours,
                "streak": student.streak,
                "xp": student.xp,
                "level": student.current_level,
                "badges": student.badges,
                "performance_data": student.performance_data
            },
            "recommendations": {
                "dropout_risk": student.risk_level or 'Low',
                "risk_percentage": int((student.dropout_probability or 0.15) * 100),
                "primary_risk_factors": [
                    "Time management could be improved",
                    "Focus on weak subjects needed"
                ],
                "protective_factors": [
                    "Strong academic foundation",
                    "Good attendance record",
                    "Clear career goals",
                    "Family support available"
                ]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")

@router.get("/advisor-report/{student_id}")
async def get_student_advisor_report(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate or retrieve AI advisor report for a student"""
    try:
        # Get student info
        student = await student_service.get_student_by_student_id(student_id)
        if not student:
            raise HTTPException(status_code=440, detail="Student not found")
        
        # Access control
        if (current_user["email"] != student.user_email and 
            current_user.get("role") not in ["admin", "teacher"]):
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Generate report using AI service
        report_text = await ai_service.generate_advisor_report(student)
        
        return {"report": report_text}
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Report Generation Error: {str(e)}")

@router.post("/dashboard/{student_id}/save")
async def save_student_dashboard_data(
    student_id: str,
    dashboard_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Save student dashboard data"""
    try:
        # Get student info
        student = await student_service.get_student_by_student_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Check if user has access to this student's data
        if (current_user["email"] != student.user_email and 
            current_user.get("role") not in ["admin", "teacher"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Save dashboard data to database
        db = await get_database()
        await db.student_dashboard_data.update_one(
            {"student_id": student_id},
            {
                "$set": {
                    "student_id": student_id,
                    "user_email": current_user["email"],
                    "data": dashboard_data,
                    "updated_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        
        return {"message": "Dashboard data saved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving dashboard data: {str(e)}")

@router.get("/", response_model=List[Student])
async def get_all_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    risk_level: Optional[str] = Query(None, description="Filter by risk level")
):
    """Get all students with optional filtering"""
    try:
        if risk_level:
            return await student_service.get_students_by_risk_level(risk_level)
        else:
            return await student_service.get_all_students(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching students: {str(e)}")

@router.get("/{student_id}", response_model=Student)
async def get_student(student_id: str):
    """Get a student by ID"""
    try:
        student = await student_service.get_student_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching student: {str(e)}")

@router.put("/{student_id}", response_model=Student)
async def update_student(student_id: str, student_update: StudentUpdate):
    """Update a student"""
    try:
        updated_student = await student_service.update_student(student_id, student_update)
        if not updated_student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get new prediction if academic data was updated
        if any(field in student_update.dict(exclude_unset=True) for field in 
               ['current_gpa', 'attendance_rate', 'failed_subjects', 'participation_activities']):
            
            # Create a complete student object for prediction
            student_data = StudentCreate(
                student_id=updated_student.student_id,
                name=updated_student.name,
                age=updated_student.age,
                gender=updated_student.gender,
                current_gpa=updated_student.current_gpa,
                previous_gpa=updated_student.previous_gpa,
                attendance_rate=updated_student.attendance_rate,
                failed_subjects=updated_student.failed_subjects,
                participation_activities=updated_student.participation_activities,
                parent_education_level=updated_student.parent_education_level,
                financial_aid=updated_student.financial_aid,
                family_income_level=updated_student.family_income_level,
                distance_from_home=updated_student.distance_from_home,
                study_hours_per_week=updated_student.study_hours_per_week,
                part_time_job=updated_student.part_time_job,
                health_issues=updated_student.health_issues
            )
            
            prediction = ml_service.predict_dropout(student_data)
            await student_service.update_student_prediction(
                student_id,
                prediction.dropout_probability,
                prediction.risk_level
            )
            
            # Return updated student with new prediction
            updated_student = await student_service.get_student_by_id(student_id)
        
        return updated_student
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating student: {str(e)}")

@router.delete("/{student_id}")
async def delete_student(student_id: str):
    """Delete a student"""
    try:
        deleted = await student_service.delete_student(student_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Student not found")
        return {"message": "Student deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting student: {str(e)}")

@router.post("/predict", response_model=PredictionResponse)
async def predict_dropout(request: PredictionRequest):
    """Get dropout prediction for a student"""
    try:
        prediction = ml_service.predict_dropout(request.student_data)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")

@router.get("/stats/overview")
async def get_student_stats():
    """Get overview statistics"""
    try:
        total_students = await student_service.get_student_count()
        high_risk_students = await student_service.get_students_by_risk_level("High")
        medium_risk_students = await student_service.get_students_by_risk_level("Medium")
        low_risk_students = await student_service.get_students_by_risk_level("Low")
        
        return {
            "total_students": total_students,
            "high_risk": len(high_risk_students),
            "medium_risk": len(medium_risk_students),
            "low_risk": len(low_risk_students),
            "risk_distribution": {
                "High": len(high_risk_students),
                "Medium": len(medium_risk_students),
                "Low": len(low_risk_students)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

# Intervention routes
@router.post("/{student_id}/interventions", response_model=Intervention)
async def create_intervention(student_id: str, intervention: InterventionCreate):
    """Create an intervention for a student"""
    try:
        # Verify student exists
        student = await student_service.get_student_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Set the student_id in the intervention
        intervention.student_id = student.student_id
        
        created_intervention = await student_service.create_intervention(intervention)
        return created_intervention
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating intervention: {str(e)}")

@router.get("/{student_id}/interventions", response_model=List[Intervention])
async def get_student_interventions(student_id: str):
    """Get all interventions for a student"""
    try:
        # Get student to verify existence and get student_id
        student = await student_service.get_student_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        interventions = await student_service.get_interventions_by_student(student.student_id)
        return interventions
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching interventions: {str(e)}")

@router.get("/interventions/all", response_model=List[Intervention])
async def get_all_interventions():
    """Get all interventions"""
    try:
        return await student_service.get_all_interventions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching interventions: {str(e)}")



def generate_recommendations(student):
    """Generate recommendations based on student data"""
    recommendations = {
        "academic_improvements": [],
        "study_suggestions": [],
        "career_guidance": [],
        "risk_factors": []
    }
    
    # Add recommendations based on student data
    if hasattr(student, 'dropout_probability') and student.dropout_probability:
        if student.dropout_probability > 0.7:
            recommendations["risk_factors"].append("High dropout risk detected - immediate intervention needed")
            recommendations["academic_improvements"].append("Schedule regular counseling sessions")
            recommendations["study_suggestions"].append("Create a structured daily study plan")
        elif student.dropout_probability > 0.4:
            recommendations["risk_factors"].append("Medium dropout risk - monitor progress closely")
            recommendations["study_suggestions"].append("Increase study hours and focus on weak subjects")
    
    # Add general recommendations
    recommendations["academic_improvements"].extend([
        "Maintain consistent attendance above 85%",
        "Complete all assignments on time",
        "Participate actively in class discussions"
    ])
    
    recommendations["study_suggestions"].extend([
        "Create a daily study schedule",
        "Take regular breaks during study sessions",
        "Form study groups with classmates"
    ])
    
    recommendations["career_guidance"].extend([
        "Explore career options in your field of interest",
        "Consider internships and practical experience",
        "Build relevant skills through online courses"
    ])
    
    return recommendations

@router.get("/user/my-data", response_model=Student)
async def get_my_unified_data(current_user: dict = Depends(get_current_user)):
    """Unified endpoint to get all student data including gamification"""
    # 1. Try by email
    student = await student_service.get_student_by_user_email(current_user["email"])
    
    # 2. Try by student_id linked in user account if email fails
    if not student and current_user.get("student_id"):
        student = await student_service.get_student_by_student_id(current_user["student_id"])
        if student:
            # Fix the linkage for future requests
            db = await get_database()
            await db.students.update_one(
                {"student_id": student.student_id},
                {"$set": {"user_email": current_user["email"], "updated_at": datetime.now(timezone.utc)}}
            )

    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

@router.post("/user/log-study")
async def log_study_session(
    hours: float,
    current_user: dict = Depends(get_current_user)
):
    """Log a study session and update gamification metrics"""
    from app.services.gamification_service import gamification_service
    
    # Use my-data logic to find student
    student = await get_my_unified_data(current_user)
    
    result = await gamification_service.update_student_gamification(
        student_id=student.student_id,
        action_type="study_session",
        action_data={"hours": hours}
    )
    return result

@router.post("/report-card/extract")
async def extract_report_card(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Extract data from a report card upload"""
    try:
        content = await file.read()
        extracted_data = await ai_service.extract_report_card_data(content, file.content_type)
        return extracted_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/report-card/save")
async def save_report_card_data(
    data: dict, # Format: { date: "YYYY-MM-DD", subjects: [{ name: "Math", score: 85 }, ...] }
    current_user: dict = Depends(get_current_user)
):
    """Save verified report card data to student performance history"""
    try:
        student = await get_my_unified_data(current_user)
        db = await get_database()
        
        new_entries = []
        for sub in data.get("subjects", []):
            new_entries.append({
                "date": data.get("date"),
                "subject": sub.get("name"),
                "score": sub.get("score"),
                "type": "report_card",
                "difficulty": "N/A"
            })
            
        if new_entries:
            await db.students.update_one(
                {"student_id": student.student_id},
                {"$push": {"performance_data": {"$each": new_entries}}}
            )
            
        return {"message": f"Successfully updated {len(new_entries)} metrics", "count": len(new_entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/user/update-progress")
async def update_student_progress(
    progress_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generic endpoint to update student progress/gamification externally"""
    from app.services.gamification_service import gamification_service
    
    # Use my-data logic to find student
    student = await get_my_unified_data(current_user)
    
    result = await gamification_service.update_student_gamification(
        student_id=student.student_id,
        action_type=progress_data.get("type", "quest"),
        action_data=progress_data.get("data", {})
    )
    return result