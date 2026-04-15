from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import ValidationError

from app.database import connect_to_mongo, close_mongo_connection
from app.routes import students, ml, tenth_standard
from app.services.ml_service import ml_service
from app.config import settings
from app.tasks.streak_notifications import start_streak_notification_task

# New auth and quest routers
from app.routes import auth, quests
from fastapi.staticfiles import StaticFiles
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    
    # Train ML model if not already trained
    try:
        model_info = ml_service.get_model_info()
        if model_info["status"] == "No model trained":
            print("Training ML model...")
            ml_service.train_model()
            print("ML model trained successfully")
    except Exception as e:
        print(f"Error initializing ML model: {e}")
    
    # Start streak notification background task
    start_streak_notification_task()
    
    yield
    
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Student Dropout Prediction API",
    description="AI-powered system to predict student dropout risk and enable early intervention",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS with comprehensive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex="https://dropout-front-.*\\.vercel\\.app",
    expose_headers=["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"]
)

# Include routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(ml.router)
app.include_router(tenth_standard.router)
app.include_router(quests.router)
from app.routes import quiz
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])

# Serve static files from uploads directory
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "Student Dropout Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ml_model": ml_service.get_model_info()["status"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)