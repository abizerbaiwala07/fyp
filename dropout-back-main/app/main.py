from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import ValidationError
import asyncio

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
    try:
        await asyncio.wait_for(connect_to_mongo(), timeout=10.0)
    except asyncio.TimeoutError:
        print("CRITICAL: MongoDB connection timed out. Check if MongoDB is running.")
    except Exception as e:
        print(f"CRITICAL: Failed to connect to MongoDB: {e}")
    
    # Train ML model in a background task to avoid blocking startup
    def train_model_in_background():
        try:
            model_info = ml_service.get_model_info()
            if model_info["status"] == "No model trained":
                print("Starting ML model training in background...")
                ml_service.train_model()
                print("ML model training completed successfully")
        except Exception as e:
            print(f"Error training ML model: {e}")
    
    # Start streak notification background task
    start_streak_notification_task()
    
    # Offload training to a separate thread
    asyncio.create_task(asyncio.to_thread(train_model_in_background))
    
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
    allow_origin_regex=r"https://(dropout-front-.*\.vercel\.app|.*\.netlify\.app)",
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

@app.get("/api")
async def root():
    return {
        "message": "Student Dropout Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ml_model": ml_service.get_model_info()["status"]
    }

# Serve frontend build folder in production - MUST BE LAST
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "dropout-front-main", "build")
if os.path.exists(FRONTEND_BUILD_DIR):
    from fastapi.responses import FileResponse
    
    # Static files (JS, CSS, etc.)
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_BUILD_DIR, "static")), name="static")
    
    # Catch-all route to serve index.html for client-side routing
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Exclude /api paths from frontend routing
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API route not found")
            
        # Check if the path exists in the build folder (e.g. logo.png, manifest.json)
        file_path = os.path.join(FRONTEND_BUILD_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Fallback to index.html for all other routes (React Router handles them)
        return FileResponse(os.path.join(FRONTEND_BUILD_DIR, "index.html"))
else:
    print(f"Frontend build directory not found at {FRONTEND_BUILD_DIR}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)