import asyncio
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from calendar_service import calendar_service
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load env variables (same as server.py)
load_dotenv()

# Setup Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("reset_data")

async def reset_db():
    mongo_url = os.getenv('MONGO_URL')
    if not mongo_url:
        logger.error("MONGO_URL not set! Check .env file.")
        return

    logger.info(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.getenv('DB_NAME', 'tarot_db')
    db = client[db_name]

    # Delete Collections
    # We delete Bookings and Slots (created by tests/usage)
    # We KEEP Users (Admin login) and potentially Testimonials if they want manual keeping.
    # But usually 'reset' implies clearing transaction data.
    
    logger.info("Dropping 'bookings' collection...")
    await db.bookings.drop()
    
    logger.info("Dropping 'slots' collection...")
    await db.slots.drop()
    
    # Also drop status_checks (health checks)
    logger.info("Dropping 'status_checks' collection...")
    await db.status_checks.drop()
    
    # logger.info("Dropping 'otps' collection...") # Optional, usually specific to auth flow state
    await db.otps.drop()

    logger.info("Database reset complete.")

def reset_calendar():
    logger.info("Scanning Google Calendar for events...")
    
    # Range: Past 1 year to Future 1 year
    start_iso = (datetime.utcnow() - timedelta(days=365)).isoformat() + 'Z'
    end_iso = (datetime.utcnow() + timedelta(days=365)).isoformat() + 'Z'
    
    events = calendar_service.list_events(start_iso, end_iso)
    logger.info(f"Found {len(events)} events in the last/next year.")
    
    deleted_count = 0
    for event in events:
        eid = event['id']
        summary = event.get('summary', '') or ''
        
        # Safe Delete: Only delete items created by our system
        # Our System prefixes: "BOOKED:", "REGULAR_TIMING", "EMERGENCY_TIMING", "[EMERGENCY]"
        # Or we can ask user if they want to wipe everything.
        # User said "delete all the test data". 
        # Risky to delete user's personal events if they mixed calendar usage.
        # I will strictly filter for OUR data patterns.
        
        should_delete = False
        if "BOOKED:" in summary: should_delete = True
        if "REGULAR_TIMING" in summary: should_delete = True
        if "EMERGENCY_TIMING" in summary: should_delete = True
        if "[EMERGENCY]" in summary: should_delete = True
        
        if should_delete:
             logger.info(f"Deleting event: {summary} ({eid})")
             calendar_service.delete_event(eid)
             deleted_count += 1
        else:
             logger.warning(f"Skipping event (Unknown Pattern): {summary}")
             
    logger.info(f"Calendar reset complete. Deleted {deleted_count} events.")

if __name__ == "__main__":
    print("WARNING: This script will DELETE all Bookings, Slots, and Calendar Events created by this app.")
    print("It will NOT delete Admin Users or Testimonials.")
    confirm = input("Type 'DELETE' to confirm: ")
    
    if confirm == 'DELETE':
        # Run Calendar Sync
        reset_calendar()
        
        # Run DB Async
        asyncio.run(reset_db())
        print("Data Reset Successfully.")
    else:
        print("Operation Aborted.")
