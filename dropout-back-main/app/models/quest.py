from pydantic import BaseModel, Field
from typing import Optional, Annotated, Literal
from datetime import datetime
from bson import ObjectId

PyObjectId = Annotated[str, Field(description="MongoDB ObjectId as string")]

class DailyQuest(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    student_id: str = Field(..., description="Linked student ID")
    title: str = Field(..., description="Quest title")
    description: str = Field(..., description="Quest details")
    xp_reward: int = Field(..., description="XP awarded on completion")
    quest_type: Literal["image", "file", "text"] = Field(..., description="Type of proof required")
    
    status: Literal["pending", "submitted", "completed", "missed"] = Field(default="pending")
    
    # Submission Data
    proof_url: Optional[str] = Field(None, description="Storage path for image/file proof")
    submission_text: Optional[str] = Field(None, description="Text submission")
    submitted_at: Optional[datetime] = Field(None)
    
    date: str = Field(..., description="Target date in YYYY-MM-DD format")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class QuestSubmission(BaseModel):
    submission_text: Optional[str] = None

class QuestSessionStart(BaseModel):
    quest_id: str
    expected_duration: int = Field(..., description="Expected duration in minutes")

class QuestSessionEnd(BaseModel):
    quest_id: str
    time_spent: float = Field(..., description="Actual time spent in minutes")
    is_completed: bool = Field(default=True)

class QuestSession(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    student_id: str
    quest_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    time_spent: float = 0.0 # in minutes
    xp_earned: int = 0
    status: Literal["active", "completed", "partial"] = "active"
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
