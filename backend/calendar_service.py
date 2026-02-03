import os
import datetime
import pickle
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar']

class CalendarService:
    def __init__(self):
        self.creds = None
        self.service = None
        self.initialize_credentials()

    def initialize_credentials(self):
        """Authenticates with Google Calendar API using Service Account or OAuth"""
        try:
            creds_json_str = os.environ.get('GOOGLE_CREDENTIALS')
            
            if creds_json_str:
                # Load from Environment Variable
                import json
                from google.oauth2 import service_account
                
                try:
                   info = json.loads(creds_json_str)
                   self.creds = service_account.Credentials.from_service_account_info(
                       info, scopes=SCOPES
                   )
                   logger.info("Loaded Google Credentials from Environment Variable")
                except json.JSONDecodeError as e:
                   logger.error(f"Failed to parse GOOGLE_CREDENTIALS env var: {e}")

            elif os.path.exists('credentials.json') or os.path.exists(os.path.join(os.path.dirname(__file__), 'credentials.json')):
                # Fallback to local file
                # Check current dir first, then same dir as script
                fpath = 'credentials.json'
                if not os.path.exists(fpath):
                    fpath = os.path.join(os.path.dirname(__file__), 'credentials.json')
                    
                with open(fpath) as f:
                    import json
                    info = json.load(f)
                    
                if info.get('type') == 'service_account':
                    from google.oauth2 import service_account
                    self.creds = service_account.Credentials.from_service_account_file(
                        fpath, scopes=SCOPES
                    )
                else:
                    # User Client ID
                    pass # (Legacy/Local flow logic omitted for env var priority)
                    
            else:
                 logger.error("No Google Credentials found (Env Var or credentials.json)!")

            if self.creds:
                self.service = build('calendar', 'v3', credentials=self.creds)
                self.fetch_primary_timezone()
            else:
                logger.error("Could not obtain credentials.")
                
        except Exception as err:
            logger.error(f"Failed to create calendar service: {err}")

    def fetch_primary_timezone(self):
        """Fetches the timezone setting of the primary calendar."""
        self.primary_time_zone = 'Asia/Kolkata' # Default fallback
        if not self.service: return
        try:
            calendar = self.service.calendars().get(calendarId='primary').execute()
            self.primary_time_zone = calendar.get('timeZone', 'Asia/Kolkata')
            logger.info(f"Primary Calendar Timezone detected: {self.primary_time_zone}")
        except HttpError as err:
            logger.error(f"Error fetching calendar timezone: {err}")

    def get_timezone(self):
        return self.primary_time_zone

    def get_busy_periods(self, start_iso, end_iso):
        """
        Fetch 'busy' periods from primary calendar.
        start_iso, end_iso: ISO formatted strings with timezone
        Returns list of {start, end} dicts.
        """
        if not self.service:
            logger.error("Calendar service not initialized")
            return []

        body = {
            "timeMin": start_iso,
            "timeMax": end_iso,
            "timeZone": self.primary_time_zone,
            "items": [{"id": "primary"}]
        }

        try:
            events_result = self.service.freebusy().query(body=body).execute()
            calendars = events_result.get('calendars', {})
            primary = calendars.get('primary', {})
            return primary.get('busy', [])
        except HttpError as err:
            logger.error(f"Error fetching free/busy: {err}")
            return []

    def create_event(self, summary, start_iso, end_iso, attendees_emails=None, description=""):
        """
        Inserts an event into the primary calendar.
        attendees_emails: List of email strings.
        """
        if not self.service:
            return None

        attendees = [{'email': email} for email in attendees_emails] if attendees_emails else []
        
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_iso,
                'timeZone': self.primary_time_zone,
            },
            'end': {
                'dateTime': end_iso,
                'timeZone': self.primary_time_zone,
            },
            'attendees': attendees,

        }

        try:
            event = self.service.events().insert(
                calendarId='primary', 
                body=event
            ).execute()
            return event
        except HttpError as err:
            logger.error(f"Error creating event: {err}")
            return None

    def list_events(self, start_iso, end_iso):
        """
        List events from primary calendar.
        start_iso, end_iso: ISO strings.
        Returns list of event objects.
        """
        if not self.service:
            return []

        try:
            events_result = self.service.events().list(
                calendarId='primary', 
                timeMin=start_iso, 
                timeMax=end_iso, 
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            return events_result.get('items', [])
        except HttpError as err:
            logger.error(f"Error listing events: {err}")
            return []

    def delete_event(self, event_id):
        """Deletes an event from primary calendar."""
        if not self.service: return False
        try:
            self.service.events().delete(calendarId='primary', eventId=event_id).execute()
            return True
        except HttpError as err:
            logger.error(f"Error deleting event: {err}")
            return False

    def update_event(self, event_id, summary, start_iso, end_iso, description=""):
        """Updates an event in primary calendar."""
        if not self.service: return None
        
        event_body = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_iso,
                'timeZone': self.primary_time_zone,
            },
            'end': {
                'dateTime': end_iso,
                'timeZone': self.primary_time_zone,
            },
        }
        
        try:
            updated_event = self.service.events().update(
                calendarId='primary', 
                eventId=event_id, 
                body=event_body
            ).execute()
            return updated_event
        except HttpError as err:
            logger.error(f"Error updating event: {err}")
            return None

# Singleton instance
calendar_service = CalendarService()
