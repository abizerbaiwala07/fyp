import asyncio
import sys
import os
sys.path.append(os.getcwd())
from app.database import get_database
import json
from bson import ObjectId

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

async def run():
    db = await get_database()
    student = await db.students.find_one(sort=[('_id', -1)])
    if student:
        print(json.dumps(student, cls=JSONEncoder, indent=2))
    else:
        print("No student found")

if __name__ == "__main__":
    asyncio.run(run())
