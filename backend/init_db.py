import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DB_INIT")

# Load Env
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")

def init_db():
    print("DEBUG: Script started")
    if not MONGO_URL:
        logger.error("MONGO_URL not found in environment variables")
        return
    print(f"DEBUG: MongoDB URL found (starts with {MONGO_URL[:10]}...)")
    
    logger.info("Connecting to MongoDB Atlas...")
    try:
        # 5 second timeout
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # Force connection check
        client.admin.command('ping')
        print("DEBUG: Connection Successful!")
    except Exception as e:
        logger.error(f"Failed to connect: {e}")
        return

    db = client.tarot_db

    # --- 1. USERS Collection ---
    logger.info("Initializing 'users' collection...")
    db.users.create_index("username", unique=True)
    db.users.create_index("email", unique=True)

    # --- 2. BOOKINGS Collection ---
    logger.info("Initializing 'bookings' collection...")
    db.bookings.create_index("booking_id", unique=True)
    db.bookings.create_index("email")
    db.bookings.create_index("preferred_date")

    # --- 3. SLOTS Collection ---
    logger.info("Initializing 'slots' collection...")
    db.slots.create_index([("date", 1), ("time", 1)])
    db.slots.create_index([("date", 1), ("time", 1)], unique=True)
    
    # --- 4. OTPs Collection ---
    logger.info("Initializing 'otps' collection...")
    db.otps.create_index("email", unique=True)
    db.otps.create_index("created_at", expireAfterSeconds=600)
    
    # --- 5. STATUS CHECKS Collection ---
    logger.info("Initializing 'status_checks' collection...")
    db.status_checks.create_index([("timestamp", -1)])

    logger.info("Database Initialization Complete.")
    logger.info("Collections created and Indexes applied successfully.")

if __name__ == "__main__":
    init_db()
