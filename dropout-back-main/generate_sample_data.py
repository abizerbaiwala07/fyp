import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import connect_to_mongo, close_mongo_connection
from app.services.student_service import student_service
from app.services.ml_service import ml_service
from app.models.student import StudentCreate
import pandas as pd
import numpy as np

async def generate_and_insert_sample_data():
    """Generate sample student data and insert into database"""
    
    # Connect to database
    await connect_to_mongo()
    
    print("Generating sample student data...")
    
    # Generate sample data using ML service
    df = ml_service.generate_sample_data(50)  # Generate 50 sample students
    
    print(f"Generated {len(df)} sample students")
    
    # Insert students into database
    for _, row in df.iterrows():
        try:
            student_data = StudentCreate(
                student_id=row['student_id'],
                name=row['name'],
                age=int(row['age']),
                gender=row['gender'],
                current_gpa=float(row['current_gpa']),
                previous_gpa=float(row['previous_gpa']),
                attendance_rate=float(row['attendance_rate']),
                failed_subjects=int(row['failed_subjects']),
                participation_activities=int(row['participation_activities']),
                parent_education_level=row['parent_education_level'],
                financial_aid=bool(row['financial_aid']),
                family_income_level=row['family_income_level'],
                distance_from_home=float(row['distance_from_home']),
                study_hours_per_week=float(row['study_hours_per_week']),
                part_time_job=bool(row['part_time_job']),
                health_issues=bool(row['health_issues'])
            )
            
            # Create student
            created_student = await student_service.create_student(student_data)
            
            # Get prediction
            prediction = ml_service.predict_dropout(student_data)
            
            # Update with prediction
            await student_service.update_student_prediction(
                created_student.student_id,
                prediction.dropout_probability,
                prediction.risk_level
            )
            
            print(f"Created student: {student_data.name} (Risk: {prediction.risk_level})")
            
        except Exception as e:
            print(f"Error creating student {row['name']}: {e}")
    
    # Close database connection
    await close_mongo_connection()
    
    print("Sample data generation completed!")

if __name__ == "__main__":
    asyncio.run(generate_and_insert_sample_data())