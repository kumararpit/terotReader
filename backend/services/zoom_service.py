import httpx
import base64
import os
import logging
import time
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', 'env', '.env')
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

ZOOM_ACCOUNT_ID = os.getenv("ZOOM_ACCOUNT_ID")
ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID")
ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET")

async def get_zoom_token():
    """Fetches an OAuth access token from Zoom."""
    logger.info("Action=get_zoom_token Status=started")
    url = "https://zoom.us/oauth/token"
    
    if not ZOOM_ACCOUNT_ID or not ZOOM_CLIENT_ID or not ZOOM_CLIENT_SECRET:
        logger.error("Action=get_zoom_token Status=failed Reason=missing_credentials")
        return None

    # 1. Manually build the Basic Auth string
    auth_str = f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    params = {
        "grant_type": "account_credentials",
        "account_id": ZOOM_ACCOUNT_ID
    }
    
    start_time = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, params=params)
            
        duration = (time.time() - start_time) * 1000
        if response.status_code != 200:
            logger.error(f"Action=get_zoom_token Status=failed StatusCode={response.status_code} Error={response.text} Duration={duration:.2f}ms")
            return None
            
        token = response.json().get("access_token")
        logger.info(f"Action=get_zoom_token Status=finished Duration={duration:.2f}ms")
        return token
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Action=get_zoom_token Status=failed Error={str(e)} Duration={duration:.2f}ms", exc_info=True)
        return None

async def create_meeting(topic: str, start_time_str: str, duration_mins: int = 40, agenda: str = None):
    """
    Creates a Zoom meeting.
    start_time_str should be ISO format like "2026-03-05T15:00:00"
    """
    logger.info(f"Action=create_meeting Status=started Topic='{topic}' Start={start_time_str}")
    
    token = await get_zoom_token()
    if not token:
        logger.warning("Action=create_meeting Status=failed Reason=no_token")
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
        "duration": duration_mins,
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

    start_time = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.zoom.us/v2/users/me/meetings",
                headers=headers,
                json=meeting_details
            )
        
        duration = (time.time() - start_time) * 1000
        if response.status_code == 201:
            data = response.json()
            join_url = data.get("join_url")
            logger.info(f"Action=create_meeting Status=finished JoinURL={join_url} Duration={duration:.2f}ms")
            return join_url
        else:
            logger.error(f"Action=create_meeting Status=failed StatusCode={response.status_code} Error={response.text} Duration={duration:.2f}ms")
            return None
            
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Action=create_meeting Status=failed Error={str(e)} Duration={duration:.2f}ms", exc_info=True)
        return None