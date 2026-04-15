import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

class EmailService:
    def __init__(self):
        # Get email configuration from environment variables
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL", "")
        self.sender_password = os.getenv("SENDER_PASSWORD", "")
    
    async def send_streak_reminder_email(self, student_email, student_name, streak_count):
        """Send an email reminder to maintain the study streak"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = student_email
            msg['Subject'] = f"Maintain Your Study Streak - {streak_count} Days Strong!"
            
            # Email body
            body = f"""
            Hi {student_name},
            
            We noticed you haven't clicked your daily streak button in the past 24 hours.
            
            Your current streak is {streak_count} days - don't let it break!
            
            Log in to the Academic Focus platform and click your daily streak button to maintain your progress.
            
            Consistency is key to academic success. Keep up the great work!
            
            Best regards,
            Academic Focus Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            text = msg.as_string()
            server.sendmail(self.sender_email, student_email, text)
            server.quit()
            
            print(f"Streak reminder email sent to {student_email}")
            return True
        except Exception as e:
            print(f"Error sending email to {student_email}: {str(e)}")
            return False
    
    async def check_and_send_streak_notifications(self, streak_collection, student_collection):
        """Check all students and send notifications if they haven't clicked streak in 24 hours"""
        try:
            # Get all students with streak data
            students = await streak_collection.find({}).to_list(length=None)
            
            for student_streak in students:
                student_id = student_streak.get("student_id")
                last_click = student_streak.get("last_click")
                streak_count = student_streak.get("streak_count", 0)
                
                if last_click:
                    # Check if 24 hours have passed since last click
                    last_click_time = datetime.fromisoformat(last_click.replace('Z', '+00:00'))
                    now = datetime.now(timezone.utc)
                    time_diff = now - last_click_time
                    
                    # If more than 24 hours have passed and less than 25 hours (to avoid duplicate emails)
                    if timedelta(hours=24) <= time_diff < timedelta(hours=25):
                        # Check if notification was already sent
                        last_notification = student_streak.get("last_notification_sent")
                        should_send_notification = True
                        
                        if last_notification:
                            last_notification_time = datetime.fromisoformat(last_notification.replace('Z', '+00:00'))
                            notification_time_diff = now - last_notification_time
                            # If notification was sent in the last 23-25 hours, don't send again
                            if timedelta(hours=23) <= notification_time_diff < timedelta(hours=25):
                                should_send_notification = False
                        
                        if should_send_notification:
                            # Get student email
                            student_doc = await student_collection.find_one({"student_id": student_id})
                            if student_doc and student_doc.get("user_email"):
                                student_email = student_doc.get("user_email")
                                student_name = student_doc.get("name", "Student")
                                
                                # Send reminder email
                                result = await self.send_streak_reminder_email(student_email, student_name, streak_count)
                                
                                if result:
                                    # Update notification sent time to prevent duplicate emails
                                    await streak_collection.update_one(
                                        {"student_id": student_id},
                                        {"$set": {"last_notification_sent": now.isoformat()}}
                                    )
            
            return True
        except Exception as e:
            print(f"Error checking streak notifications: {str(e)}")
            return False

# Create a singleton instance
email_service = EmailService()