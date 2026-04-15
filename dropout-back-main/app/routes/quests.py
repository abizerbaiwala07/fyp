import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from app.database import get_database
from app.services.quest_service import QuestService
from app.models.quest import DailyQuest, QuestSessionStart, QuestSessionEnd
import shutil
from datetime import datetime

router = APIRouter(prefix="/api/quests", tags=["Quests"])

UPLOAD_DIR = "uploads/proofs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/daily", response_model=List[DailyQuest])
async def get_daily_quests(student_id: str, db = Depends(get_database)):
    """Fetch or generate today's quests for a student."""
    print(f"DEBUG: Fetching quests for student: {student_id}")
    return await QuestService.get_daily_quests(db, student_id)

@router.post("/submit/{quest_id}")
async def submit_quest_proof(
    quest_id: str,
    student_id: str = Form(...),
    submission_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db = Depends(get_database)
):
    """Submit proof for a quest (text, image, or file)."""
    submission_data = {}
    
    if submission_text:
        submission_data["submission_text"] = submission_text
        
    file_bytes = None
    file_mime = None

    if file:
        file_bytes = await file.read()
        file_mime = file.content_type
        # Seek back to beginning since we read it
        await file.seek(0)
        
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{student_id}_{quest_id}_{datetime.now().timestamp()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        submission_data["proof_url"] = f"/uploads/proofs/{file_name}"

    if not submission_data:
        raise HTTPException(status_code=400, detail="Empty submission. Please provide text or file proof.")

    result, error = await QuestService.verify_and_complete(
        db, quest_id, student_id, submission_data, 
        file_content=file_bytes, 
        file_type=file_mime
    )
    
    if error:
        raise HTTPException(status_code=400, detail=error)
        
    return result

@router.post("/session/start")
async def start_quest_session(
    student_id: str,
    data: QuestSessionStart,
    db = Depends(get_database)
):
    """Log the start of a quest session."""
    session_id = await QuestService.start_session(db, student_id, data.quest_id, data.expected_duration)
    return {"status": "success", "session_id": session_id}

@router.post("/session/end")
async def end_quest_session(
    student_id: str,
    data: QuestSessionEnd,
    db = Depends(get_database)
):
    """Finalize a quest session and award XP."""
    result = await QuestService.end_session(db, student_id, data.quest_id, data.time_spent, data.is_completed)
    return result
