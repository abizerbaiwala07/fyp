import random
from datetime import datetime
from typing import List, Optional
from app.models.quest import DailyQuest
from app.models.student import Student
from bson import ObjectId
from app.services.ai_service import ai_service
import os

class QuestService:
    @staticmethod
    async def get_daily_quests(db, student_id: str) -> List[DailyQuest]:
        """Fetch today's quests, or generate new ones if none exist."""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Check if quests already exist for today
        existing_quests = await db.quests.find({"student_id": student_id, "date": today}).to_list(10)
        
        if existing_quests:
            print(f"DEBUG: Quests found in DB for {student_id}: {len(existing_quests)}")
            # Convert ObjectId to string for Pydantic v1 compatibility
            for q in existing_quests:
                if "_id" in q:
                    q["_id"] = str(q["_id"])
            return [DailyQuest(**q) for q in existing_quests]
        
        print(f"DEBUG: No quests for {student_id} today, generating new ones...")
        # Generator: Create 3 new quests
        # In a real app, these could be pulled from a larger pool or AI-generated
        quest_templates = [
            {"title": "Study Sprint", "description": "Complete a 2-hour focused study session.", "xp_reward": 50, "type": "text"},
            {"title": "Library Visit", "description": "Visit the library and upload a photo of your desk.", "xp_reward": 40, "type": "image"},
            {"title": "Exercise 20", "description": "Solve 20 Math problems and upload the solution file.", "xp_reward": 60, "type": "file"},
            {"title": "Revision Master", "description": "Revise one full chapter and summarize it.", "xp_reward": 45, "type": "text"},
            {"title": "Note Taker", "description": "Take neat handwritten notes for today's lecture.", "xp_reward": 35, "type": "image"},
            {"title": "Document Draft", "description": "Write a draft for your upcoming project report.", "xp_reward": 70, "type": "file"}
        ]
        
        selected = random.sample(quest_templates, 3)
        new_quests = []
        
        for q in selected:
            quest_data = {
                "student_id": student_id,
                "title": q["title"],
                "description": q["description"],
                "xp_reward": q["xp_reward"],
                "quest_type": q["type"],
                "status": "pending",
                "date": today,
                "created_at": datetime.utcnow()
            }
            result = await db.quests.insert_one(quest_data)
            quest_data["_id"] = str(result.inserted_id) # Convert to string for Pydantic
            new_quests.append(DailyQuest(**quest_data))
            
        return new_quests

    @staticmethod
    async def verify_and_complete(db, quest_id: str, student_id: str, submission_data: dict, file_content: bytes = None, file_type: str = None):
        """Verify proof and award XP."""
        # Find the quest
        quest = await db.quests.find_one({"_id": ObjectId(quest_id), "student_id": student_id})
        
        if not quest:
            return None, "Quest not found"
        
        if quest["status"] == "completed":
            return None, "Quest already completed"

        # AI Verification
        print(f"DEBUG: Running AI Verification for quest: {quest['title']}")
        ai_result = await ai_service.verify_quest_proof(
            quest_title=quest["title"],
            quest_desc=quest["description"],
            submission_text=submission_data.get("submission_text"),
            file_content=file_content,
            file_type=file_type
        )

        if not ai_result.get("verified", False):
            print(f"DEBUG: AI Verification FAILED: {ai_result.get('reason')}")
            return None, ai_result.get("reason", "Proof verification failed. Please provide more clear information.")

        print("DEBUG: AI Verification PASSED")
        # Update quest status
        update_data = {
            "status": "completed",
            "submitted_at": datetime.utcnow()
        }
        update_data.update(submission_data)
        
        await db.quests.update_one({"_id": ObjectId(quest_id)}, {"$set": update_data})
        
        # Award rewards to student using centralized GamificationService
        from app.services.gamification_service import gamification_service
        
        rewards_result = await gamification_service.update_student_gamification(
            student_id=student_id,
            action_type="quest",
            action_data={
                "quest_id": quest_id,
                "xp_reward": quest["xp_reward"]
            }
        )
        
        return {
            "status": "completed",
            "xp_awarded": rewards_result.get("xp_gained", 0),
            "new_level": rewards_result.get("new_level"),
            "new_streak": rewards_result.get("streak"),
            "ai_feedback": ai_result.get("reason"),
            "gamification_feedback": rewards_result.get("feedback", [])
        }, None

    @staticmethod
    async def start_session(db, student_id: str, quest_id: str, expected_duration: int):
        """Log the start of a quest session."""
        session_data = {
            "student_id": student_id,
            "quest_id": quest_id,
            "start_time": datetime.utcnow(),
            "expected_duration": expected_duration,
            "status": "active"
        }
        result = await db.quest_sessions.insert_one(session_data)
        return str(result.inserted_id)

    @staticmethod
    async def end_session(db, student_id: str, quest_id: str, time_spent_min: float, is_completed: bool):
        """Finalize a quest session and award XP."""
        # Find the active session
        session = await db.quest_sessions.find_one({
            "student_id": student_id,
            "quest_id": quest_id,
            "status": "active"
        }, sort=[("start_time", -1)])

        if not session:
            # Create a session if it doesn't exist (e.g., refresh issue but time was tracked locally)
            session_id = await QuestService.start_session(db, student_id, quest_id, 0)
            session = {"_id": ObjectId(session_id), "start_time": datetime.utcnow()}

        end_time = datetime.utcnow()
        
        # Award rewards
        from app.services.gamification_service import gamification_service
        rewards_result = await gamification_service.update_student_gamification(
            student_id=student_id,
            action_type="quest_timer",
            action_data={
                "quest_id": quest_id,
                "time_spent": time_spent_min,
                "is_completed": is_completed
            }
        )

        # Update session record
        await db.quest_sessions.update_one(
            {"_id": session["_id"]},
            {"$set": {
                "end_time": end_time,
                "time_spent": time_spent_min,
                "status": "completed" if is_completed else "partial",
                "xp_earned": rewards_result.get("xp_gained", 0)
            }}
        )

        return rewards_result
