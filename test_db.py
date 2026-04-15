import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def test_connection():
    uri = "mongodb+srv://abizerbaiwala_db_user:xSKkCvUUR5Uj516a@cluster0.wpwmek5.mongodb.net/student_dropout_db?retryWrites=true&w=majority&appName=Cluster0"
    print(f"Testing connection to: {uri}")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command('ping')
        print("Ping successful!")
    except Exception as e:
        print(f"Ping failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
