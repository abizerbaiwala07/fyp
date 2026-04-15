from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from app.database import get_database
from app.models.student import Student
from bson import ObjectId

class GamificationService:
    def __init__(self):
        # 100 XP per level
        self.XP_PER_LEVEL = 100

    def calculate_quiz_rewards(self, score_pct: float, time_taken: float, num_questions: int) -> Dict[str, Any]:
        """
        Calculate XP and bonuses based on quiz performance.
        """
        xp_earned = 0
        bonuses = []

        # 1. Base XP based on score
        if score_pct >= 90:
            xp_earned = 100
        elif score_pct >= 75:
            xp_earned = 75
        elif score_pct >= 50:
            xp_earned = 50
        else:
            xp_earned = 20

        # 2. Perfect Score Bonus
        if score_pct == 100:
            xp_earned += 20
            bonuses.append({"type": "perfect_score", "xp": 20, "label": "Perfect Score!"})

        # 3. Speed Bonus
        avg_time_per_q = time_taken / num_questions if num_questions > 0 else 100
        if avg_time_per_q < 15 and score_pct >= 50:
            xp_earned += 10
            bonuses.append({"type": "speed_bonus", "xp": 10, "label": "Speed Demon!"})

        return {
            "xp_earned": xp_earned,
            "bonuses": bonuses
        }

    async def update_student_gamification(self, student_id: str, action_type: str, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Centralized method to update student XP, Level, Streak, etc.
        action_type can be 'quiz', 'quest', 'study_session'
        """
        db = await get_database()
        student_doc = await db.students.find_one({"student_id": student_id})
        
        if not student_doc:
            return {"success": False, "error": "Student not found"}

        # Current state
        current_xp = student_doc.get("xp", 0)
        current_level = student_doc.get("current_level", 1)
        total_hours = student_doc.get("total_study_hours", 0.0)
        daily_hours = student_doc.get("daily_study_hours", 0.0)
        streak = student_doc.get("streak", 0)
        last_date_str = student_doc.get("last_study_date")
        
        xp_to_add = 0
        hours_to_add = 0.0
        new_badges = []
        feedback_messages = []

        today = date.today()
        today_str = today.isoformat()

        # 1. Action Specific Logic
        if action_type == "quiz":
            score_pct = action_data.get("score_pct", 0)
            time_taken = action_data.get("time_taken", 0)
            num_questions = action_data.get("num_questions", 1)
            rewards = self.calculate_quiz_rewards(score_pct, time_taken, num_questions)
            xp_to_add = rewards["xp_earned"]
            feedback_messages.append(f"+{xp_to_add} XP from Quiz 🎉")
            for b in rewards["bonuses"]:
                feedback_messages.append(f"Bonus: {b['label']} (+{b['xp']} XP)")
                xp_to_add += b['xp']
            
            # Save quiz result to performance_data
            performance_entry = {
                "subject": action_data.get("subject", "General"),
                "score": score_pct,
                "date": today_str,
                "difficulty": action_data.get("difficulty", "Medium")
            }
            await db.students.update_one(
                {"student_id": student_id},
                {"$push": {"performance_data": performance_entry}}
            )

        elif action_type == "quest":
            xp_to_add = action_data.get("xp_reward", 0)
            # As per requirements: add 2 hours to totalStudyHours automatically
            hours_to_add = 2.0 
            feedback_messages.append(f"+{xp_to_add} XP from Quest Progress 🚀")
            feedback_messages.append(f"+2 hours added to Study Time ⏱")
            
            # Save to completed_challenges
            quest_id = action_data.get("quest_id")
            if quest_id:
                await db.students.update_one(
                    {"student_id": student_id},
                    {"$addToSet": {"completed_challenges": quest_id}}
                )

        elif action_type == "study_session":
            hours_to_add = action_data.get("hours", 0.0)
            xp_to_add = int(hours_to_add * 10) # 10 XP per hour
            feedback_messages.append(f"+{xp_to_add} XP for {hours_to_add}h study session 📚")

        elif action_type == "quest_timer":
            time_spent_min = action_data.get("time_spent", 0.0)
            hours_to_add = time_spent_min / 60.0
            xp_to_add = int(time_spent_min * (50 / 60)) # 50 XP per hour
            feedback_messages.append(f"+{xp_to_add} XP for {round(hours_to_add, 2)}h focused study ⏱")
            
            # Save quest completion if applicable
            quest_id = action_data.get("quest_id")
            if quest_id and action_data.get("is_completed"):
                await db.students.update_one(
                    {"student_id": student_id},
                    {"$addToSet": {"completed_challenges": quest_id}}
                )
                feedback_messages.append("Quest Completed! 🏆")

        # 2. Streak Logic
        streak_updated = False
        if last_date_str:
            last_date = date.fromisoformat(last_date_str)
            if last_date == today - timedelta(days=1):
                streak += 1
                streak_updated = True
                feedback_messages.append(f"Streak increased to {streak} 🔥")
            elif last_date < today - timedelta(days=1):
                streak = 1
                streak_updated = True
                feedback_messages.append("Streak reset to 1 🔄")
            # If last_date == today, streak is already handled for today
        else:
            streak = 1
            streak_updated = True
            feedback_messages.append("First study day! Streak: 1 🔥")

        # 3. Calculate New Level
        new_total_xp = current_xp + xp_to_add
        new_level = (new_total_xp // self.XP_PER_LEVEL) + 1
        level_up = new_level > current_level
        if level_up:
            feedback_messages.append(f"LEVEL UP! You are now Level {new_level} 🏆")

        # 4. Update Daily/Total Hours
        if last_date_str != today_str:
            daily_hours = hours_to_add
        else:
            daily_hours += hours_to_add
        total_hours += hours_to_add

        # 5. Check Badges
        # Simplified badge checking (could be more complex)
        existing_badges = student_doc.get("badges", [])
        unlocked_badge_ids = {b["id"] for b in existing_badges}
        
        potential_badges = [
            {"id": "first_steps", "title": "First Steps", "icon": "👶", "condition": lambda s: True},
            {"id": "study_bird", "title": "Early Bird", "icon": "🌅", "condition": lambda s: s.get("total_study_hours", 0) >= 10},
            {"id": "streak_5", "title": "Consistent", "icon": "🔥", "condition": lambda s: s.get("streak", 0) >= 5},
            {"id": "level_5", "title": "High Achiever", "icon": "👑", "condition": lambda s: (s.get("xp", 0) // 100 + 1) >= 5}
        ]

        # Temp dict for condition checking
        current_state = {
            "total_study_hours": total_hours,
            "streak": streak,
            "xp": new_total_xp
        }

        for badge in potential_badges:
            if badge["id"] not in unlocked_badge_ids and badge["condition"](current_state):
                new_badge = {
                    "id": badge["id"],
                    "title": badge["title"],
                    "icon": badge["icon"],
                    "unlocked_at": today_str
                }
                new_badges.append(new_badge)
                feedback_messages.append(f"New Badge Unlocked: {badge['title']} {badge['icon']}!")

        # 6. Final Update to Database
        update_fields = {
            "xp": new_total_xp,
            "current_level": new_level,
            "total_study_hours": total_hours,
            "daily_study_hours": daily_hours,
            "streak": streak,
            "last_study_date": today_str,
            "updated_at": datetime.utcnow()
        }
        
        # Only push badges if there are new ones
        update_query = {"$set": update_fields}
        if new_badges:
            update_query["$push"] = {"badges": {"$each": new_badges}}

        await db.students.update_one({"student_id": student_id}, update_query)

        # 7. Sync Sync Sync - update dashboard data too for legacy support
        # We want everything in students collection eventually, but let's keep it synced for now
        await db.student_dashboard_data.update_one(
            {"student_id": student_id},
            {"$set": {
                "data.current_xp": new_total_xp,
                "data.current_level": new_level,
                "data.study_streak": streak,
                "data.total_study_time": total_hours,
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )

        return {
            "success": True,
            "xp_gained": xp_to_add,
            "new_xp": new_total_xp,
            "new_level": new_level,
            "level_up": level_up,
            "streak": streak,
            "total_hours": total_hours,
            "new_badges": new_badges,
            "feedback": feedback_messages
        }

gamification_service = GamificationService()
