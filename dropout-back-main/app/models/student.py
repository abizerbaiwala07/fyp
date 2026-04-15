from pydantic import BaseModel, Field
from typing import Optional, List, Annotated, Any
from datetime import datetime
from bson import ObjectId

# Use a simpler approach for ObjectId handling
PyObjectId = Annotated[str, Field(description="MongoDB ObjectId as string")]

class StudentBase(BaseModel):
    student_id: str = Field(..., description="Unique student identifier")
    name: str = Field(..., description="Student full name")
    age: int = Field(..., ge=16, le=30, description="Student age")
    gender: str = Field(..., description="Student gender")
    
    # Academic Information
    current_gpa: float = Field(..., ge=0.0, le=4.0, description="Current GPA")
    previous_gpa: float = Field(..., ge=0.0, le=4.0, description="Previous semester GPA")
    attendance_rate: float = Field(..., ge=0.0, le=100.0, description="Attendance percentage")
    failed_subjects: int = Field(..., ge=0, description="Number of failed subjects")
    participation_activities: int = Field(..., ge=0, le=10, description="Activity participation level (0-10)")
    
    # Socio-economic Information
    parent_education_level: str = Field(..., description="Parent's highest education level")
    financial_aid: bool = Field(..., description="Receives financial aid")
    family_income_level: str = Field(..., description="Family income level")
    distance_from_home: float = Field(..., ge=0, description="Distance from home in km")
    
    # Additional Factors
    study_hours_per_week: float = Field(..., ge=0, description="Study hours per week")
    part_time_job: bool = Field(..., description="Has part-time job")
    health_issues: bool = Field(..., description="Has health issues")
    
    # Degree Information (for students who completed 12th)
    degree_type: Optional[str] = Field(None, description="Type of degree (B.Tech, B.Sc, B.Com, etc.)")
    degree_year: Optional[int] = Field(None, ge=1, le=4, description="Current year of degree (1-4)")
    current_cgpa: Optional[float] = Field(None, ge=0.0, le=10.0, description="Current CGPA in degree")
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    current_gpa: Optional[float] = None
    attendance_rate: Optional[float] = None
    failed_subjects: Optional[int] = None
    participation_activities: Optional[int] = None
    parent_education_level: Optional[str] = None
    financial_aid: Optional[bool] = None
    family_income_level: Optional[str] = None
    distance_from_home: Optional[float] = None
    study_hours_per_week: Optional[float] = None
    part_time_job: Optional[bool] = None
    health_issues: Optional[bool] = None
    degree_type: Optional[str] = None
    degree_year: Optional[int] = None
    current_cgpa: Optional[float] = None

class Student(StudentBase):
    id: Optional[str] = Field(None, alias="_id", description="MongoDB ObjectId as string")
    user_email: Optional[str] = Field(None, description="Linked user email")
    dropout_probability: Optional[float] = Field(None, description="Predicted dropout probability")
    risk_level: Optional[str] = Field(None, description="Risk level (Low/Medium/High)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PredictionRequest(BaseModel):
    student_data: StudentBase

class PredictionResponse(BaseModel):
    student_id: str
    dropout_probability: float
    risk_level: str
    confidence: float
    factors: dict

class Intervention(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="MongoDB ObjectId as string")
    student_id: str
    counselor_name: str
    intervention_type: str
    description: str
    action_taken: str
    follow_up_date: Optional[datetime] = None
    status: str = Field(default="Active")  # Active, Completed, Cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class InterventionCreate(BaseModel):
    student_id: str
    counselor_name: str
    intervention_type: str
    description: str
    action_taken: str
    follow_up_date: Optional[datetime] = None

# New models for 10th standard form and dashboard
class TenthStandardForm(BaseModel):
    """Form for collecting 10th standard student data"""
    # Basic Information
    name: str = Field(..., description="Student full name")
    age: int = Field(..., ge=14, le=25, description="Student age")
    gender: str = Field(..., description="Student gender (Male/Female/Other)")
    
    # 10th Standard Academic Performance
    tenth_percentage: float = Field(..., ge=0.0, le=100.0, description="10th standard percentage")
    math_marks: float = Field(..., ge=0.0, le=100.0, description="Mathematics marks in 10th")
    science_marks: float = Field(..., ge=0.0, le=100.0, description="Science marks in 10th")
    english_marks: float = Field(..., ge=0.0, le=100.0, description="English marks in 10th")
    
    # Current Academic Status (11th/12th)
    current_class: str = Field(..., description="Current class (11th/12th)")
    current_stream: str = Field(..., description="Current stream (Science/Commerce/Arts)")
    current_attendance: float = Field(..., ge=0.0, le=100.0, description="Current attendance percentage")
    failed_subjects_current: int = Field(..., ge=0, description="Number of failed subjects in current class")
    
    # Family and Socio-economic Background
    parent_education: str = Field(..., description="Parent's highest education (Below 10th/10th/12th/Graduate/Post-Graduate)")
    family_income: str = Field(..., description="Family income level (Below 2L/2-5L/5-10L/Above 10L)")
    financial_support: bool = Field(..., description="Receives scholarship or financial aid")
    distance_from_school: float = Field(..., ge=0, description="Distance from home to school in km")
    
    # Personal and Lifestyle Factors
    study_hours_daily: float = Field(..., ge=0, description="Daily study hours")
    extracurricular_participation: int = Field(..., ge=0, le=10, description="Participation in activities (0-10 scale)")
    has_part_time_work: bool = Field(..., description="Does part-time work or helps in family business")
    health_issues: bool = Field(..., description="Has any health issues affecting studies")
    internet_access: bool = Field(..., description="Has reliable internet access at home")
    
    # Aspirations and Goals
    career_goal: str = Field(..., description="Career aspiration")
    higher_education_plan: str = Field(..., description="Plans for higher education")
    
    # Degree Information (for students who completed 12th) - Optional fields
    degree_type: Optional[str] = Field(None, description="Type of degree (B.Tech, B.Sc, B.Com, etc.)")
    degree_year: Optional[int] = Field(None, ge=1, le=4, description="Current year of degree (1-4)")
    current_cgpa: Optional[float] = Field(None, ge=0.0, le=10.0, description="Current CGPA in degree")

class StudentRecommendations(BaseModel):
    """Recommendations and improvement suggestions for students"""
    # Risk Assessment
    dropout_risk: str = Field(..., description="Risk level: Low/Medium/High")
    risk_percentage: float = Field(..., description="Dropout probability percentage")
    
    # Key Risk Factors
    primary_risk_factors: List[str] = Field(..., description="Main factors contributing to dropout risk")
    protective_factors: List[str] = Field(..., description="Factors that reduce dropout risk")
    
    # Academic Recommendations
    academic_improvements: List[str] = Field(..., description="Specific academic improvement suggestions")
    subject_focus_areas: List[str] = Field(..., description="Subjects that need more attention")
    
    # Personal Development
    skill_development: List[str] = Field(..., description="Skills to develop")
    extracurricular_suggestions: List[str] = Field(..., description="Recommended activities")
    
    # Support Systems
    family_support_suggestions: List[str] = Field(..., description="How family can help")
    school_support_needed: List[str] = Field(..., description="Support needed from school")
    
    # Action Plan
    immediate_actions: List[str] = Field(..., description="Actions to take immediately")
    short_term_goals: List[str] = Field(..., description="Goals for next 3-6 months")
    long_term_goals: List[str] = Field(..., description="Goals for next 1-2 years")
    
    # Resources
    recommended_resources: List[str] = Field(..., description="Books, websites, courses, etc.")
    counseling_needed: bool = Field(..., description="Whether professional counseling is recommended")

class DashboardData(BaseModel):
    """Complete dashboard data for a student"""
    student_info: Student
    recommendations: StudentRecommendations
    progress_tracking: dict = Field(..., description="Progress metrics over time")
    intervention_history: List[Intervention] = Field(default=[], description="Past interventions")
    
class TenthStandardResponse(BaseModel):
    """Response after processing 10th standard form"""
    student: Student
    dashboard_data: DashboardData
    success_message: str