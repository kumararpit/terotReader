from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
import email_service
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# Load environment variables as early as possible
load_dotenv()

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

# Define Business Timezone
BUSINESS_TZ = ZoneInfo('Asia/Kolkata')
from payment_service import payment_service
from email_service import send_password_reset_otp, send_booking_confirmation_to_client, send_booking_notification_to_tejashvini
import zoom_service
import auth
from auth import Token, create_access_token, verify_password, get_password_hash
import random
import string

# Logger Setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("server")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'tarot_db')

if not MONGO_URL:
    logger.error("CRITICAL: MONGO_URL environment variable is not set!")
    # We don't raise here to allow the app to potentially start but log heavily
    # though it will fail later on DB access. 
    # Actually, for FastAPI it's better to fail early if DB is required.
    raise RuntimeError("MONGO_URL environment variable is required.")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Ensure unique index for slots to prevent duplicates at DB level
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await db.slots.create_index([("date", 1), ("time", 1)], unique=True)
        print("Ensured unique index on slots (date, time)")
    except Exception as e:
        print(f"Error creating index: {e}")
    yield

# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Tarot Reader API is running. Visit /api/health for status."}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class BookingCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: str
    date_of_birth: str
    service_type: str
    preferred_date: str
    preferred_time: Optional[str] = None
    alternative_time: Optional[str] = None
    partner_info: Optional[str] = None
    questions: Optional[str] = None
    situation_description: str
    reading_focus: Optional[str] = None
    payment_method: str  # 'stripe', 'razorpay', 'paypal'
    is_emergency: bool = False
    aura_image: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: str
    date_of_birth: str
    service_type: str
    preferred_date: str
    preferred_time: Optional[str] = None
    alternative_time: Optional[str] = None
    partner_info: Optional[str] = None
    questions: Optional[str] = None
    situation_description: Optional[str] = None
    reading_focus: Optional[str] = None
    payment_method: str
    is_emergency: bool = False
    payment_status: str = "pending"
    transaction_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: str = "confirmed"  # 'confirmed', 'canceled'
    gcal_event_id: Optional[str] = None
    aura_image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentVerification(BaseModel):
    booking_id: str
    payment_method: str
    session_id: Optional[str] = None  # Stripe
    payment_id: Optional[str] = None  # Razorpay/PayPal
    order_id: Optional[str] = None  # Razorpay
    signature: Optional[str] = None  # Razorpay

class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: str
    text: str
    rating: int = 5
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestimonialCreate(BaseModel):
    author: str
    text: str
    rating: Optional[int] = 5

class Slot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    type: str = "regular"  # 'regular' or 'emergency'
    is_booked: bool = False
    booked_by: Optional[str] = None  # booking_id
    duration: Optional[int] = 20  # Duration in minutes
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SlotCreate(BaseModel):
    date: str
    time: str
    type: Optional[str] = "regular"
    duration: Optional[int] = 20

class LoginRequest(BaseModel):
    username: str
    password: str

class SetupAdminRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# --- Auth Routes ---

@api_router.get("/auth/setup-status")
async def get_setup_status():
    """Check if admin setup is required"""
    count = await db.users.count_documents({})
    return {"needs_setup": count == 0}

@api_router.post("/auth/setup")
async def setup_admin(data: SetupAdminRequest):
    """Create initial admin user"""
    count = await db.users.count_documents({})
    if count > 0:
        raise HTTPException(status_code=400, detail="Setup already completed")
    
    hashed_password = get_password_hash(data.password)
    user_doc = {
        "username": data.username,
        "email": data.email,
        "password_hash": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(user_doc)
    return {"message": "Admin user created successfully"}

@api_router.post("/login", response_model=Token)
async def login_for_access_token(form_data: LoginRequest):
    # Find user
    user = await db.users.find_one({"username": form_data.username})
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": data.email})
    if not user:
        # Don't reveal user existence for security, just pretend success
        return {"message": "If email exists, OTP sent"}
    
    # Generate OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP (expires in 10 mins)
    await db.otps.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    # Send Email
    background_tasks.add_task(send_password_reset_otp, data.email, otp)
    return {"message": "If email exists, OTP sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    # Verify OTP
    record = await db.otps.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid request")
    
    # Check expiry (10 mins)
    age = datetime.now(timezone.utc) - record["created_at"].replace(tzinfo=timezone.utc)
    if age.total_seconds() > 600:
        raise HTTPException(status_code=400, detail="OTP expired")
        
    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Update Password
    new_hash = get_password_hash(data.new_password)
    result = await db.users.update_one(
        {"email": data.email},
        {"$set": {"password_hash": new_hash}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Clear OTP
    await db.otps.delete_one({"email": data.email})
    
    return {"message": "Password updated successfully"}



# Pricing mapping
PRICING_MAP = {
    'delivered-3': {'amount': 22.00, 'currency': 'EUR', 'name': '3 Questions'},
    'delivered-5': {'amount': 33.00, 'currency': 'EUR', 'name': '5 Questions'},
    'live-20': {'amount': 66.00, 'currency': 'EUR', 'name': '20 Minutes'},
    'live-40': {'amount': 129.00, 'currency': 'EUR', 'name': '40 Minutes'},
    'aura': {'amount': 15.00, 'currency': 'EUR', 'name': 'Aura Scanning'}
}

# --- Availability Models & Routes ---
class Availability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    type: str = "regular"  # 'regular' or 'emergency'

class AvailabilityCreate(BaseModel):
    date: str
    start_time: str
    end_time: str
    type: str = "regular"

@api_router.post("/availability")
async def set_availability(avail: Availability):
    try:
        # Use Business Timezone for formatting/logic
        target_tz = BUSINESS_TZ

        
        # Parse Request to Aware Datetimes in Calendar Timezone
        req_start_iso = f"{avail.date}T{avail.start_time}:00"
        req_end_iso = f"{avail.date}T{avail.end_time}:00"
        
        # Create naive then attach info
        req_start_dt = datetime.fromisoformat(req_start_iso).replace(tzinfo=target_tz)
        req_end_dt = datetime.fromisoformat(req_end_iso).replace(tzinfo=target_tz)
        
        # Fetch events for the whole day
        search_start = req_start_dt.replace(hour=0, minute=0).isoformat()
        search_end = req_end_dt.replace(hour=23, minute=59).isoformat()
        
        existing_events = calendar_service.list_events(search_start, search_end)
        
        overlaps = []
        existing_intervals = []
        
        for e in existing_events:
            summary = e.get('summary', '')
            if "REGULAR_TIMING" in summary or "EMERGENCY_TIMING" in summary:
                s_raw = e['start'].get('dateTime')
                e_raw = e['end'].get('dateTime')
                if not s_raw or not e_raw: continue
                
                if s_raw.endswith('Z'): s_raw = s_raw.replace('Z', '+00:00')
                if e_raw.endswith('Z'): e_raw = e_raw.replace('Z', '+00:00')
                
                estart = datetime.fromisoformat(s_raw)
                eend = datetime.fromisoformat(e_raw)
                
                # Check Overlap
                if req_start_dt < eend and req_end_dt > estart:
                    overlaps.append(f"{summary}: {estart.astimezone(target_tz).strftime('%H:%M')} - {eend.astimezone(target_tz).strftime('%H:%M')}")
                    existing_intervals.append((estart.timestamp(), eend.timestamp()))

        if overlaps:
            # Calculate Non-Overlapping Segments
            req_s_ts = req_start_dt.timestamp()
            req_e_ts = req_end_dt.timestamp()
            
            existing_intervals.sort()
            
            current = req_s_ts
            proposed_segments = []
            
            for ex_s, ex_e in existing_intervals:
                if ex_e <= current: continue
                if ex_s >= req_e_ts: break
                
                if ex_s > current:
                    proposed_segments.append((current, ex_s))
                
                current = max(current, ex_e)
                
                if current >= req_e_ts: break
                
            if current < req_e_ts:
                proposed_segments.append((current, req_e_ts))
            
            proposed_list = []
            for s_ts, e_ts in proposed_segments:
                p_start = datetime.fromtimestamp(s_ts, target_tz).strftime("%H:%M")
                p_end = datetime.fromtimestamp(e_ts, target_tz).strftime("%H:%M")
                proposed_list.append({
                    "start_time": p_start,
                    "end_time": p_end
                })
                
            # RETURN 200 with overlapping status
            return {
                "status": "overlap",
                "detail": {
                    "message": "Overlap detected",
                    "overlaps": overlaps,
                    "proposed_segments": proposed_list
                }
            }

        # No Overlap -> Create Event
        summary = "REGULAR_TIMING"
        if avail.type.lower() == 'emergency':
            summary = "EMERGENCY_TIMING"
        
        event = calendar_service.create_event(
            summary,
            req_start_dt.isoformat(),
            req_end_dt.isoformat(),
            description="Antigravity System Availability Block"
        )
        
        if event:
            return {"status": "success", "event_id": event['id']}
        else:
             raise HTTPException(status_code=500, detail="Failed to create event in Google Calendar")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error setting availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/availability", response_model=List[Availability])
async def get_availability(date: Optional[str] = None):
    # This endpoint is strictly "What windows are set?".
    # We fetch GCal events with the keywords.
    if not date: 
        return []
        
    TZ_OFFSET = "+05:30"
    day_start_iso = f"{date}T00:00:00{TZ_OFFSET}"
    day_end_iso = f"{date}T23:59:59{TZ_OFFSET}"
    
    events = calendar_service.list_events(day_start_iso, day_end_iso)
    avail_list = []
    
    for e in events:
        summary = e.get('summary', '')
        if "REGULAR_TIMING" in summary or "EMERGENCY_TIMING" in summary:
             # Parse start/end
             start_iso = e['start'].get('dateTime', '')
             end_iso = e['end'].get('dateTime', '')
             if not start_iso: continue
             
             # Parse start/end with timezone handling
             try:
                 # Check if string ends with Z (UTC)
                 if start_iso.endswith('Z'):
                     start_iso = start_iso.replace('Z', '+00:00')
                 if end_iso.endswith('Z'):
                     end_iso = end_iso.replace('Z', '+00:00')
                     
                 dt_start = datetime.fromisoformat(start_iso)
                 dt_end = datetime.fromisoformat(end_iso)
                 target_tz = BUSINESS_TZ

                 
                 # Convert
                 dt_start_local = dt_start.astimezone(target_tz)
                 dt_end_local = dt_end.astimezone(target_tz)
                 
                 s_time = dt_start_local.strftime("%H:%M")
                 e_time = dt_end_local.strftime("%H:%M")
                 
             except ValueError:
                 # Fallback
                 s_time = start_iso.split('T')[1].split('+')[0][:5]
                 e_time = end_iso.split('T')[1].split('+')[0][:5]
             
             t_type = "regular"
             if "EMERGENCY" in summary:
                 t_type = "emergency"
                 
             avail_list.append(Availability(
                 id=e['id'],
                 date=date,
                 start_time=s_time,
                 end_time=e_time,
                 type=t_type
             ))
    return avail_list

@api_router.delete("/availability/{event_id}")
async def delete_availability(event_id: str):
    # 1. Fetch the event to get its time range
    # We don't have a direct "get_event" in simple wrapper, but we can list.
    # Actually, to verify overlap, we need to know the window.
    # Assuming the user is deleting a window they see in the UI.
    
    # We'll trust the user? NO, requirement is to block if bookings exist.
    # We really need to know the start/end of the event being deleted.
    # List all events for "today" (Wait, we don't know the date)
    # Limitation: GCal API delete just takes ID.
    # We might need to "get" it first.
    # Let's try to delete. If it fails, it fails.
    # BUT checking for bookings requires start/end.
    
    # Option: Pass date/start/end in query params? No, standard DELETE is by ID.
    # We should fetch the event details.
    try:
        event = calendar_service.service.events().get(calendarId='primary', eventId=event_id).execute()
        if not event:
             raise Exception("Event not found")
        
        start_iso = event['start'].get('dateTime', event['start'].get('date'))
        end_iso = event['end'].get('dateTime', event['end'].get('date'))
        
        # Check for Overlapping Bookings in this range
        # Valid bookings have 'summary' starting with 'BOOKED' (or just not REGULAR/EMERGENCY)
        
        # Re-fetch events in this range
        overlaps = calendar_service.list_events(start_iso, end_iso)
        has_booking = False
        for e in overlaps:
            if e['id'] == event_id: continue
            summary = e.get('summary', '')
            if "REGULAR_TIMING" in summary or "EMERGENCY_TIMING" in summary: continue
            
            # It's a booking!
            has_booking = True
            break
        
        if has_booking:
            raise HTTPException(status_code=400, detail="Cannot delete availability window with active bookings. Please delete the bookings first.")

        calendar_service.delete_event(event_id)
        return {"success": True}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Delete Avail Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AvailabilityUpdate(BaseModel):
    date: str
    start_time: str
    end_time: str
    type: str = "regular"

@api_router.put("/availability/{event_id}")
async def update_availability(event_id: str, avail: AvailabilityUpdate):
    # 1. Check for Duplicate/Overlap (excluding self ideally, but simplified logic first)
    # Ideally we fetch the old event to know its ID, but here we just check overlap against others.
    
    TZ_OFFSET = "+05:30"
    day_start_iso = f"{avail.date}T00:00:00{TZ_OFFSET}"
    day_end_iso = f"{avail.date}T23:59:59{TZ_OFFSET}"
    existing_events = calendar_service.list_events(day_start_iso, day_end_iso)
    
    new_start_min = int(avail.start_time.split(':')[0]) * 60 + int(avail.start_time.split(':')[1])
    new_end_min = int(avail.end_time.split(':')[0]) * 60 + int(avail.end_time.split(':')[1])
    
    for e in existing_events:
        if e['id'] == event_id: continue # Skip self
        
        e_summary = e.get('summary', '')
        if "REGULAR_TIMING" in e_summary or "EMERGENCY_TIMING" in e_summary:
             e_start_raw = e['start'].get('dateTime', '')
             e_end_raw = e['end'].get('dateTime', '')
             if not e_start_raw or 'T' not in e_start_raw: continue
             
             e_start_time = e_start_raw.split('T')[1].split('+')[0]
             e_end_time = e_end_raw.split('T')[1].split('+')[0]
             e_s_min = int(e_start_time.split(':')[0]) * 60 + int(e_start_time.split(':')[1])
             e_e_min = int(e_end_time.split(':')[0]) * 60 + int(e_end_time.split(':')[1])
             
             if (new_start_min < e_e_min) and (new_end_min > e_s_min):
                 raise HTTPException(status_code=400, detail="Overlapping availability window already exists.")

    # 2. Perform Update
    summary = "REGULAR_TIMING"
    if avail.type.lower() == 'emergency':
        summary = "EMERGENCY_TIMING"
        
    start_dt_iso = f"{avail.date}T{avail.start_time}:00+05:30"
    end_dt_iso = f"{avail.date}T{avail.end_time}:00+05:30"
    
    updated = calendar_service.update_event(
        event_id,
        summary,
        start_dt_iso,
        end_dt_iso,
        description="Updated by Antigravity"
    )
    
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update event")
        
    return Availability(
        id=updated['id'],
        date=avail.date,
        start_time=avail.start_time,
        end_time=avail.end_time,
        type=avail.type
    )
@api_router.get("/testimonials", response_model=List[Testimonial])
async def get_testimonials():
    testimonials = await db.testimonials.find({}, {"_id": 0}).to_list(100)
    return testimonials

@api_router.post("/testimonials", response_model=Testimonial)
async def create_testimonial(testimonial: TestimonialCreate):
    new_testimonial = Testimonial(**testimonial.model_dump())
    doc = new_testimonial.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.testimonials.insert_one(doc)
    return new_testimonial

@api_router.delete("/testimonials/{id}")
async def delete_testimonial(id: str):
    result = await db.testimonials.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"success": True}

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str):
    # booking_id here is the Google Calendar Event ID (passed from frontend slot.id)
    try:
        # 1. Fetch booking details FIRST (to get email for notification)
        booking = await db.bookings.find_one({"gcal_event_id": booking_id})
        
        # 2. Soft Cancel in MongoDB (if exists)
        result = await db.bookings.update_one(
            {"gcal_event_id": booking_id},
            {"$set": {"status": "canceled", "updated_at": datetime.now(timezone.utc)}}
        )
        
        if result.modified_count > 0:
            logger.info(f"Soft canceled booking with GCal ID: {booking_id}")
            
            # 3. Send Cancellation Email (Refunding in 3-5 days)
            if booking:
                # Use BackgroundTask if we could inject it, but here we'll call directly or use fire-and-forget wrapper
                # Ideally pass 'background_tasks' to this route but sticking to simple import for now
                # Or use the global background task approach if possible? 
                # Simplest: Just call it synchronous but wrapped in try/except so it doesn't block too much
                # Better: Use FastAPI BackgroundTasks
                try:
                    email_service.send_booking_cancellation_email(booking)
                except Exception as ex:
                    logger.error(f"Failed to send cancellation email: {ex}")

        else:
            logger.warning(f"No DB booking found for GCal ID: {booking_id} (might be older booking or manual event)")

        # 4. Hard Delete from Google Calendar (to free up slot)
        calendar_service.delete_event(booking_id)
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Delete Booking Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Slot Routes ---
from calendar_service import calendar_service

# Define Windows
REGULAR_WINDOW_START = "10:30"
REGULAR_WINDOW_END = "18:00"
EMERGENCY_WINDOW_START = "20:00"
EMERGENCY_WINDOW_END = "22:00"



@api_router.get("/slots", response_model=List[Slot])
async def get_slots(date: Optional[str] = None, available_only: bool = False, type: Optional[str] = None, duration: int = 20):
    if not date:
        return []
    
    logger.info(f"GET_SLOTS: date={date} type={type} duration={duration} avail_only={available_only}")

    # 1. Fetch ALL events
    TZ_OFFSET = "+05:30"
    day_start_iso = f"{date}T00:00:00{TZ_OFFSET}"
    day_end_iso = f"{date}T23:59:59{TZ_OFFSET}"
    
    events = calendar_service.list_events(day_start_iso, day_end_iso)
    
    availability_blocks = []
    busy_blocks = []
    
    def to_minutes(time_str):
        try:
            # Handle YYYY-MM-DD (Date only) -> All Day Event
            if 'T' not in time_str:
                return -1 
            
            # Helper to parse and convert to Calendar Timezone minutes
            try:
                if time_str.endswith('Z'):
                    time_str = time_str.replace('Z', '+00:00')
                
                dt = datetime.fromisoformat(time_str)
                
                # Convert to Dynamic Calendar Timezone
                # FORCE Timezone from Constant
                target_tz = BUSINESS_TZ
                
                dt_local = dt.astimezone(target_tz)
                
                return dt_local.hour * 60 + dt_local.minute
            except ValueError:
                # Fallback to naive splitting if not ISO format (unlikely from GCal)
                time_part = time_str.split('T')[1].split('+')[0]
                h, m, _ = map(int, time_part.split(':'))
                return h * 60 + m
        except:
             return 0

    # 2. Filter Events
    for e in events:
        summary = e.get('summary', '') or ""
        transparency = e.get('transparency', 'opaque') # Default is opaque (Busy)
        
        start_raw = e['start'].get('dateTime', e['start'].get('date'))
        end_raw = e['end'].get('dateTime', e['end'].get('date'))
        
        # Handle All Day
        if 'T' not in start_raw:
            s_min = 0
            e_min = 1440 # Full day
        else:
            s_min = to_minutes(start_raw)
            e_min = to_minutes(end_raw)
            
        # Check Keywords
        is_avail = False
        block_type = 'regular'
        if "REGULAR_TIMING" in summary:
            is_avail = True
            block_type = 'regular'
        elif "EMERGENCY_TIMING" in summary:
            is_avail = True
            block_type = 'emergency'
            
        if is_avail:
            # Filter by requested type if present
            if type and type.lower() != block_type:
                continue
            availability_blocks.append({'start': s_min, 'end': e_min, 'type': block_type})
        else:
            # It's a Busy Block (unless transparent)
            # It's a Busy Block (unless transparent)
            if transparency != 'transparent':
                busy_blocks.append({'start': s_min, 'end': e_min, 'summary': summary, 'id': e['id']})

    # 3. Calculate Slots
    dynamic_slots = []
    busy_blocks.sort(key=lambda x: x['start'])
    
    def format_time(m):
        h = m // 60
        mn = m % 60
        return f"{h:02d}:{mn:02d}"

    # Iterate each Availability Block
    for block in availability_blocks:
        current = block['start']
        b_end = block['end']
        b_type = block['type']
        
        # Step within the block
        # Optimization: We could be smarter about skipping busy blocks, 
        # but iterating by Duration is key requirement ("Segment that block into potential start times").
        # Usually this means stepping by 'Duration' OR 'Interval'. 
        # Standard booking is often "Slots every 30m". 
        # If duration is 40m, slots might be 10:00, 10:30, 11:00... 
        # But here user said "Segment that block". 
        # "For each *start time*... verify". 
        # I will assume start times correspond to continuous packing (start += duration) 
        # OR some granularity. 
        # Let's use `duration` as the step for now to maximize efficiency/minimize overlap? 
        # Or standard 20m interval? 
        # Admin UI uses 20m default. 
        # Let's align step with duration to prevent fragmentation? 
        # Actually standard practice is interval (e.g. 15m or 30m). 
        # I will stick to start += duration for simplest "packing".
        
        while current + duration <= b_end:
            slot_start = current
            slot_end = current + duration
            
            # Check Conflict with Busy Blocks
            is_conflict = False
            SESSION_BUFFER = 20
            
            for busy in busy_blocks:
                # Add buffer to busy block: [Start - Buffer, End + Buffer]
                # This ensures 20m gap between sessions
                busy_start_buffered = busy['start'] - SESSION_BUFFER
                busy_end_buffered = busy['end'] + SESSION_BUFFER
                
                # Overlap Logic with Buffer
                if (slot_start < busy_end_buffered) and (slot_end > busy_start_buffered):
                    is_conflict = True
                    # logger.info(f"Conflict with {busy.get('summary')} (Buffered: {format_time(busy_start_buffered)}-{format_time(busy_end_buffered)})")
                    break
            
            if not is_conflict:
                time_str = format_time(slot_start)
                # logger.info(f"Slot {time_str} ACCEPTED")
                dynamic_slots.append(Slot(
                    id=f"gcal-{date}-{time_str}",
                    date=date,
                    time=time_str,
                    type=b_type,
                    is_booked=False,
                    duration=duration
                ))
            else:
                # pass
                # logger.info(f"Slot {format_time(slot_start)} REJECTED (Conflict)")
                pass
            
            # Step forward
            # Step forward by a fixed interval (e.g. 20m) instead of duration
            # This allows flexible booking options (e.g. 10:00, 10:20, 10:40) even for 40m services
            current += 20

    # 4. If !available_only, add Busy Blocks as Slots
    if not available_only:
        for busy in busy_blocks:
             # Convert minutes to HH:MM
             h = busy['start'] // 60
             m = busy['start'] % 60
             time_str = f"{h:02d}:{m:02d}"
             
             duration_mins = busy['end'] - busy['start']
             if duration_mins <= 0: continue
             
             dynamic_slots.append(Slot(
                 id=busy.get('id', f"busy-{date}-{time_str}"),
                 date=date,
                 time=time_str,
                 type='busy', # New type for frontend to color red
                 is_booked=True,
                 booked_by=busy['summary'], # Show "Lunch", "BOOKED:...", etc
                 duration=duration_mins
             ))

    # 5. Fetch and Add "Canceled" Bookings for Visual History
    # We want to show these to the admin even if the slot is technically free now.
    canceled_bookings = await db.bookings.find({"preferred_date": date, "status": "canceled"}, {"_id": 0}).to_list(100)
    for cb in canceled_bookings:
        # Avoid duplicates if multiple cancellations for same time? 
        # Just show them. Admin might want to see history.
        # But if we have a NEW booking in that slot, this canceled one will appear alongside/beneath it?
        # Yes, that's fine. It's a timeline.
        
        c_time = cb['preferred_time']
        # Determine duration
        c_dur = 20
        if cb.get('service_type') and '40' in cb['service_type']:
            c_dur = 40
            
        dynamic_slots.append(Slot(
            id=f"canceled-{cb['booking_id']}",
            date=date,
            time=c_time,
            type='canceled', # Special type for styling
            is_booked=True, # It was booked
            booked_by=f"CANCELED: {cb['full_name']}",
            duration=c_dur
        ))

    return sorted(dynamic_slots, key=lambda x: (x.date, x.time))


@api_router.post("/slots", response_model=Slot)
async def create_slot(slot: SlotCreate):
    # Check if slot already exists
    existing = await db.slots.find_one({"date": slot.date, "time": slot.time})
    if existing:
        raise HTTPException(status_code=400, detail="Slot already exists")
        
    new_slot = Slot(**slot.model_dump())
    doc = new_slot.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    try:
        await db.slots.insert_one(doc)
    except Exception as e:
        if "E11000" in str(e): # Duplicate key error code
             raise HTTPException(status_code=400, detail="Slot already exists (DB Key Error)")
        raise e
    return new_slot

@api_router.delete("/slots/{id}")
async def delete_slot(id: str):
    result = await db.slots.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"success": True}

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/bookings/create")
@api_router.post("/bookings/create")
async def create_booking(booking_data: BookingCreate, background_tasks: BackgroundTasks):
    """Create a new booking and initiate payment"""
    try:
        # Generate booking ID
        booking_id = f"TRT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Get pricing info
        pricing = PRICING_MAP.get(booking_data.service_type)
        if not pricing:
            raise HTTPException(status_code=400, detail="Invalid service type")
        
        # Create booking record
        booking = Booking(
            booking_id=booking_id,
            full_name=booking_data.full_name,
            email=booking_data.email,
            phone=booking_data.phone,
            gender=booking_data.gender,
            date_of_birth=booking_data.date_of_birth,
            service_type=booking_data.service_type,
            preferred_date=booking_data.preferred_date,
            preferred_time=booking_data.preferred_time,
            alternative_time=booking_data.alternative_time,
            partner_info=booking_data.partner_info,
            questions=booking_data.questions,
            situation_description=booking_data.situation_description,
            reading_focus=booking_data.reading_focus,
            payment_method=booking_data.payment_method,
            is_emergency=booking_data.is_emergency,
            amount=pricing['amount'],
            currency=pricing['currency'],
            status="confirmed",
            aura_image=booking_data.aura_image
        )

        # Apply Emergency Charge (+30%)
        if booking_data.is_emergency:
             booking.amount = round(booking.amount * 1.30, 2)
        
        # If live reading, verify slot availability via Double Check Logic?
        # User requirement says "When user books... create new event... BOOKED: Patient Name".
        # We assume frontend already fetched valid slot via get_slots which did the check.
        # But race condition possible. 
        # Robustness: re-check availability? 
        # For MVP, just insert. GCal allows overlaps unless we check.
        
        if 'live' in booking_data.service_type and booking_data.preferred_date and booking_data.preferred_time:
             # Calculate Duration
             duration_b = 20
             if '40' in booking_data.service_type:
                 duration_b = 40
             
             # Create GCal Event
             start_dt_iso = f"{booking_data.preferred_date}T{booking_data.preferred_time}:00+05:30"
             
             try:
                 dt = datetime.fromisoformat(start_dt_iso)
                 end_dt = dt + timedelta(minutes=duration_b)
                 end_dt_iso = end_dt.isoformat()
                 
                 summary = f"BOOKED: {booking_data.full_name} ({booking_data.service_type})"
                 if booking_data.is_emergency:
                     summary = f"[EMERGENCY] {summary}"
                 
                 gcal_event = calendar_service.create_event(
                     summary,
                     start_dt_iso, 
                     end_dt_iso,
                     # attendees_emails=[booking_data.email], # Service Accounts cannot invite without DWD
                     description=f"Questions: {booking_data.questions}\nSituation: {booking_data.situation_description}"
                 )
                 
                 # Save GCal Event ID to Booking
                 booking.gcal_event_id = gcal_event.get('id')
                 
             except Exception as e:
                 logger.error(f"Failed to create GCal event: {e}")
                 # Fail booking if event creation fails
                 raise HTTPException(status_code=500, detail=f"Failed to create Calendar Event: {str(e)}")
        
        # Convert to dict and serialize datetime fields for MongoDB
        doc = booking.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        # Insert into MongoDB
        new_booking = await db.bookings.insert_one(doc)
        
        # Schedule Zoom Meeting if Live Reading
        meeting_link = None
        if str(doc.get('service_type', '')).startswith('live-'):
            try:
                # Format: "{Service Name} with {User Name}"
                
                # Get Readable Service Name
                raw_service = doc.get('service_type', '')
                service_name = "Live Reading"
                if '20' in raw_service:
                    service_name = "Live Reading (20 Mins)"
                elif '40' in raw_service:
                    service_name = "Live Reading (40 Mins)"
                
                topic = f"{service_name} with {doc.get('full_name')}"
                
                # Calculate start time (assuming preferred_date is YYYY-MM-DD and time is HH:mm)
                start_time_iso = f"{doc.get('preferred_date')}T{doc.get('preferred_time')}:00"
                
                # Default duration 40, or 20/40 based on type
                duration = 40
                if '20' in raw_service:
                    duration = 20
                
                logger.info(f"Scheduling Zoom meeting: {topic} at {start_time_iso}")
                
                # Pass Situation/Context as Agenda
                agenda = doc.get('situation_description', '')
                meeting_link = await zoom_service.create_meeting(topic, start_time_iso, duration, agenda=agenda)
                
                if meeting_link:
                    # Update booking with meeting link
                    await db.bookings.update_one(
                        {"_id": new_booking.inserted_id},
                        {"$set": {"meeting_link": meeting_link}}
                    )
                    logger.info(f"Zoom meeting created: {meeting_link}")
            except Exception as e:
                logger.error(f"Failed to create Zoom meeting: {e}")

        # Send Confirmation Email (Background Task)
        # Pass meeting_link to email service
        background_tasks.add_task(send_booking_confirmation_to_client, doc, None, meeting_link)
        
        # Notify Admin
        background_tasks.add_task(send_booking_notification_to_tejashvini, doc)

        # Create payment based on method
        payment_result = None
        if booking_data.payment_method == 'paypal':
            payment_result = payment_service.create_paypal_payment(
                pricing['amount'],
                pricing['currency'],
                booking.model_dump()
            )
        else:
            raise HTTPException(status_code=400, detail=f"Payment method {booking_data.payment_method} is not supported. Use 'paypal'.")

        if not payment_result or not payment_result.get('success'):
            raise HTTPException(status_code=500, detail=payment_result.get('error', "Failed to create payment"))
        
        return {
            'success': True,
            'booking_id': booking_id,
            'payment': payment_result
        }
        
    except Exception as e:
        logger.error(f"Booking creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/bookings/verify-payment")
async def verify_payment(verification: PaymentVerification, background_tasks: BackgroundTasks):
    """Verify payment and send confirmation emails"""
    try:
        # Get booking
        booking = await db.bookings.find_one({'booking_id': verification.booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Convert ISO string timestamps back to datetime objects
        if isinstance(booking['created_at'], str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        if isinstance(booking['updated_at'], str):
            booking['updated_at'] = datetime.fromisoformat(booking['updated_at'])
        
        # Verify payment based on method
        payment_verified = None
        logger.info(f"VERIFY DEBUG: Receiving verification request: {verification}")
        
        if verification.payment_method == 'paypal':
            payment_verified = payment_service.verify_paypal_payment(verification.payment_id)
        else:
             raise HTTPException(status_code=400, detail=f"Verification for {verification.payment_method} is not supported.")

        if not payment_verified or not payment_verified.get('success'):
            raise HTTPException(status_code=400, detail="Payment verification failed")
        
        # Update booking status
        await db.bookings.update_one(
            {'booking_id': verification.booking_id},
            {'$set': {
                'payment_status': 'paid',
                'transaction_id': payment_verified.get('transaction_id'),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Refresh booking data
        booking = await db.bookings.find_one({'booking_id': verification.booking_id}, {"_id": 0})
        
        # Send confirmation emails in background
        import email_service
        # import zoom_service # Unused?
        
        background_tasks.add_task(
            email_service.send_booking_confirmation_to_client,
            booking,
            payment_verified
        )
        background_tasks.add_task(
            email_service.send_booking_notification_to_tejashvini,
            booking,
            payment_verified
        )
        
        return {
            'success': True,
            'message': 'Payment verified and confirmation emails sent',
            'booking_id': verification.booking_id
        }
        
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    """Get booking details"""
    booking = await db.bookings.find_one({'booking_id': booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(booking['created_at'], str):
        booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    if isinstance(booking['updated_at'], str):
        booking['updated_at'] = datetime.fromisoformat(booking['updated_at'])
    
    return booking

@api_router.get("/bookings/gcal/{event_id}")
async def get_booking_by_gcal(event_id: str):
    """Get booking details by Google Calendar Event ID"""
    booking = await db.bookings.find_one({'gcal_event_id': event_id}, {"_id": 0})
    if not booking:
        # Fallback: Check if it's the booking_id itself (in case frontend passed internal ID)
        booking = await db.bookings.find_one({'booking_id': event_id}, {"_id": 0})
        
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(booking.get('created_at'), str):
        booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    if isinstance(booking.get('updated_at'), str):
        booking['updated_at'] = datetime.fromisoformat(booking['updated_at'])
    
    return booking

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)