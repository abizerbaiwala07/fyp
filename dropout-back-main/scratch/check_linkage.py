import motor.motor_asyncio
import asyncio
import os

async def check_data():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['student_dropout_db']
    
    student_id = 'STU202604155UPSJYQH'
    print(f"Checking data for Student ID: {student_id}")
    
    student = await db.students.find_one({'student_id': student_id})
    print(f"STUDENT_DATA: {student}")
    
    user_by_id = await db.users.find_one({'student_id': student_id})
    print(f"USER_DATA_BY_ID: {user_by_id}")
    
    if student and student.get('user_email'):
        user_by_email = await db.users.find_one({'email': student.get('user_email')})
        print(f"USER_DATA_BY_EMAIL: {user_by_email}")
    else:
        print("No user_email found in student record.")

if __name__ == "__main__":
    asyncio.run(check_data())
