import asyncio
import sys
import os

sys.path.append(os.getcwd())

from app.database import get_database, connect_to_mongo

async def run():
    await connect_to_mongo()
    db = await get_database()
    student = await db.students.find_one(sort=[('_id', -1)])
    if student:
        print("---STUDENT_DATA_START---")
        print(f"Name: {student.get('name')}")
        print(f"Study Hours: {student.get('study_hours_per_week') or student.get('study_hours_daily')}")
        print(f"Weak Subjects: {student.get('weak_subjects', 'Mathematics, Physics')}")
        print(f"Strong Subjects: {student.get('strong_subjects', 'Biology, English')}")
        print(f"Target Exam: {student.get('target_exam')}")
        print(f"Current Performance: {student.get('tenth_percentage') or student.get('current_cgpa')}%")
        print(f"Attendance: {student.get('attendance_rate') or student.get('current_attendance')}%")
        print(f"Study Habits: {student.get('study_motivation') or student.get('study_habits')}")
        print(f"Goals: {student.get('career_goal') or 'Become a professional engineer'}")
        print("---STUDENT_DATA_END---")
    else:
        print("No student found")

if __name__ == "__main__":
    asyncio.run(run())
