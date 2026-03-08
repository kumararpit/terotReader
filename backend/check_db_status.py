import motor.motor_asyncio
import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

async def check():
    try:
        url = os.getenv("MONGO_URL")
        if not url:
            print("Error: MONGO_URL not found")
            return
            
        db_name = os.getenv("DB_NAME", "tarot_db")
        client = motor.motor_asyncio.AsyncIOMotorClient(url)
        db = client[db_name]
        
        # Check if collection exists and has documents
        count = await db.bookings.count_documents({})
        print(f"Total bookings in DB: {count}")
        
        if count == 0:
            return

        pipeline = [
            {"$group": {"_id": {"status": "$status", "payment_status": "$payment_status"}, "count": {"$sum": 1}}}
        ]
        results = await db.bookings.aggregate(pipeline).to_list(length=100)
        print("Database Status Summary:")
        for res in results:
            s = res['_id'].get('status', 'MISSING')
            ps = res['_id'].get('payment_status', 'MISSING')
            print(f"Status: {s}, Payment Status: {ps} -> Count: {res['count']}")
            
    except Exception as e:
        print(f"Error in script: {e}")

if __name__ == '__main__':
    asyncio.run(check())
