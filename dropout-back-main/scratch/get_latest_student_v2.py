import asyncio
import sys
import os
import json
from bson import ObjectId

# Ensure 'app' module can be found
sys.path.append(os.getcwd())

from app.database import get_database, connect_to_mongo
from app.config import settings

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

async def run():
    # Force a connection
    await connect_to_mongo()
    db = await get_database()
    
    if db is None:
        print("Database connection failed")
        return

    # Find the most recent student
    student = await db.students.find_one(sort=[('_id', -1)])
    if student:
        print(json.dumps(student, cls=JSONEncoder, indent=2))
    else:
        print("No student found")

if __name__ == "__main__":
    asyncio.run(run())
