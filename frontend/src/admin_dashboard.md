AI Agent Development Specifications: Divine Decode Admin Dashboard

Project Overview

Goal: Develop a responsive Admin Monitoring Dashboard for "Divine Decode," a Tarot reading website. The dashboard will allow the administrator to manage bookings, view revenue statistics, and track upcoming sessions.


1. Frontend Specifications (React + Tailwind)

A. Core Layout & Navigation

Sidebar:

Fixed left sidebar (collapsible on mobile).

Background: Deep Purple (#2D1B4E).

Navigation Items: Dashboard, Bookings, Clients, Settings.

Active State: Gold accent/border (#D4AF37).

Header:

Top bar with a "Hamburger" menu for mobile toggle.

"Accepting Bookings" status indicator (Live/Pulse animation).

Notification Bell and User Profile avatar.

Responsive Behavior:

On < 1024px width, sidebar hides and becomes an overlay.

B. Dashboard View Components

Summary Statistics Cards:

Display 3 key metrics: "Readings This Month", "Total Revenue" (in ₹), "Pending Requests".

Include percentage change indicators (e.g., "+12% vs last month").

Use specific icons: Star, EuroSign, Clock.

Next Session Card:

Prominent card displaying the immediate next confirmed booking.

Show: Client Name, Service Type, Time remaining (e.g., "15 Minutes"), and a "Join Meeting" button.

Style: Gradient background (from-[#2D1B4E] to-[#4B2F7A]).

Recent Activity Feed:

Vertical list showing recent events (New Booking, Payment Received, New Inquiry).

Color-coded dots for different event types.

Availability Toggle:

A quick action widget to switch status between "Live" and "Away".

Action: Sends a POST request to /api/admin/availability.

C. Bookings Management View

Data Table:

Columns: Client Details (Avatar + Name), Service Type, Date & Time, Payment Status, Booking Status, Actions.

Status Badges:

Component to render color-coded pills:

Confirmed: Green

Pending: Amber

Completed: Blue

Cancelled: Red

2. Backend Specifications (FastAPI)

A. Database Models (SQLAlchemy)

Create the following tables in models.py:

Table: bookings
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | Integer (PK) | Auto-increment |
| client_name | String | |
| email | String | |
| service_type | String | e.g., "Love Reading" |
| booking_time | DateTime | |
| duration_minutes | Integer | |
| status | String | Confirmed, Pending, Completed, Cancelled |
| payment_status | String | Paid, Unpaid |
| notes | Text | Encrypted/Private admin notes |

Table: admin_settings
| Column | Type | Notes |
| :--- | :--- | :--- |
| key | String (PK) | e.g., "is_accepting_bookings" |
| value | String | "true"/"false" |

B. Pydantic Schemas (schemas.py)

Define response models to ensure type safety:

BookingOut: Returns booking details formatted for the table.

DashboardStats: Returns total_revenue, monthly_readings, and pending_count.


C. API Endpoints

Implement the following routes in routers/admin.py:

GET /api/admin/stats

Query the DB to calculate total revenue, count readings for current month, and count pending status.

GET /api/admin/next-session

Fetch the single nearest future booking where status == 'Confirmed'.

GET /api/admin/bookings

Fetch all bookings with optional query parameters for pagination (limit, offset) and status filtering.

3. Style Guide & Assets

Primary Brand Color: Royal Purple (#2D1B4E, Tailwind bg-[#2D1B4E])

Secondary/Accent: Gold/Amber (#D4AF37, Tailwind text-yellow-400)

Background: Off-white (#F9FAFB)

Icons: Lucide React (Stroke width: 2px)