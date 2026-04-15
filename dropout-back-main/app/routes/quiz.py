from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import io
import fitz  # PyMuPDF
from docx import Document
from app.services.ai_service import ai_service
from app.routes.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter()

@router.post("/generate_from_file")
async def generate_quiz_from_file(
    file: UploadFile = File(...),
    difficulty: str = Form("Medium"),
    numQuestions: int = Form(5)
):
    """
    Accepts a document upload, parses the text locally, and requests the AI service
    to generate an interactive JSON quiz structure based on the material.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    filename = file.filename.lower()
    raw_content = await file.read()
    
    extracted_text = ""
    
    try:
        # Determine Parser based on extension
        if filename.endswith(".pdf"):
            doc = fitz.open(stream=raw_content, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text() + " "
            doc.close()
            
        elif filename.endswith(".docx"):
            doc_file = io.BytesIO(raw_content)
            document = Document(doc_file)
            extracted_text = "\n".join([paragraph.text for paragraph in document.paragraphs])
            
        elif filename.endswith(".txt"):
            extracted_text = raw_content.decode("utf-8", errors="ignore")
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")
            
        # Clean up text to reduce token load
        extracted_text = " ".join(extracted_text.split())
        
        if len(extracted_text) < 50:
            raise HTTPException(status_code=400, detail="Not enough readable text found in the document to generate a quiz.")
            
        # Run AI Generation
        quiz_json_array = await ai_service.generate_quiz_from_text(
            text=extracted_text,
            difficulty=difficulty,
            num_questions=numQuestions
        )
        
        return JSONResponse(content={
            "status": "success",
            "quiz_data": quiz_json_array
        })

    except Exception as e:
        print(f"Error Processing File Quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/submit_result")
async def submit_quiz_result(
    result_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Receives quiz outcome, calculates XP/bonuses, updates student dashboard state,
    and returns gamified results + AI feedback.
    """
    from app.services.gamification_service import gamification_service
    from app.database import get_database
    from datetime import datetime
    
    student_id = result_data.get("student_id")
    score_pct = result_data.get("score_pct")
    time_taken = result_data.get("time_taken")
    num_questions = result_data.get("num_questions")
    subject = result_data.get("subject", "General")
    difficulty = result_data.get("difficulty", "Medium")
    
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required")
        
    try:
        db = await get_database()
        
        # 1. Calculate Rewards
        rewards = gamification_service.calculate_quiz_rewards(score_pct, time_taken, num_questions)
        xp_gained = rewards["xp_earned"]
        
        # 2. Get/Initialize Dashboard Data
        doc = await db.student_dashboard_data.find_one({"student_id": student_id})
        if not doc:
            # Initialize if not exists
            data = {
                "exam_scores": [],
                "study_streak": 0,
                "achievements": [],
                "total_study_time": 0,
                "current_xp": 0,
                "current_level": 1
            }
        else:
            data = doc.get("data", {})
            
        # 3. Update Progress
        current_xp = data.get("current_xp", 0)
        progress = gamification_service.update_level_progress(current_xp, xp_gained)
        
        data["current_xp"] = progress["total_xp"]
        data["current_level"] = progress["current_level"]
        
        # 4. Save Score to History
        score_entry = {
            "subject": subject,
            "score": score_pct,
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "difficulty": difficulty
        }
        if "exam_scores" not in data:
            data["exam_scores"] = []
        data["exam_scores"].append(score_entry)
        
        # 5. Check Achievements
        quiz_count = len([s for s in data["exam_scores"] if s.get("score") is not None])
        new_badges = gamification_service.check_achievements(quiz_count, score_pct, data.get("achievements", []))
        
        if "achievements" not in data:
            data["achievements"] = []
            
        for badge in new_badges:
            badge["unlocked"] = True
            badge["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            data["achievements"].append(badge)
            
        # 6. Get AI Feedback
        ai_feedback = await ai_service.generate_quiz_feedback(score_pct, subject, difficulty)
        
        # 7. Persist to DB
        await db.student_dashboard_data.update_one(
            {"student_id": student_id},
            {"$set": {"student_id": student_id, "data": data, "updated_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        
        return {
            "status": "success",
            "xp_gained": xp_gained,
            "bonuses": rewards["bonuses"],
            "new_total_xp": progress["total_xp"],
            "new_level": progress["current_level"],
            "xp_in_level": progress["xp_in_current_level"],
            "progress_pct": progress["progress_pct"],
            "new_badges": new_badges,
            "ai_feedback": ai_feedback
        }
        
    except Exception as e:
        print(f"Error submitting quiz result: {e}")
        raise HTTPException(status_code=500, detail=str(e))
