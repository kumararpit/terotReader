# Timezone-Safe Booking System Rules
React + FastAPI + PostgreSQL + Zoom

This document defines the rules for implementing a globally reliable booking system
where users can schedule meetings from any timezone without errors.

The system must store all times in UTC and convert only in the UI layer.

---

## System Stack

Frontend: React  
Backend: FastAPI  
Video Meetings: Zoom API  

---

## Core Principle

Always store time in UTC.

Never store local time in the database.

Correct format:
```
2026-02-10T09:00:00Z
```

---

## Rule 1 — Database Storage

Database column must be:

```
TIMESTAMP WITH TIME ZONE
```

Example schema:

```
Booking
--------
id
email
meeting_time_utc
zoom_join_url
created_at
```

---

## Rule 2 — FastAPI Datetime Handling

Always use timezone-aware datetime objects.

```python
from datetime import datetime, timezone
```

Example:
```python
datetime.now(timezone.utc)
```

Pydantic model:
```python
class BookingRequest(BaseModel):
    meeting_time: datetime
```

Reject naive datetime values.

---

## Rule 3 — Detect User Timezone (React)

Frontend must detect timezone automatically:

```js
Intl.DateTimeFormat().resolvedOptions().timeZone
```

Example result:
```
Asia/Kolkata
Europe/Rome
America/New_York
```

---

## Rule 4 — Convert Local Time to UTC (Frontend)

Use dayjs timezone plugins.

Required packages:
```
dayjs
dayjs/plugin/utc
dayjs/plugin/timezone
```

Conversion pattern:
```js
dayjs.tz(localTime, userTZ).utc().format()
```

Only UTC should be sent to the backend.

---

## Rule 5 — API Contract

Booking API must accept UTC ISO-8601.

Example request:
```json
{
  "meeting_time": "2026-02-10T09:00:00Z"
}
```

---

## Rule 6 — Zoom Meeting Creation

Zoom must always receive UTC timestamps.

Example payload:
```json
{
  "start_time": "2026-02-10T09:00:00Z",
  "timezone": "UTC"
}
```

Never convert Zoom time using server timezone.

---

## Rule 7 — Display Time in UI

Convert UTC to local timezone only when displaying.

```js
dayjs.utc(apiTime).local().format("DD MMM YYYY hh:mm A")
```

Also display detected timezone:

```
Your timezone: Asia/Kolkata
```

---

## Rule 8 — Daylight Saving Safety

Always rely on timezone libraries.

Never do manual offset math.

Forbidden:
```
+5:30 adjustments
getTimezoneOffset math
manual hour subtraction
```

---

## Rule 9 — Backend Validation

Backend must reject:
- naive datetime
- non-ISO datetime
- local-time strings

Only UTC ISO-8601 is allowed.

---

## Rule 10 — Logging

All backend logs must use UTC timestamps.

---

## Acceptance Criteria

System is correct if:

- Italy booking displays correctly in India
- Zoom meeting time matches confirmation email
- DST changes do not affect meetings
- Database contains only UTC timestamps
- UI always shows local time
