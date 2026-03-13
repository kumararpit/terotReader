import os
import datetime
import pickle
import os.path
import time
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from services.logger import mask_pii

logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar']

class CalendarService:
    def __init__(self):
        self.creds = None
        self.service = None
        self.primary_time_zone = 'Europe/Rome'
        logger.debug("Action=CalendarService.__init__ Status=started")
        self.initialize_credentials()

    def initialize_credentials(self):
        """Authenticates with Google Calendar API using Service Account or OAuth."""
        logger.info("Action=initialize_credentials Status=started")
        start_time = time.time()
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
                   logger.info("Action=initialize_credentials Method=env_var Status=success")
                except json.JSONDecodeError as e:
                   logger.error(f"Action=initialize_credentials Method=env_var Status=failed Error={str(e)}")

            elif os.path.exists('credentials.json') or \
                 os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'credentials.json')) or \
                 os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'env', 'credentials.json')):
                # Fallback to local file
                fpath = 'credentials.json'
                if not os.path.exists(fpath):
                    fpath = os.path.join(os.path.dirname(__file__), '..', 'credentials.json')
                if not os.path.exists(fpath):
                    fpath = os.path.join(os.path.dirname(__file__), '..', 'env', 'credentials.json')
                    
                logger.debug(f"Action=initialize_credentials Method=file Path={fpath} Status=attempting")
                with open(fpath) as f:
                    import json
                    info = json.load(f)
                    
                if info.get('type') == 'service_account':
                    from google.oauth2 import service_account
                    self.creds = service_account.Credentials.from_service_account_file(
                        fpath, scopes=SCOPES
                    )
                    logger.info("Action=initialize_credentials Method=file Status=success")
                else:
                    logger.warning("Action=initialize_credentials Method=file Status=invalid_type")
                    
            else:
                 logger.error("Action=initialize_credentials Status=no_creds_found")

            if self.creds:
                self.service = build('calendar', 'v3', credentials=self.creds)
                self.fetch_primary_timezone()
                duration = (time.time() - start_time) * 1000
                logger.info(f"Action=initialize_credentials Status=finished Duration={duration:.2f}ms")
            else:
                logger.error("Action=initialize_credentials Status=failed_no_creds")
                
        except Exception as err:
            logger.error(f"Action=initialize_credentials Status=failed Error={str(err)}", exc_info=True)

    def fetch_primary_timezone(self):
        """Fetches the timezone setting of the primary calendar."""
        logger.debug("Action=fetch_primary_timezone Status=started")
        if not self.service: 
            logger.warning("Action=fetch_primary_timezone Status=no_service")
            return
        
        start_time = time.time()
        try:
            calendar = self.service.calendars().get(calendarId='primary').execute()
            self.primary_time_zone = calendar.get('timeZone', 'Europe/Rome')
            duration = (time.time() - start_time) * 1000
            logger.info(f"Action=fetch_primary_timezone Status=finished Timezone={self.primary_time_zone} Duration={duration:.2f}ms")
        except HttpError as err:
            logger.error(f"Action=fetch_primary_timezone Status=failed Error={str(err)}")

    def get_timezone(self):
        return self.primary_time_zone

    def get_busy_periods(self, start_iso, end_iso):
        """Fetch 'busy' periods from primary calendar."""
        logger.info(f"Action=get_busy_periods Status=started Start={start_iso} End={end_iso}")
        if not self.service:
            logger.error("Action=get_busy_periods Status=no_service")
            return []

        body = {
            "timeMin": start_iso,
            "timeMax": end_iso,
            "timeZone": self.primary_time_zone,
            "items": [{"id": "primary"}]
        }

        start_time = time.time()
        try:
            events_result = self.service.freebusy().query(body=body).execute()
            calendars = events_result.get('calendars', {})
            primary = calendars.get('primary', {})
            busy_periods = primary.get('busy', [])
            duration = (time.time() - start_time) * 1000
            logger.info(f"Action=get_busy_periods Status=finished Count={len(busy_periods)} Duration={duration:.2f}ms")
            return busy_periods
        except HttpError as err:
            logger.error(f"Action=get_busy_periods Status=failed Error={str(err)}")
            return []

    def create_event(self, summary, start_iso, end_iso, attendees_emails=None, description=""):
        """Inserts an event into the primary calendar."""
        masked_emails = [mask_pii(e) for e in attendees_emails] if attendees_emails else []
        logger.info(f"Action=create_event Status=started Summary='{summary}' Attendees={masked_emails}")
        
        if not self.service:
            logger.error("Action=create_event Status=no_service")
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

        start_time = time.time()
        try:
            event = self.service.events().insert(
                calendarId='primary', 
                body=event
            ).execute()
            duration = (time.time() - start_time) * 1000
            logger.info(f"Action=create_event Status=finished EventID={event.get('id')} Duration={duration:.2f}ms")
            return event
        except HttpError as err:
            logger.error(f"Action=create_event Status=failed Error={str(err)}", exc_info=True)
            return None

    def list_events(self, start_iso, end_iso):
        """List events from primary calendar."""
        logger.debug(f"Action=list_events Status=started Start={start_iso} End={end_iso}")
        if not self.service:
            logger.error("Action=list_events Status=no_service")
            return []

        start_time = time.time()
        try:
            events_result = self.service.events().list(
                calendarId='primary', 
                timeMin=start_iso, 
                timeMax=end_iso, 
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            items = events_result.get('items', [])
            duration = (time.time() - start_time) * 1000
            logger.info(f"Action=list_events Status=finished Count={len(items)} Duration={duration:.2f}ms")
            return items
        except HttpError as err:
            logger.error(f"Action=list_events Status=failed Error={str(err)}")
            return []

    def delete_event(self, event_id):
        """Deletes an event from primary calendar."""
        logger.info(f"Action=delete_event Status=started EventID={event_id}")
        if not self.service:
            logger.error("Action=delete_event Status=no_service")
            return False
            
        start_time = time.time()
        try:
            self.service.events().delete(calendarId='primary', eventId=event_id).execute()
            duration = (time.time() - start_time) * 1000
            logger.info(f"Action=delete_event Status=success EventID={event_id} Duration={duration:.2f}ms")
            return True
        except HttpError as err:
            logger.error(f"Action=delete_event Status=failed EventID={event_id} Error={str(err)}")
            return False

    def update_event(self, event_id, summary, start_iso, end_iso, description=""):
        """Updates an event in primary calendar."""
        logger.info(f"Action=update_event Status=started EventID={event_id} Summary='{summary}'")
        if not self.service:
            logger.error("Action=update_event Status=no_service")
            return None
        
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
        
        start_time = time.time()
        try:
            updated_event = self.service.events().update(
                calendarId='primary', 
                eventId=event_id, 
                body=event_body
            ).execute()
            duration = (time.time() - start_time) * 1000
            logger.info(f"Action=update_event Status=finished EventID={event_id} Duration={duration:.2f}ms")
            return updated_event
        except HttpError as err:
            logger.error(f"Action=update_event Status=failed EventID={event_id} Error={str(err)}", exc_info=True)
            return None

# Singleton instance
calendar_service = CalendarService()

