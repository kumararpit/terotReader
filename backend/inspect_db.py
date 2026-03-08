import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

def inspect():
    try:
        url = os.getenv("MONGO_URL")
        db_name = os.getenv("DB_NAME", "tarot_db")
        client = pymongo.MongoClient(url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        print(f"Total bookings: {db.bookings.count_documents({})}")
        
        # Check counts by status
        print("\nCounts by 'status':")
        for res in db.bookings.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]):
            print(f"Status: {res['_id']} -> Count: {res['count']}")
            
        print("\nCounts by 'payment_status':")
        for res in db.bookings.aggregate([{"$group": {"_id": "$payment_status", "count": {"$sum": 1}}}]):
            print(f"Payment Status: {res['_id']} -> Count: {res['count']}")
            
        print("\nSample Pending Record:")
        sample = db.bookings.find_one({"payment_status": {"$ne": "paid"}})
        if sample:
            print(f"ID: {sample.get('booking_id')}, Status: {sample.get('status')}, Payment Status: {sample.get('payment_status')}")
        else:
            print("No non-paid records found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    inspect()
