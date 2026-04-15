from typing import List, Optional
from bson import ObjectId
from app.database import get_database
from app.models.student import Student, StudentCreate, StudentUpdate, Intervention, InterventionCreate
from datetime import datetime, timezone

class StudentService:
    def __init__(self):
        self.collection_name = "students"
        self.interventions_collection = "interventions"

    async def create_student(self, student_data: StudentCreate, user_email: str = None) -> Student:
        """Create a new student"""
        db = await get_database()
        
        # Check if student_id already exists
        existing_student = await db[self.collection_name].find_one({"student_id": student_data.student_id})
        if existing_student:
            raise ValueError(f"Student with ID {student_data.student_id} already exists")
        
        student_dict = student_data.dict()
        student_dict["created_at"] = datetime.now(timezone.utc)
        student_dict["updated_at"] = datetime.now(timezone.utc)
        
        # Link to user if email provided
        if user_email:
            student_dict["user_email"] = user_email
        
        result = await db[self.collection_name].insert_one(student_dict)
        created_student = await db[self.collection_name].find_one({"_id": result.inserted_id})
        
        # If user_email provided, update user record with student_id
        if user_email:
            await db.users.update_one(
                {"email": user_email},
                {
                    "$set": {
                        "student_id": student_data.student_id,
                        "form_completed": True,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
        
        # Convert ObjectId to string for Pydantic
        if created_student and "_id" in created_student:
            created_student["_id"] = str(created_student["_id"])
        
        return Student(**created_student)

    async def get_student_by_id(self, student_id: str) -> Optional[Student]:
        """Get student by ObjectId"""
        db = await get_database()
        
        if ObjectId.is_valid(student_id):
            student = await db[self.collection_name].find_one({"_id": ObjectId(student_id)})
        else:
            student = await db[self.collection_name].find_one({"student_id": student_id})
            
        if student:
            # Convert ObjectId to string for Pydantic
            if "_id" in student:
                student["_id"] = str(student["_id"])
            return Student(**student)
        return None

    async def get_student_by_student_id(self, student_id: str) -> Optional[Student]:
        """Get student by student_id field"""
        db = await get_database()
        student = await db[self.collection_name].find_one({"student_id": student_id})
        
        if student:
            # Convert ObjectId to string for Pydantic
            if "_id" in student:
                student["_id"] = str(student["_id"])
            return Student(**student)
        return None

    async def get_student_by_user_email(self, user_email: str) -> Optional[Student]:
        """Get student by user email"""
        db = await get_database()
        student = await db[self.collection_name].find_one({"user_email": user_email})
        
        if student:
            # Convert ObjectId to string for Pydantic
            if "_id" in student:
                student["_id"] = str(student["_id"])
            return Student(**student)
        return None

    async def get_all_students(self, skip: int = 0, limit: int = 100) -> List[Student]:
        """Get all students with pagination"""
        db = await get_database()
        cursor = db[self.collection_name].find().skip(skip).limit(limit)
        students = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for each student
        for student in students:
            if "_id" in student:
                student["_id"] = str(student["_id"])
        
        return [Student(**student) for student in students]

    async def update_student(self, student_id: str, student_update: StudentUpdate) -> Optional[Student]:
        """Update student information"""
        db = await get_database()
        
        update_data = {k: v for k, v in student_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        if ObjectId.is_valid(student_id):
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(student_id)}, 
                {"$set": update_data}
            )
        else:
            result = await db[self.collection_name].update_one(
                {"student_id": student_id}, 
                {"$set": update_data}
            )
        
        if result.modified_count:
            return await self.get_student_by_id(student_id)
        return None

    async def update_student_prediction(self, student_id: str, dropout_probability: float, risk_level: str) -> bool:
        """Update student's dropout prediction"""
        db = await get_database()
        
        update_data = {
            "dropout_probability": dropout_probability,
            "risk_level": risk_level,
            "updated_at": datetime.now(timezone.utc)
        }
        
        if ObjectId.is_valid(student_id):
            result = await db[self.collection_name].update_one(
                {"_id": ObjectId(student_id)}, 
                {"$set": update_data}
            )
        else:
            result = await db[self.collection_name].update_one(
                {"student_id": student_id}, 
                {"$set": update_data}
            )
        
        return result.modified_count > 0

    async def delete_student(self, student_id: str) -> bool:
        """Delete a student"""
        db = await get_database()
        
        if ObjectId.is_valid(student_id):
            result = await db[self.collection_name].delete_one({"_id": ObjectId(student_id)})
        else:
            result = await db[self.collection_name].delete_one({"student_id": student_id})
        
        return result.deleted_count > 0

    async def get_students_by_risk_level(self, risk_level: str) -> List[Student]:
        """Get students by risk level"""
        db = await get_database()
        cursor = db[self.collection_name].find({"risk_level": risk_level})
        students = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for each student
        for student in students:
            if "_id" in student:
                student["_id"] = str(student["_id"])
        
        return [Student(**student) for student in students]

    async def get_student_count(self) -> int:
        """Get total student count"""
        db = await get_database()
        return await db[self.collection_name].count_documents({})

    # Intervention methods
    async def create_intervention(self, intervention_data: InterventionCreate) -> Intervention:
        """Create a new intervention"""
        db = await get_database()
        
        intervention_dict = intervention_data.dict()
        intervention_dict["created_at"] = datetime.now(timezone.utc)
        
        result = await db[self.interventions_collection].insert_one(intervention_dict)
        created_intervention = await db[self.interventions_collection].find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string for Pydantic
        if created_intervention and "_id" in created_intervention:
            created_intervention["_id"] = str(created_intervention["_id"])
        
        return Intervention(**created_intervention)

    async def get_interventions_by_student(self, student_id: str) -> List[Intervention]:
        """Get all interventions for a student"""
        db = await get_database()
        cursor = db[self.interventions_collection].find({"student_id": student_id})
        interventions = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for each intervention
        for intervention in interventions:
            if "_id" in intervention:
                intervention["_id"] = str(intervention["_id"])
        
        return [Intervention(**intervention) for intervention in interventions]

    async def get_all_interventions(self) -> List[Intervention]:
        """Get all interventions"""
        db = await get_database()
        cursor = db[self.interventions_collection].find()
        interventions = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for each intervention
        for intervention in interventions:
            if "_id" in intervention:
                intervention["_id"] = str(intervention["_id"])
        
        return [Intervention(**intervention) for intervention in interventions]

student_service = StudentService()