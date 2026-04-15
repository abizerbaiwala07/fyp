from typing import List, Dict
from app.models.student import (
    TenthStandardForm, StudentCreate, StudentRecommendations, 
    DashboardData, Student, TenthStandardResponse
)
from app.services.student_service import student_service
from app.services.ml_service import ml_service
import uuid
from datetime import datetime, timezone

class RecommendationService:
    def __init__(self):
        pass
    
    def convert_tenth_standard_to_student(self, form_data: TenthStandardForm) -> StudentCreate:
        """Convert 10th standard form data to StudentCreate format"""
        
        # Generate unique student ID
        student_id = f"STU_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8]}"
        
        # Convert 10th percentage to GPA (assuming 10th % / 25 = GPA out of 4)
        current_gpa = min(form_data.tenth_percentage / 25.0, 4.0)
        
        # Estimate previous GPA based on current performance
        previous_gpa = max(current_gpa - 0.2, 0.0)  # Slightly lower than current
        
        # Prepare degree information
        degree_type = getattr(form_data, 'degree_type', None) if hasattr(form_data, 'degree_type') else None
        degree_year = getattr(form_data, 'degree_year', None) if hasattr(form_data, 'degree_year') else None
        degree_cgpa = getattr(form_data, 'current_cgpa', None) if hasattr(form_data, 'current_cgpa') else None
        
        # Override GPA calculation if CGPA is provided
        if degree_cgpa:
            current_gpa = degree_cgpa / 2.5  # Convert CGPA to 4.0 scale
        
        # Map form fields to student model
        student_data = StudentCreate(
            student_id=student_id,
            name=form_data.name,
            age=form_data.age,
            gender=form_data.gender,
            
            # Academic Information (converted from 10th standard data)
            current_gpa=current_gpa,
            previous_gpa=previous_gpa,
            attendance_rate=form_data.current_attendance,
            failed_subjects=form_data.failed_subjects_current,
            participation_activities=form_data.extracurricular_participation,
            
            # Socio-economic Information
            parent_education_level=form_data.parent_education,
            financial_aid=form_data.financial_support,
            family_income_level=form_data.family_income,
            distance_from_home=form_data.distance_from_school,
            
            # Additional Factors
            study_hours_per_week=form_data.study_hours_daily * 7,  # Convert daily to weekly
            part_time_job=form_data.has_part_time_work,
            health_issues=form_data.health_issues,
            
            # Degree Information
            degree_type=degree_type,
            degree_year=degree_year,
            current_cgpa=degree_cgpa
        )
            
        return student_data
    
    def generate_recommendations(self, student: Student, form_data: TenthStandardForm) -> StudentRecommendations:
        """Generate personalized recommendations based on student data and risk factors"""
        
        risk_level = student.risk_level or "Medium"
        risk_percentage = (student.dropout_probability or 0.5) * 100
        
        # Analyze risk factors
        primary_risk_factors = []
        protective_factors = []
        academic_improvements = []
        subject_focus_areas = []
        
        # Academic Risk Analysis
        # Check if student is in degree program
        is_degree_student = hasattr(student, 'degree_type') and getattr(student, 'degree_type', None)
        
        if is_degree_student and hasattr(student, 'current_cgpa') and getattr(student, 'current_cgpa', None):
            # Degree-specific analysis
            if student.current_cgpa < 6.0:
                primary_risk_factors.append("Low CGPA (below 6.0) - risk of academic probation")
                academic_improvements.append("Focus on improving CGPA through consistent study and assignment completion")
            elif student.current_cgpa < 7.0:
                primary_risk_factors.append("Below average CGPA - needs improvement for better opportunities")
                academic_improvements.append("Aim to improve CGPA to at least 7.0 for better placement opportunities")
            
            # CGPA-based protective factors
            if student.current_cgpa >= 8.5:
                protective_factors.append("Excellent academic performance (CGPA 8.5+)")
            elif student.current_cgpa >= 7.5:
                protective_factors.append("Good academic performance (CGPA 7.5+)")
        else:
            # Traditional GPA analysis for school students
            if student.current_gpa < 2.0:
                primary_risk_factors.append("Low academic performance (GPA below 2.0)")
                academic_improvements.append("Focus on improving overall grades through regular study schedule")
            
        if student.attendance_rate < 75:
            primary_risk_factors.append("Poor attendance rate")
            academic_improvements.append("Improve attendance - aim for at least 85% attendance")
            
        if student.failed_subjects > 0:
            primary_risk_factors.append(f"Failed {student.failed_subjects} subject(s)")
            academic_improvements.append("Get additional help for failed subjects through tutoring")
        
        # Subject-specific recommendations
        if is_degree_student and hasattr(student, 'degree_type') and getattr(student, 'degree_type', None):
            # Degree-specific subject recommendations
            if student.degree_type in ["B.Tech", "B.E."]:
                subject_focus_areas.extend([
                    "Core engineering subjects based on specialization",
                    "Mathematics and applied sciences",
                    "Programming and technical skills"
                ])
            elif student.degree_type == "MBBS":
                subject_focus_areas.extend([
                    "Medical sciences and anatomy",
                    "Clinical subjects and practical skills",
                    "Research methodology"
                ])
            elif student.degree_type in ["B.Sc"]:
                subject_focus_areas.extend([
                    "Core science subjects",
                    "Laboratory and practical work",
                    "Research and analytical skills"
                ])
            elif student.degree_type in ["B.Com", "BBA"]:
                subject_focus_areas.extend([
                    "Accounting and finance",
                    "Business management principles",
                    "Economics and statistics"
                ])
            elif student.degree_type == "B.A.":
                subject_focus_areas.extend([
                    "Core humanities subjects",
                    "Language and communication skills",
                    "Critical thinking and analysis"
                ])
        else:
            # Traditional subject recommendations based on 10th marks
            if hasattr(form_data, 'math_marks') and form_data.math_marks < 60:
                subject_focus_areas.append("Mathematics - needs significant improvement")
            if hasattr(form_data, 'science_marks') and form_data.science_marks < 60:
                subject_focus_areas.append("Science - requires more attention")
            if hasattr(form_data, 'english_marks') and form_data.english_marks < 60:
                subject_focus_areas.append("English - communication skills need development")
            
        # Protective factors
        if student.current_gpa >= 3.0:
            protective_factors.append("Good academic performance")
        if student.attendance_rate >= 85:
            protective_factors.append("Regular attendance")
        if student.participation_activities >= 5:
            protective_factors.append("Active in extracurricular activities")
        if not student.health_issues:
            protective_factors.append("Good health status")
        if form_data.internet_access:
            protective_factors.append("Access to digital learning resources")
            
        # Socio-economic factors
        if student.family_income_level in ["Below 2L", "2-5L"]:
            primary_risk_factors.append("Low family income")
        if student.parent_education_level in ["Below 10th", "10th"]:
            primary_risk_factors.append("Limited parental education support")
        if student.distance_from_home > 10:
            primary_risk_factors.append("Long commute to school")
            
        # Generate specific recommendations
        skill_development = self._get_skill_development_recommendations(student, form_data)
        extracurricular_suggestions = self._get_extracurricular_suggestions(form_data)
        family_support_suggestions = self._get_family_support_suggestions(student, form_data)
        school_support_needed = self._get_school_support_recommendations(student, form_data)
        
        # Action plans based on risk level
        immediate_actions, short_term_goals, long_term_goals = self._generate_action_plans(
            risk_level, student, form_data
        )
        
        # Resources
        recommended_resources = self._get_recommended_resources(student, form_data)
        
        # Counseling recommendation
        counseling_needed = (
            risk_level == "High" or 
            student.health_issues or 
            student.family_income_level == "Below 2L" or
            form_data.failed_subjects_current > 2
        )
        
        return StudentRecommendations(
            dropout_risk=risk_level,
            risk_percentage=risk_percentage,
            primary_risk_factors=primary_risk_factors,
            protective_factors=protective_factors,
            academic_improvements=academic_improvements,
            subject_focus_areas=subject_focus_areas,
            skill_development=skill_development,
            extracurricular_suggestions=extracurricular_suggestions,
            family_support_suggestions=family_support_suggestions,
            school_support_needed=school_support_needed,
            immediate_actions=immediate_actions,
            short_term_goals=short_term_goals,
            long_term_goals=long_term_goals,
            recommended_resources=recommended_resources,
            counseling_needed=counseling_needed
        )
    
    def _get_skill_development_recommendations(self, student: Student, form_data: TenthStandardForm) -> List[str]:
        """Generate skill development recommendations"""
        skills = []
        
        if form_data.english_marks < 70:
            skills.append("English communication and writing skills")
        if form_data.math_marks < 70:
            skills.append("Mathematical problem-solving abilities")
        if student.participation_activities < 5:
            skills.append("Leadership and teamwork skills through group activities")
        if not form_data.internet_access:
            skills.append("Digital literacy and computer skills")
        if form_data.career_goal in ["Engineering", "Medicine", "Science"]:
            skills.append("Analytical and critical thinking skills")
        
        skills.append("Time management and study planning")
        skills.append("Stress management and emotional resilience")
        
        return skills
    
    def _get_extracurricular_suggestions(self, form_data: TenthStandardForm) -> List[str]:
        """Generate extracurricular activity suggestions"""
        suggestions = []
        
        if form_data.extracurricular_participation < 3:
            suggestions.append("Join at least one sports team or club")
            suggestions.append("Participate in school cultural events")
        
        if form_data.career_goal == "Engineering":
            suggestions.append("Join science club or robotics team")
            suggestions.append("Participate in math olympiad or science fairs")
        elif form_data.career_goal == "Medicine":
            suggestions.append("Volunteer at local health centers")
            suggestions.append("Join first aid or health awareness programs")
        elif form_data.career_goal in ["Business", "Commerce"]:
            suggestions.append("Join debate club or business quiz competitions")
            suggestions.append("Participate in entrepreneurship programs")
        
        suggestions.append("Consider community service activities")
        suggestions.append("Join study groups with peers")
        
        return suggestions
    
    def _get_family_support_suggestions(self, student: Student, form_data: TenthStandardForm) -> List[str]:
        """Generate family support recommendations"""
        suggestions = []
        
        if student.parent_education_level in ["Below 10th", "10th"]:
            suggestions.append("Seek help from educated relatives or neighbors for academic guidance")
            suggestions.append("Encourage parents to attend school meetings and parent-teacher conferences")
        
        if student.family_income_level in ["Below 2L", "2-5L"]:
            suggestions.append("Apply for government scholarships and financial aid programs")
            suggestions.append("Look for free or low-cost educational resources")
        
        if form_data.study_hours_daily < 2:
            suggestions.append("Create a dedicated study space at home")
            suggestions.append("Establish a regular study routine with family support")
        
        suggestions.append("Regular communication with parents about academic progress")
        suggestions.append("Family should encourage and motivate during difficult times")
        
        return suggestions
    
    def _get_school_support_recommendations(self, student: Student, form_data: TenthStandardForm) -> List[str]:
        """Generate school support recommendations"""
        support = []
        
        if student.current_gpa < 2.5:
            support.append("Additional tutoring sessions for weak subjects")
            support.append("Regular monitoring by class teacher")
        
        if student.attendance_rate < 80:
            support.append("Counseling to understand attendance issues")
            support.append("Flexible timing if transportation is an issue")
        
        if form_data.failed_subjects_current > 0:
            support.append("Remedial classes for failed subjects")
            support.append("Peer tutoring programs")
        
        if student.family_income_level == "Below 2L":
            support.append("Fee concession or scholarship assistance")
            support.append("Free textbooks and study materials")
        
        support.append("Regular career guidance sessions")
        support.append("Mental health and stress management workshops")
        
        return support
    
    def _generate_action_plans(self, risk_level: str, student: Student, form_data: TenthStandardForm):
        """Generate immediate, short-term, and long-term action plans"""
        
        immediate_actions = []
        short_term_goals = []
        long_term_goals = []
        
        # Immediate actions (next 1-2 weeks)
        if student.attendance_rate < 75:
            immediate_actions.append("Attend all classes regularly starting immediately")
        if form_data.study_hours_daily < 2:
            immediate_actions.append("Establish a daily study routine of at least 2 hours")
        if student.failed_subjects > 0:
            immediate_actions.append("Meet with teachers of failed subjects for guidance")
        
        immediate_actions.append("Create a weekly study timetable")
        immediate_actions.append("Identify and eliminate major distractions during study time")
        
        # Short-term goals (3-6 months)
        if student.current_gpa < 2.5:
            short_term_goals.append("Improve GPA to at least 2.5 by next semester")
        if student.attendance_rate < 85:
            short_term_goals.append("Achieve and maintain 85%+ attendance")
        
        short_term_goals.append("Complete all assignments on time")
        short_term_goals.append("Participate in at least one extracurricular activity")
        short_term_goals.append("Improve performance in weakest subject by 20%")
        
        # Long-term goals (1-2 years)
        if form_data.higher_education_plan:
            long_term_goals.append(f"Prepare for {form_data.higher_education_plan} entrance exams")
        
        long_term_goals.append("Achieve overall academic performance above 75%")
        long_term_goals.append("Develop skills relevant to chosen career path")
        long_term_goals.append("Build a strong foundation for higher education")
        long_term_goals.append("Maintain consistent academic and personal growth")
        
        return immediate_actions, short_term_goals, long_term_goals
    
    def _get_recommended_resources(self, student: Student, form_data: TenthStandardForm) -> List[str]:
        """Generate recommended learning resources"""
        resources = []
        
        # Subject-specific resources
        if form_data.math_marks < 70:
            resources.append("Khan Academy Mathematics courses")
            resources.append("NCERT Mathematics textbook solutions")
        
        if form_data.science_marks < 70:
            resources.append("BYJU'S Science video lessons")
            resources.append("Science practical lab manuals")
        
        if form_data.english_marks < 70:
            resources.append("English grammar and vocabulary apps")
            resources.append("Reading comprehension practice books")
        
        # General resources
        resources.append("Time management and study skills books")
        resources.append("Career guidance websites and counseling services")
        resources.append("Scholarship and financial aid information portals")
        
        if form_data.internet_access:
            resources.append("Online educational platforms (Coursera, edX)")
            resources.append("YouTube educational channels for your subjects")
        
        return resources
    
    async def process_tenth_standard_form(self, form_data: TenthStandardForm) -> TenthStandardResponse:
        """Process the 10th standard form and create complete student profile with dashboard"""
        
        # Convert form data to student format
        student_data = self.convert_tenth_standard_to_student(form_data)
        
        # Create student in database
        created_student = await student_service.create_student(student_data)
        
        # Get ML prediction
        prediction = ml_service.predict_dropout(student_data)
        
        # Update student with prediction
        await student_service.update_student_prediction(
            created_student.student_id,
            prediction.dropout_probability,
            prediction.risk_level
        )
        
        # Get updated student with prediction
        updated_student = await student_service.get_student_by_student_id(created_student.student_id)
        
        # Generate recommendations
        recommendations = self.generate_recommendations(updated_student, form_data)
        
        # Create dashboard data
        dashboard_data = DashboardData(
            student_info=updated_student,
            recommendations=recommendations,
            progress_tracking={
                "academic_trend": "baseline_established",
                "attendance_trend": "monitoring_started",
                "risk_level_history": [recommendations.dropout_risk],
                "last_updated": datetime.now(timezone.utc).isoformat()
            },
            intervention_history=[]
        )
        
        return TenthStandardResponse(
            student=updated_student,
            dashboard_data=dashboard_data,
            success_message=f"Student profile created successfully! Risk Level: {recommendations.dropout_risk}"
        )

# Create service instance
recommendation_service = RecommendationService()