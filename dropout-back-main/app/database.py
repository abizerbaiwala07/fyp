import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import certifi

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def get_database():
    if db.database is None:
        # Try to connect if not connected
        try:
            await connect_to_mongo()
        except Exception as e:
            raise Exception(f"Database not initialized. Failed to connect: {e}")
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    try:
        # For Atlas connections, some environments need specific SSL/TLS settings
        kwargs = {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
        }
        
        # Add SSL/TLS options if it's an Atlas connection
        if "mongodb+srv" in settings.MONGODB_URL:
            kwargs["tls"] = True
            kwargs["tlsAllowInvalidCertificates"] = True
            # Use certifi for macOS SSL issues
            kwargs["tlsCAFile"] = certifi.where()
            
        db.client = AsyncIOMotorClient(settings.MONGODB_URL, **kwargs)
        
        # Check connection
        await db.client.admin.command('ping')
        db.database = db.client[settings.DATABASE_NAME]
        print(f"Successfully connected to MongoDB at {settings.MONGODB_URL}")
    except Exception as e:
        print(f"CRITICAL: Failed to connect to MongoDB: {e}")
        db.client = None
        db.database = None
        # Don't raise here, let the application start so we can see logs
        # The get_database() will handle the missing connection

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")
