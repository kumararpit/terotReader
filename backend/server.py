from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends, status, Response, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import email_service
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# Load environment variables as early as possible
load_dotenv()

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator, model_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

# Define Business Timezone
DEFAULT_TZ = 'Europe/Rome'
BUSINESS_TZ_STR = os.environ.get('BUSINESS_TZ', DEFAULT_TZ)
BUSINESS_TZ = ZoneInfo(BUSINESS_TZ_STR)

def get_business_offset():
    """Helper to get current offset string for BUSINESS_TZ (e.g. +05:30)"""
    now = datetime.now(BUSINESS_TZ)
    offset = now.strftime('%z')
    # Convert +0530 to +05:30
    if len(offset) == 5:
        return f"{offset[:3]}:{offset[3:]}"
    return offset
from payment_service import payment_service
from email_service import send_password_reset_otp, send_booking_confirmation_to_client, send_booking_notification_to_tejashvini
import zoom_service
import auth
from auth import Token, TokenData, create_access_token, verify_password, get_password_hash, SECRET_KEY, ALGORITHM
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
        
        # Seed Service Prices if empty
        if await db.services.count_documents({}) == 0:
            print("Seeding Service Prices...")
            for key, val in PRICING_MAP.items():
                # Determine category
                cat = "Live Readings"
                if "delivered" in key:
                    cat = "Email Readings"
                elif "aura" in key:
                    cat = "Other"
                
                await db.services.insert_one({
                    "id": str(uuid.uuid4()),
                    "key": key,
                    "name": val['name'],
                    "amount": val['amount'],
                    "currency": val['currency'],
                    "category": cat,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            print("Service Prices seeded.")
            
    except Exception as e:
        print(f"Error creating index or seeding: {e}")
    yield

# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
frontend_url = os.environ.get('FRONTEND_URL', '')
cors_origins = os.environ.get('CORS_ORIGINS', '')
combined = f"{frontend_url},{cors_origins}"
allowed_origins = [url.strip() for url in combined.split(',') if url.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:3000"]

logger.info(f"Allowed CORS Origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
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
    promo_code: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
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
    status: str = "pending"  # 'pending', 'confirmed', 'canceled'
    gcal_event_id: Optional[str] = None
    aura_image: Optional[str] = None
    promo_code: Optional[str] = None
    discount_amount: float = 0.0
    original_amount: float = 0.0
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
    start_time_utc: Optional[str] = None # ISO 8601 UTC
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

# --- New Models for Promotions ---

class ServicePrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str # unique identifier e.g. 'live-20'
    name: str
    amount: float
    currency: str
    category: str # 'Email Readings', 'Live Readings', 'Other'

class ServicePriceUpdate(BaseModel):
    amount: float
    currency: Optional[str] = None
    name: Optional[str] = None

class GlobalCampaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str
    discount_percentage: int
    expiry_date: datetime
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GlobalCampaignCreate(BaseModel):
    message: str
    discount_percentage: int
    expiry_date: str # ISO string

    @field_validator('discount_percentage')
    @classmethod
    def validate_discount(cls, v: int) -> int:
        if v > 100:
            raise ValueError("Discount percentage cannot exceed 100%")
        if v < 0:
            raise ValueError("Discount percentage cannot be negative")
        return v

class Promotion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str = "percentage" # 'percentage' or 'fixed'
    discount_value: float
    usage_limit: int = 100
    used_count: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromotionCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    usage_limit: int

    @model_validator(mode='after')
    def validate_discount(self) -> 'PromotionCreate':
        if self.discount_type == 'percentage':
            if self.discount_value > 100:
                raise ValueError("Percentage discount cannot exceed 100%")
        if self.discount_value < 0:
            raise ValueError("Discount value cannot be negative")
        return self
    
class VerifyCodeRequest(BaseModel):
    code: str
    service_type: str


# --- Auth Dependency ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login", auto_error=False)

async def get_current_admin(request: Request):
    token = request.cookies.get("admin_token")
    if not token:
        # Fallback to Header for flexibility during transition or if explicitly needed
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    return user

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

@api_router.post("/login")
async def login_for_access_token(form_data: LoginRequest, response: Response):
    # Find user
    user = await db.users.find_one({"username": form_data.username})
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    is_production = os.environ.get("APP_ENV") == "production"
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="admin_token",
        value=access_token,
        httponly=True,
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="none" if is_production else "lax",
        secure=is_production
    )
    
    return {"message": "Login successful", "access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me")
async def get_me(admin=Depends(get_current_admin)):
    return {
        "username": admin["username"],
        "email": admin["email"]
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    is_production = os.environ.get("APP_ENV") == "production"
    response.delete_cookie(
        key="admin_token", 
        samesite="none" if is_production else "lax", 
        secure=is_production
    )
    return {"message": "Logged out"}

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    logger.info(f"Forgot PW requested for: {data.email}")
    user = await db.users.find_one({"email": data.email})
    
    if not user:
        # Don't reveal user existence for security, just pretend success
        # BUT log it for Admin debugging
        logger.warning(f"Forgot Password: User {data.email} NOT FOUND in DB. Ignoring.")
        return {"message": "If email exists, OTP sent"}
    
    logger.info(f"User found: {user.get('username')}. Generating OTP.")
    
    # Generate OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP (expires in 10 mins)
    await db.otps.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    # Send Email
    logger.info(f"Queuing OTP email task for {data.email}")
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

# --- Offer Management System ---

class Offer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # Unique code, e.g., "SUMMER20"
    type: str  # 'website' or 'promo'
    text: str  # Display text
    discount_percent: float
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OfferCreate(BaseModel):
    code: str
    type: str = "promo" # 'website' or 'promo'
    text: str
    discount_percent: float
    start_date: str # ISO 8601
    end_date: str   # ISO 8601
    is_active: bool = True

class OfferValidate(BaseModel):
    code: str


# Helper: Get current ACTIVE WEBSITE offer (using GlobalCampaign)
async def get_current_offer() -> dict:
    # 1. Look for active campaigns within date range
    now = datetime.now(timezone.utc)
    
    # Sort by discount_percentage descending to give best offer if multiple exist
    cursor = db.campaigns.find({
        "is_active": True
    }).sort("discount_percentage", -1).limit(1)
    
    campaigns = await cursor.to_list(length=1)
    
    if campaigns:
        campaign = campaigns[0]
        
        # Check expiry
        expiry = campaign.get('expiry_date')
        if isinstance(expiry, str):
            expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
        
        if isinstance(expiry, datetime) and expiry.replace(tzinfo=timezone.utc) > now:
            # Return strict format expected by frontend Offer components
            return {
                "is_active": True,
                "text": "Special Campaign", # Default text if no code is present
                "offer_text": campaign.get("message", "Special Campaign"), 
                "discount_percent": campaign.get("discount_percentage", 0),
                "code": "CAMPAIGN", # Dummy code
                "type": "website"
            }
        else:
             # Deactivate expired campaign automatically
             await db.campaigns.update_one({"id": campaign['id']}, {"$set": {"is_active": False}})

    # Default Inactive
    return {"is_active": False, "text": "", "discount_percent": 0.0}

@api_router.get("/settings/offer", response_model=dict)
async def get_offer_endpoint():
    # Legacy endpoint wrapper
    return await get_current_offer()

# Admin: List Offers
@api_router.get("/admin/offers", response_model=List[Offer])
async def list_offers(admin=Depends(get_current_admin)):
    offers = await db.offers.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return offers

# Admin: Create Offer
@api_router.post("/admin/offers", response_model=Offer)
async def create_offer(offer_data: OfferCreate, admin=Depends(get_current_admin)):
    # Check if code already exists
    existing = await db.offers.find_one({"code": offer_data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Offer with this code already exists")
    
    try:
        # Parse Dates
        dt_start = datetime.fromisoformat(offer_data.start_date.replace("Z", "+00:00"))
        dt_end = datetime.fromisoformat(offer_data.end_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    new_offer = Offer(
        code=offer_data.code,
        type=offer_data.type,
        text=offer_data.text,
        discount_percent=offer_data.discount_percent,
        start_date=dt_start,
        end_date=dt_end,
        is_active=offer_data.is_active
    )
    
    await db.offers.insert_one(new_offer.model_dump())
    return new_offer

# Admin: Delete Offer
@api_router.delete("/admin/offers/{offer_id}")
async def delete_offer(offer_id: str, admin=Depends(get_current_admin)):
    result = await db.offers.delete_one({"id": offer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    return {"success": True}

# Admin: Toggle Offer
@api_router.put("/admin/offers/{offer_id}/toggle")
async def toggle_offer(offer_id: str, admin=Depends(get_current_admin)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    new_status = not offer.get("is_active", False)
    await db.offers.update_one({"id": offer_id}, {"$set": {"is_active": new_status}})
    return {"success": True, "is_active": new_status}

# Public: Validate Promo Code
@api_router.post("/offers/validate")
async def validate_promo_code_endpoint(data: OfferValidate):
    now = datetime.now(timezone.utc)
    
    # Case insensitive search might be better, but strict for now
    offer = await db.offers.find_one({
        "code": data.code,
        "is_active": True,
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    })
    
    if not offer:
        # Check if it exists but expired? No, simply Invalid for user.
        return {"valid": False, "message": "Invalid or expired code"}
    
    return {
        "valid": True,
        "discount_percent": offer["discount_percent"],
        "text": offer["text"],
        "code": offer["code"],
        "type": offer["type"]
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
        
    current_offset = get_business_offset()
    day_start_iso = f"{date}T00:00:00{current_offset}"
    day_end_iso = f"{date}T23:59:59{current_offset}"
    
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
    
    current_offset = get_business_offset()
    day_start_iso = f"{avail.date}T00:00:00{current_offset}"
    day_end_iso = f"{avail.date}T23:59:59{current_offset}"
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
        
    current_offset = get_business_offset()
    start_dt_iso = f"{avail.date}T{avail.start_time}:00{current_offset}"
    end_dt_iso = f"{avail.date}T{avail.end_time}:00{current_offset}"
    
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
    current_offset = get_business_offset()
    day_start_iso = f"{date}T00:00:00{current_offset}"
    day_end_iso = f"{date}T23:59:59{current_offset}"
    
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
    seen_slots = set()
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
        if is_avail:
             # Create slots for this block
            # Duration step
            current_min = s_min
            while current_min + duration <= e_min:
                # Check if this sub-slot overlaps with any busy block
                slot_start = current_min
                slot_end = current_min + duration
                
                is_busy = False
                for bb in busy_blocks:
                    # Overlap logic: start < busy_end AND end > busy_start
                    if slot_start < bb['end'] and slot_end > bb['start']:
                        is_busy = True
                        break
                
                if not is_busy:
                    time_str = format_time(slot_start)
                    
                    # Calculate UTC Time for this slot
                    # 1. Construct local time in Business TZ
                    # We know 'date' and 'time_str'.
                    # We need to rely on the fact that date is YYYY-MM-DD in Business TZ context if we assume simple calendar
                    # BUT GCal returns ISO with offsets.
                    # We used `to_minutes` which normalized to Business TZ.
                    # So `slot_start` minutes is relative to Business TZ midnight.
                    
                    
                    try:
                        # Construct naive then localize
                        dt_naive = datetime.fromisoformat(f"{date}T{time_str}:00")
                        dt_aware = dt_naive.replace(tzinfo=BUSINESS_TZ)
                        dt_utc = dt_aware.astimezone(timezone.utc)
                        utc_iso = dt_utc.isoformat().replace('+00:00', 'Z')
                    except Exception as ex:
                        logger.error(f"Error calculating UTC for slot {time_str}: {ex}")
                        utc_iso = None

                    slot_key = f"{date}-{time_str}"
                    if slot_key in seen_slots:
                        current_min += duration
                        continue
                    seen_slots.add(slot_key)

                    dynamic_slots.append(Slot(
                        date=date,
                        time=time_str,
                        start_time_utc=utc_iso,
                        type=block_type,
                        duration=duration
                    ))

                current_min += duration
                

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

@api_router.post("/bookings/verify-code")
async def verify_promo_code(data: VerifyCodeRequest):
    """Verify a promo code before booking"""
    promo = await db.promotions.find_one({"code": data.code.upper(), "is_active": True})
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid or expired promo code")
    
    if promo['used_count'] >= promo['usage_limit']:
        raise HTTPException(status_code=400, detail="Promo code usage limit reached")
    
    return {
        "valid": True,
        "code": promo['code'],
        "discount_type": promo['discount_type'],
        "discount_value": promo['discount_value']
    }

@api_router.post("/bookings/create")
async def create_booking(booking_data: BookingCreate, background_tasks: BackgroundTasks):
    """Create a new booking and initiate payment"""
    try:
        # Generate booking ID
        booking_id = f"TRT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # 1. Get Base Pricing
        service_price = await db.services.find_one({"key": booking_data.service_type})
        if service_price:
            base_amount = float(service_price['amount'])
            currency = service_price['currency']
        else:
            # Fallback
            pricing = PRICING_MAP.get(booking_data.service_type)
            if not pricing:
                raise HTTPException(status_code=400, detail="Invalid service type")
            base_amount = float(pricing['amount'])
            currency = pricing['currency']

        final_amount = base_amount
        discount_total = 0.0
        applied_promo_code = None
        
        # 2. Apply Discounts (Mutually Exclusive: Promo Code takes priority)
        if booking_data.promo_code:
            promo = await db.promotions.find_one({"code": booking_data.promo_code, "is_active": True})
            if promo and promo['used_count'] < promo['usage_limit']:
                # Apply Promo Code
                if promo['discount_type'] == 'percentage':
                    p_discount = (float(promo['discount_value']) / 100.0) * final_amount
                else:
                    p_discount = float(promo['discount_value'])
                
                final_amount -= p_discount
                discount_total += p_discount
                applied_promo_code = promo['code']
                logger.info(f"Applied Promo Code: {applied_promo_code}. Discount: {p_discount}")
            else:
                logger.warning(f"Invalid or limited promo code: {booking_data.promo_code}")

        # 3. Apply Global Campaign (Only if no promo applied)
        if not applied_promo_code:
            campaign = await db.campaigns.find_one({"is_active": True})
            if campaign:
                expiry = campaign.get('expiry_date')
                if isinstance(expiry, str): expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                if isinstance(expiry, datetime) and expiry.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
                    pct = campaign.get('discount_percentage', 0)
                    discount = (float(pct) / 100.0) * final_amount
                    final_amount -= discount
                    discount_total += discount
                    logger.info(f"Applied Global Campaign: {pct}% off. New amount: {final_amount}")

        # Ensure non-negative
        if final_amount < 0: final_amount = 0.0
        final_amount = round(final_amount, 2)

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
            amount=final_amount,
            original_amount=base_amount,
            discount_amount=round(discount_total, 2),
            promo_code=applied_promo_code,
            currency=currency,
            status="pending",
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
             # Handle UTC or Legacy Time
             p_time = booking_data.preferred_time
             if 'Z' in p_time or '+' in p_time:
                 start_dt_iso = f"{booking_data.preferred_date}T{p_time}"
             else:
                 # Fallback to Business Offset if no timezone info
                 current_offset = get_business_offset()
                 start_dt_iso = f"{booking_data.preferred_date}T{p_time}:00{current_offset}"
             
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
        
        # Booking save and notifications deferred until payment success

        if booking_data.payment_method == 'paypal':
            payment_result = payment_service.create_paypal_payment(
                booking.amount,
                booking.currency,
                booking.model_dump()
            )
        else:
            raise HTTPException(status_code=400, detail=f"Payment method {booking_data.payment_method} is not supported. Use 'paypal'.")

        if not payment_result or not payment_result.get('success'):
            # Payment Failed: Do NOT save booking, do NOT send emails.
            # Log the specific error but show generic to user (although create_paypal_payment already genericizes it, we ensure here too).
            error_msg = payment_result.get('error', "Technical Error: Unable to initiate payment.")
            if "Technical Error" not in str(error_msg):
                 logger.error(f"Payment Init Failed: {error_msg}")
                 error_msg = "Technical Error: Unable to initiate payment. Please try again later."
            
            raise HTTPException(status_code=500, detail=error_msg)

        # Payment Success! Proceed to save.
        
        # Convert to dict and serialize datetime fields for MongoDB
        doc = booking.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        # Insert into MongoDB
        new_booking = await db.bookings.insert_one(doc)
        
        return {
            'success': True,
            'booking_id': booking_id,
            'payment': payment_result
        }
        
    except HTTPException as he:
        # Re-raise HTTPExceptions (e.g. from payment fail check)
        raise he
    except Exception as e:
        logger.error(f"Booking creation error: {str(e)}")
        # Generic technical error
        raise HTTPException(status_code=500, detail="Technical Error: Unable to process booking. Please try again.")


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
                'status': 'confirmed',
                'transaction_id': payment_verified.get('transaction_id'),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Refresh booking data
        booking = await db.bookings.find_one({'booking_id': verification.booking_id}, {"_id": 0})
        
        # Increment Promo Usage
        if booking.get('promo_code'):
             await db.promotions.update_one(
                 {"code": booking['promo_code']},
                 {"$inc": {"used_count": 1}}
             )
        
        # 4. Schedule Zoom Meeting if Live Reading (Only on Payment Success)
        meeting_link = booking.get('meeting_link')
        if not meeting_link and str(booking.get('service_type', '')).startswith('live-'):
            try:
                raw_service = booking.get('service_type', '')
                service_name = "Live Reading (20 Mins)" if '20' in raw_service else "Live Reading (40 Mins)"
                topic = f"{service_name} with {booking.get('full_name')}"
                start_time_iso = f"{booking.get('preferred_date')}T{booking.get('preferred_time')}:00"
                duration = 20 if '20' in raw_service else 40
                
                logger.info(f"Scheduling Zoom meeting: {topic} at {start_time_iso}")
                meeting_link = await zoom_service.create_meeting(topic, start_time_iso, duration, agenda=booking.get('situation_description', ''))
                
                if meeting_link:
                    await db.bookings.update_one(
                        {'booking_id': verification.booking_id},
                        {"$set": {"meeting_link": meeting_link}}
                    )
                    logger.info(f"Zoom meeting created: {meeting_link}")
            except Exception as e:
                logger.error(f"Failed to create Zoom meeting in verification: {e}")

        # Send confirmation emails in background
        import email_service
        
        background_tasks.add_task(
            email_service.send_booking_confirmation_to_client,
            booking,
            payment_verified,
            meeting_link
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

@api_router.post("/bookings/{booking_id}/resend-email")
async def resend_email(
    booking_id: str, 
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_admin)
):
    """Resend confirmation email for a booking (Admin only)"""
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Send
    background_tasks.add_task(
        email_service.send_booking_confirmation_to_client,
        booking,
        None,
        booking.get('meeting_link')
    )
    
    return {"status": "queued", "message": f"Email queued for {booking.get('email')}"}

@api_router.get("/bookings")
async def get_all_bookings(
    skip: int = 0, 
    limit: int = 20, 
    service_type: Optional[str] = None,
    payment_status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: int = -1,  # -1 for DESC, 1 for ASC
    current_user: str = Depends(get_current_admin)
):
    """Fetch all bookings for admin view with pagination and filtering"""
    try:
        query = {}
        
        # 1. Payment Status Filtering (Frontend labels: Confirmed/Not Completed)
        if payment_status == 'paid':
            query["status"] = "confirmed"
            query["transaction_id"] = {"$ne": None}
        elif payment_status == 'pending':
            query["transaction_id"] = None
        # 'all' means we don't apply an initial status filter
        
        # 2. Service Type Filtering
        if service_type and service_type != 'all':
            if service_type == 'delivered':
                query["service_type"] = {"$regex": "^delivered-"}
            elif service_type == 'live':
                query["service_type"] = {"$regex": "^live-"}
            elif service_type == 'aura':
                query["service_type"] = "aura"
            else:
                query["service_type"] = service_type

        # Validate sort_by
        allowed_sort_fields = ["created_at", "preferred_date", "amount"]
        if sort_by not in allowed_sort_fields:
            sort_by = "created_at"

        # Count total for pagination
        total = await db.bookings.count_documents(query)
        
        # Fetch subset with sorting
        bookings_cursor = db.bookings.find(query, {"_id": 0}).sort(sort_by, sort_order).skip(skip).limit(limit)
        bookings = await bookings_cursor.to_list(length=limit)
        
        # Consistent timestamp formatting
        for booking in bookings:
            for field in ['created_at', 'updated_at']:
                val = booking.get(field)
                if val and isinstance(val, str):
                    try:
                        booking[field] = datetime.fromisoformat(val.replace("Z", "+00:00"))
                    except ValueError:
                        pass
                    
        return {
            "bookings": bookings,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error fetching filtered bookings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching bookings")

@api_router.get("/admin/stats")
async def get_admin_stats(days: int = 30, current_user: str = Depends(get_current_admin)):
    """Get aggregated statistics for admin dashboard"""
    try:
        # 1. Basic KPI metrics - Simplified and strict based on new definitions
        # Confirmed: transaction_id is not null AND status is confirmed
        confirmed_criteria = {"transaction_id": {"$ne": None}, "status": "confirmed"}
        # Not Completed: transaction_id is null
        pending_criteria = {"transaction_id": None}
        
        confirmed_bookings = await db.bookings.count_documents(confirmed_criteria)
        pending_bookings = await db.bookings.count_documents(pending_criteria)
        total_attempts = confirmed_bookings + pending_bookings
        
        # Total Revenue (Only from confirmed bookings using strict criteria)
        rev_pipeline = [
            {"$match": confirmed_criteria},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        rev_res = await db.bookings.aggregate(rev_pipeline).to_list(1)
        total_revenue = rev_res[0]["total"] if rev_res else 0.0

        # 2. Service Distribution (Confirmed only using strict criteria)
        service_pipeline = [
            {"$match": confirmed_criteria},
            {"$group": {"_id": "$service_type", "count": {"$sum": 1}}}
        ]
        service_stats = await db.bookings.aggregate(service_pipeline).to_list(100)
        services = [{"name": s["_id"], "value": s["count"]} for s in service_stats]

        # 3. Daily Trends (Revenue from Confirmed, Counts for both)
        trend_pipeline = [
            # Potential match for date range here if needed, e.g. last 'days' days
            {"$group": {
                "_id": {"$substr": ["$created_at", 0, 10]},
                "revenue": {
                    "$sum": { "$cond": [{"$and": [{"$ne": ["$transaction_id", None]}, {"$eq": ["$status", "confirmed"]}]}, "$amount", 0] }
                },
                "confirmed": {
                    "$sum": { "$cond": [{"$and": [{"$ne": ["$transaction_id", None]}, {"$eq": ["$status", "confirmed"]}]}, 1, 0] }
                },
                "pending": {
                    "$sum": { "$cond": [{"$eq": ["$transaction_id", None]}, 1, 0] }
                }
            }},
            {"$sort": {"_id": -1}}, # Sort descending to get latest
            {"$limit": days},
            {"$sort": {"_id": 1}} # Re-sort ascending for chart display
        ]
        trend_res = await db.bookings.aggregate(trend_pipeline).to_list(days)
        daily_trends = [
            {
                "date": t["_id"], 
                "revenue": round(t["revenue"], 2), 
                "confirmed": t["confirmed"],
                "pending": t["pending"]
            } 
            for t in trend_res
        ]

        return {
            "kpis": {
                "total_bookings": total_attempts,
                "confirmed_bookings": confirmed_bookings,
                "pending_bookings": pending_bookings,
                "total_revenue": round(total_revenue, 2),
                "conversion_rate": round((confirmed_bookings / total_attempts * 100), 1) if total_attempts > 0 else 0
            },
            "services": services,
            "daily_trends": daily_trends
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

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

@api_router.post("/services/init")
async def init_services(current_user: str = Depends(get_current_admin)):
    """Manually re-seed services if empty or user requests reset."""
    try:
        # Check if we should overwrite or just add missing?
        # User wants "default pricing". Let's upsert defaults.
        count = 0
        for key, data in PRICING_MAP.items():
            res = await db.services.update_one(
                {"key": key},
                {"$setOnInsert": {
                    "id": str(uuid.uuid4()),
                    "key": key,
                    "name": data['name'],
                    "amount": data['amount'],
                    "currency": data['currency'],
                    "category": "delivered" if "delivered" in key else ("live" if "live" in key else "aura"),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            if res.upserted_id: count += 1
        return {"message": f"Initialized {count} new services. Defaults ensured."}
    except Exception as e:
        logger.error(f"Init services error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/services", response_model=List[ServicePrice])
async def get_services():
    return await db.services.find({}, {"_id": 0}).to_list(100)

@api_router.put("/services/{service_id}", response_model=ServicePrice)
async def update_service(service_id: str, data: ServicePriceUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = await db.services.find_one_and_update(
        {"id": service_id},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Service not found")
    return result

# --- Promotions Routes ---

@api_router.get("/promotions", response_model=List[Promotion])
async def get_promotions():
    return await db.promotions.find({}, {"_id": 0}).to_list(100)

@api_router.post("/promotions", response_model=Promotion)
async def create_promotion(promo: PromotionCreate):
    # Check if code exists
    existing = await db.promotions.find_one({"code": promo.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    
    new_promo = Promotion(**promo.model_dump())
    new_promo.code = new_promo.code.upper()
    await db.promotions.insert_one(new_promo.model_dump())
    return new_promo

@api_router.delete("/promotions/{promo_id}")
async def delete_promotion(promo_id: str):
    result = await db.promotions.update_one({"id": promo_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return {"success": True}

# --- Campaign Routes ---

@api_router.get("/campaign", response_model=Optional[GlobalCampaign])
async def get_active_campaign():
    # Get the latest active campaign
    campaign = await db.campaigns.find_one({"is_active": True}, sort=[("created_at", -1)], projection={"_id": 0})
    if campaign:
        # Check expiry
        expiry = campaign.get('expiry_date')
        if isinstance(expiry, str):
            expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
        
        if expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            await db.campaigns.update_one({"id": campaign['id']}, {"$set": {"is_active": False}})
            return None
            
    return campaign

@api_router.post("/campaign", response_model=GlobalCampaign)
async def set_campaign(campaign: GlobalCampaignCreate):
    # Deactivate all old campaigns
    await db.campaigns.update_many({"is_active": True}, {"$set": {"is_active": False}})
    
    new_campaign = GlobalCampaign(
        message=campaign.message,
        discount_percentage=campaign.discount_percentage,
        expiry_date=datetime.fromisoformat(campaign.expiry_date.replace("Z", "+00:00")),
        is_active=True
    )
    await db.campaigns.insert_one(new_campaign.model_dump())
    return new_campaign

@api_router.delete("/campaign/{campaign_id}")
async def deactivate_campaign(campaign_id: str):
    result = await db.campaigns.update_one({"id": campaign_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        # Try to find any active one if ID mismatch? No, stick to ID.
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True}

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

# Middleware already configured above

# Configure logging - already configured above
# logger = logging.getLogger(__name__) - already configured above

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)