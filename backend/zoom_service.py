import httpx
import base64
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ZOOM_ACCOUNT_ID = os.getenv("ZOOM_ACCOUNT_ID")
ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID")
ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET")

async def get_zoom_token():
    url = "https://zoom.us/oauth/token"
    
    if not ZOOM_ACCOUNT_ID or not ZOOM_CLIENT_ID or not ZOOM_CLIENT_SECRET:
        logger.error("Zoom credentials are missing in .env")
        return None

    # 1. Manually build the Basic Auth string
    auth_str = f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    # 2. Use Query Parameters (as verified by debug script)
    params = {
        "grant_type": "account_credentials",
        "account_id": ZOOM_ACCOUNT_ID
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, params=params)
            
        if response.status_code != 200:
            logger.error(f"DEBUG ZOOM RESPONSE: {response.text}") 
            return None
            
        return response.json().get("access_token")
    except Exception as e:
        logger.error(f"Error fetching Zoom token: {e}")
        return None

async def create_meeting(topic: str, start_time_str: str, duration: int = 40, agenda: str = None):
    """
    Creates a Zoom meeting.
    start_time_str should be ISO format like "2026-03-05T15:00:00"
    """
    token = await get_zoom_token()
    if not token:
        logger.warning("No Zoom token available. Skipping meeting creation.")
        return None

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Ensure start_time is properly formatted for Zoom (yyyy-MM-ddTHH:mm:ssZ)
    try:
        if "T" not in start_time_str:
            start_time_str = start_time_str.replace(" ", "T")
            if len(start_time_str.split(":")) == 2:
                start_time_str += ":00"
    except Exception:
        pass 

    meeting_details = {
        "topic": topic,
        "type": 2,  # Scheduled meeting
        "start_time": start_time_str,
        "duration": duration,
        "timezone": "UTC",
        "settings": {
            "host_video": False,
            "participant_video": False,
            "join_before_host": False,
            "mute_upon_entry": True,
            "waiting_room": True
        }
    }
    
    if agenda:
        meeting_details["agenda"] = agenda

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.zoom.us/v2/users/me/meetings",
                headers=headers,
                json=meeting_details
            )
        
        if response.status_code == 201:
            data = response.json()
            return data.get("join_url")
        else:
            logger.error(f"Zoom API Error: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error creating Zoom meeting: {e}")
        return None