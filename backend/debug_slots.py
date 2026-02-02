from datetime import datetime, timedelta
import os
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

BUSINESS_TZ = ZoneInfo('Asia/Kolkata')

def to_minutes(time_str):
    try:
        if 'T' not in time_str: return -1 
        if time_str.endswith('Z'): time_str = time_str.replace('Z', '+00:00')
        dt = datetime.fromisoformat(time_str)
        target_tz = BUSINESS_TZ
        dt_local = dt.astimezone(target_tz)
        return dt_local.hour * 60 + dt_local.minute
    except Exception as e:
        print(f"Error parse: {e}")
        return 0

def debug():
    # Simulate GCal Event: 04:30Z to 09:30Z (10:00 IST to 15:00 IST)
    start_iso = "2026-02-02T04:30:00Z"
    end_iso = "2026-02-02T09:30:00Z"
    
    s_min = to_minutes(start_iso)
    e_min = to_minutes(end_iso)
    print(f"Start: {s_min} (10:00), End: {e_min} (15:00)")
    
    current = s_min
    duration = 40
    
    while current + duration <= e_min:
        slot_start = current
        slot_end = current + duration
        
        # Format
        h = slot_start // 60
        m = slot_start % 60
        time_str = f"{h:02d}:{m:02d}"
        
        h_end = slot_end // 60
        m_end = slot_end % 60
        end_str = f"{h_end:02d}:{m_end:02d}"

        print(f"Slot: {time_str} - {end_str} (Start: {current}, End: {slot_end})")
        
        current += 20

if __name__ == "__main__":
    debug()
