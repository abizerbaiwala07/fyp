from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def get_database():
    if db.database is None:
        raise Exception("Database not initialized. Please ensure MONGODB_URL is correct and MongoDB is running.")
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000, # 5 seconds timeout
            connectTimeoutMS=5000
        )
        # Check connection
        await db.client.admin.command('ping')
        db.database = db.client[settings.DATABASE_NAME]
        print(f"Successfully connected to MongoDB at {settings.MONGODB_URL}")
    except Exception as e:
        print(f"CRITICAL: Failed to connect to MongoDB: {e}")
        db.client = None
        db.database = None
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")  