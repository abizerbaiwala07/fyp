from typing import List, Dict, Any
from datetime import datetime

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

        # 3. Speed Bonus (e.g., average less than 15 seconds per question)
        avg_time_per_q = time_taken / num_questions if num_questions > 0 else 100
        if avg_time_per_q < 15 and score_pct >= 50:
            xp_earned += 10
            bonuses.append({"type": "speed_bonus", "xp": 10, "label": "Speed Demon!"})

        return {
            "xp_earned": xp_earned,
            "bonuses": bonuses
        }

    def update_level_progress(self, current_xp: int, xp_gained: int) -> Dict[str, Any]:
        """
        Calculate new level and progress after gaining XP.
        """
        new_total_xp = current_xp + xp_gained
        new_level = (new_total_xp // self.XP_PER_LEVEL) + 1
        xp_in_level = new_total_xp % self.XP_PER_LEVEL
        
        return {
            "total_xp": new_total_xp,
            "current_level": new_level,
            "xp_in_current_level": xp_in_level,
            "xp_required_for_next": self.XP_PER_LEVEL,
            "progress_pct": (xp_in_level / self.XP_PER_LEVEL) * 100
        }

    def check_achievements(self, quiz_count: int, score_pct: float, existing_achievements: List[Dict]) -> List[Dict]:
        """
        Check if any new achievements should be unlocked.
        """
        new_badges = []
        unlocked_ids = {a["id"] for a in existing_achievements if a.get("unlocked")}

        achievements_to_check = [
            {"id": "first_quiz", "title": "First Step", "desc": "Completed your first quiz!", "icon": "🎓"},
            {"id": "perfect_score", "title": "Precision", "desc": "Got a 100% score on a quiz!", "icon": "🎯"},
            {"id": "quiz_master", "title": "Quiz Master", "desc": "Completed 5 quizzes!", "icon": "🧙‍♂️"},
        ]

        if "first_quiz" not in unlocked_ids and quiz_count >= 1:
            new_badges.append(achievements_to_check[0])

        if "perfect_score" not in unlocked_ids and score_pct == 100:
            new_badges.append(achievements_to_check[1])

        if "quiz_master" not in unlocked_ids and quiz_count >= 5:
            new_badges.append(achievements_to_check[2])

        return new_badges

gamification_service = GamificationService()
