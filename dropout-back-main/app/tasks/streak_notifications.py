import asyncio
import os
from datetime import datetime
from app.database import get_database
from app.services.email_service import email_service

async def run_streak_notification_check():
    """Run the streak notification check periodically"""
    while True:
        try:
            # Get database connection
            db = await get_database()
            
            # Get collections
            streak_collection = db.student_streaks
            student_collection = db.students
            
            # Check and send streak notifications
            await email_service.check_and_send_streak_notifications(streak_collection, student_collection)
            
            # Wait for 1 hour before next check
            await asyncio.sleep(3600)  # 1 hour in seconds
        except Exception as e:
            print(f"Error in streak notification check: {str(e)}")
            # Wait for 1 hour even if there's an error
            await asyncio.sleep(3600)

# Function to start the background task
def start_streak_notification_task():
    """Start the streak notification background task"""
    asyncio.create_task(run_streak_notification_check())