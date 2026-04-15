#!/usr/bin/env python3
"""
Demo script to demonstrate the streak feature functionality
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config import settings

async def demo_streak_feature():
    """Demonstrate the streak feature functionality"""
    print("=== Daily Streak Feature Demo ===\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Create a sample student streak record
    student_id = "STU20231015SAMPLE"
    sample_streak_data = {
        "student_id": student_id,
        "streak_count": 3,
        "last_click": (datetime.utcnow() - timedelta(hours=26)).isoformat(),  # 26 hours ago
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Insert sample data
    await db.student_streaks.update_one(
        {"student_id": student_id},
        {"$set": sample_streak_data},
        upsert=True
    )
    
    print(f"Created sample streak data for student {student_id}")
    print(f"Streak count: {sample_streak_data['streak_count']}")
    print(f"Last click: {sample_streak_data['last_click']}")
    print(f"(This was 26 hours ago, so they should receive a notification)\n")
    
    # Create a sample student record
    sample_student = {
        "student_id": student_id,
        "name": "Demo Student",
        "user_email": "demo.student@example.com"
    }
    
    await db.students.update_one(
        {"student_id": student_id},
        {"$set": sample_student},
        upsert=True
    )
    
    print("Created sample student record")
    print(f"Name: {sample_student['name']}")
    print(f"Email: {sample_student['user_email']}\n")
    
    print("The background task would now check for streak notifications.")
    print("Since the last click was more than 24 hours ago,")
    print("an email notification would be sent to demo.student@example.com")
    print("reminding them to maintain their streak.\n")
    
    # Close database connection
    client.close()
    
    print("=== Demo Complete ===")
    print("\nTo test the actual email functionality:")
    print("1. Configure email settings in backend/.env")
    print("2. Run the backend server")
    print("3. The background task will automatically check for streak notifications every hour")

if __name__ == "__main__":
    asyncio.run(demo_streak_feature())