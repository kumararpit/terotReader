from calendar_service import calendar_service
import datetime

def investigate():
    date = "2026-02-03"
    start = f"{date}T00:00:00+05:30"
    end = f"{date}T23:59:59+05:30"
    
    print(f"Listing events for {date}...")
    events = calendar_service.list_events(start, end)
    
    for e in events:
        summary = e.get('summary', 'No Summary')
        start_t = e['start'].get('dateTime', e['start'].get('date'))
        end_t = e['end'].get('dateTime', e['end'].get('date'))
        print(f"Event: {summary}")
        print(f"  Start: {start_t}")
        print(f"  End:   {end_t}")
        print("-" * 30)

if __name__ == "__main__":
    investigate()
