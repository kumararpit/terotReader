import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    mongo_url = os.getenv('MONGO_URL')
    if not mongo_url:
        print("MONGO_URL missing")
        return

    client = AsyncIOMotorClient(mongo_url)
    db_name = os.getenv('DB_NAME', 'tarot_db')
    db = client[db_name]
    
    users = await db.users.find().to_list(100)
    print(f"Total Users Found: {len(users)}")
    for u in users:
        print(f"User: {u.get('username')}, Email: {u.get('email')}")

if __name__ == "__main__":
    asyncio.run(check())
