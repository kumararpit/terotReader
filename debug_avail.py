import sys
import os
import datetime

print("DEBUG SCRIPT STARTED", flush=True)

# Ensure we are in backend dir to find credentials.json
if os.path.exists('backend'):
    os.chdir('backend')

# Add current dir to path (now backend)
sys.path.append(os.getcwd())

try:
    from calendar_service import calendar_service
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def debug_availability():
    print("--- Debugging Availability ---")
    
    # Check Credentials
    if not calendar_service.service:
        print("ERROR: Calendar Service not initialized. Check credentials.json/token.pickle")
        return

    # Define Range (Today)
    today = datetime.date.today().isoformat()
    TZ_OFFSET = "+05:30"
    start_iso = f"{today}T00:00:00{TZ_OFFSET}"
    end_iso = f"{today}T23:59:59{TZ_OFFSET}"
    
    print(f"Fetching events for {today}...")
    
    # Try Creating a Test Event first to ensure data exists
    print("Attempting to create TEST event: REGULAR_TIMING...")
    start_dt = f"{today}T10:00:00+05:30"
    end_dt = f"{today}T14:00:00+05:30"
    try:
        created = calendar_service.create_event(
            "REGULAR_TIMING", # Keyword
            start_dt,
            end_dt,
            description="Test Event by Debug Script"
        )
        print(f"Created Event ID: {created.get('id')}")
    except Exception as e:
        print(f"Failed to create event: {e}")

    events = calendar_service.list_events(start_iso, end_iso)
    print(f"Total Events Found: {len(events)}")
    
    for i, e in enumerate(events):
        summary = e.get('summary', '[No Summary]')
        start = e.get('start', {}).get('dateTime', e.get('start', {}).get('date'))
        end = e.get('end', {}).get('dateTime', e.get('end', {}).get('date'))
        print(f"[{i+1}] {summary} | {start} -> {end}")
        
        # Test Matching Logic
        if "REGULAR_TIMING" in summary:
            print("   -> MATCHES REGULAR_TIMING")
        elif "EMERGENCY_TIMING" in summary:
            print("   -> MATCHES EMERGENCY_TIMING")
        else:
            print("   -> IGNORED (Busy Block?)")

    print("\n--- End Debug ---")

if __name__ == "__main__":
    debug_availability()
