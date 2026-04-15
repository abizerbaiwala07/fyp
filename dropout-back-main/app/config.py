import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "student_dropout_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CORS_ORIGINS: list = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://dropout-front-29gn-offhna73k-shlok2.vercel.app",
        "https://dropout-front-29gn-offhna73k-shlok2345788s-projects-2muenie8c.vercel.app",
        "https://dropout-front-29gn-offhna73k-shlok2345788s-projects-l995hi6xk.vercel.app",
        "https://dropout-front-29gn.vercel.app",
        "https://dropout-front-29gn-ivwe2igbm.vercel.app",
        # Allow Netlify and all subdomains of vercel.app for flexibility
        "https://*.vercel.app",
        "https://*.netlify.app"
    ]

    # OAuth / Firebase settings
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    
    # Clerk settings
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")
    
    # JWT settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    
    # ML Model settings
    MODEL_PATH: str = "ml_model/dropout_model.joblib"
    SCALER_PATH: str = "ml_model/scaler.joblib"

settings = Settings()