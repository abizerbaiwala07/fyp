import asyncio
import os
import sys
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.email_service import email_service
from app.config import settings

async def test_streak_notification():
    """Test the streak notification functionality"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        
        # Test sending a streak reminder email
        test_email = "test@example.com"
        test_name = "Test Student"
        test_streak = 5
        
        print(f"Sending test email to {test_email}...")
        result = await email_service.send_streak_reminder_email(test_email, test_name, test_streak)
        
        if result:
            print("Email sent successfully!")
        else:
            print("Failed to send email")
            
        # Test checking streak notifications
        print("Checking streak notifications...")
        result = await email_service.check_and_send_streak_notifications(db)
        
        if result:
            print("Streak notification check completed!")
        else:
            print("Failed to check streak notifications")
            
        # Close database connection
        client.close()
        
    except Exception as e:
        print(f"Error in test: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_streak_notification())