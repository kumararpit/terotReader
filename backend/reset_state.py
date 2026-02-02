import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from calendar_service import calendar_service

# MongoDB Connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'tarot_db')

async def reset_db():
    print(f"Connecting to MongoDB: {MONGO_URL} ({DB_NAME})")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # 1. Clear Collections
    collections = ['bookings', 'slots', 'status_checks', 'testimonials']
    for col_name in collections:
        count = await db[col_name].count_documents({})
        if count > 0:
            await db[col_name].drop()
            print(f"Dropped collection '{col_name}' ({count} documents).")
        else:
            print(f"Collection '{col_name}' is already empty.")

    print("MongoDB reset complete.")

def reset_calendar():
    print("Resetting Google Calendar Events...")
    # Fetch events for a wide range (e.g., next 1 year)
    start_iso = datetime.now().isoformat() + 'Z'
    end_iso = (datetime.now() + timedelta(days=365)).isoformat() + 'Z'
    
    events = calendar_service.list_events(start_iso, end_iso)
    print(f"Found {len(events)} events in Calendar.")
    
    deleted_count = 0
    for event in events:
        summary = event.get('summary', '')
        # Delete if it matches our system's signatures
        if "REGULAR_TIMING" in summary or "EMERGENCY_TIMING" in summary or "BOOKED:" in summary or "Antigravity" in event.get('description', ''):
            print(f"Deleting event: {summary} ({event['start'].get('dateTime', 'No Date')})")
            calendar_service.delete_event(event['id'])
            deleted_count += 1
            
    print(f"Calendar reset complete. Deleted {deleted_count} system-related events.")

if __name__ == "__main__":
    # Run Async DB Reset
    asyncio.run(reset_db())
    
    # Run Sync Calendar Reset
    try:
        reset_calendar()
    except Exception as e:
        print(f"Calendar reset failed: {e}")
