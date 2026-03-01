# 🔮 Tarot Admin Portal: A Mastery Guide

Welcome to your command center. This guide will walk you through the powerful features of your admin portal, designed to help you manage your sessions, marketing, and testimonials with elegance and efficiency.

---

## 🔐 Access & Security

### 1. First-Time Setup
If this is a new installation, the portal will prompt you to create an **Administrator Account**. 
- Choose a secure username and a robust password.
- Provide a valid email for security resets.

### 2. Secure Login
Accessible at `/admin`. Use your credentials to enter the dashboard.
- **Tip**: The portal uses secure HttpOnly cookies, meaning you won't be logged out by clearing your browser's local storage.

### 3. Password Recovery
If you forget your password, click **"Forgot?"** on the login screen. A verification code will be sent to your registered email to allow a secure reset.

---

## 📅 Managing Your Calendar (Manage Slots)

The Slots tab is where you control your time. It is divided into an intuitive three-step workflow.

### Step 1: Select a Date
Use the interactive calendar to pick the day you wish to manage. Dates with existing slots or availability will be your primary focus.

### Step 2: Set Availability Windows
Instead of creating slots one by one, you can define **Availability Windows**.
- **Usage**: Select a **Start Time** and **End Time**, then click **"Set Availability"**.
- **Visual Feedback**: Your working hours will appear as a soft green (Regular) or amber (Emergency) background on the timeline.
- **Overlap Protection**: The system will automatically warn you if a new window overlaps with existing bookings, offering to "clip" the window to avoid conflicts.

### Step 3: Individual Slot Management
You can fine-tune your day by adding or removing specific time slots.
- **Add Slot**: Enter a specific time and choose the type (Regular/Emergency).
- **Delete Slot**: Click the Trash icon on any unbooked slot to remove it from the public view.

### 📊 The Daily Timeline
A high-level view of your day:
- **Empty Slots**: Ready for booking.
- **Booked Slots**: Displays the client's information. Click **"View Details"** for a full breakdown of their booking, including their name, email, and any special notes.
- **Canceled Slots**: Marked clearly to show lost opportunities or time freed up.

---

## 🌍 Timezone Intelligence

To provide a seamless experience, the portal automatically adapts to your location.

### 📍 Automatic Detection
The admin dashboard detects your browser's local timezone (e.g., *Europe/Rome*, *Asia/Kolkata*, etc.) as soon as you log in. This ensures that the **Daily Timeline** always reflects your current local time.

### 🔄 Intelligent Conversion
- **Admin View**: You see all slots and availability in **your local time**. 
- **System Sync**: When you set availability or create a slot, the backend automatically calculates the correct UTC time.
- **Client View**: Clients browsing from different parts of the world will see your availability converted to **their local time**.

> [!IMPORTANT]
> You can see your active timezone displayed at the top right of the dashboard header. If you travel, the portal will automatically update to reflect your new local time.

---

## 🏷️ Promotions & Marketing

Grow your business using the **Promotions** tab.

### 🎟️ Forge New Promo Codes
Create custom discount codes for your clients:
- **Percentage Off**: (e.g., 20% discount).
- **Fixed Amount**: (e.g., €50 discount).
- **Usage Limits**: Control how many times a code can be used globally.

### 🌍 Global Campaigns
Want to run a "Lunar Sale" or "New Year Discount" for *everyone*? 
- Use the **Launch New Campaign** section.
- This applies a discount to all services automatically without requiring a code.

### 🛠️ Managing active items
To keep the UI clean, we use an **Inline Confirmation** system:
1. Click the **Trash Icon**.
2. Two buttons will appear: **"Delete"** (or "End Now") and **"No"** (or "Keep").
3. This ensures you never accidentally delete a promotion with a single misclick.

---

## 💬 Testimonials

Review and manage the feedback your clients leave. 
- You can manually add testimonials to highlight your best reviews.
- Delete any testimonials that no longer reflect your current service quality.

---

## 📱 Mobile Command Center

The admin portal is fully responsive.
- **Navigation**: Click the **Hamburger Menu** (top right) to switch between Slots, Testimonials, and Promotions.
- **Tables**: On smaller screens, the **Service Pricing** and **Daily Timeline** allow horizontal scrolling so you never lose visibility of important data.
- **Touch-Friendly**: Buttons and icons have been enlarged to ensure easy interaction on tablets and smartphones.

---

## 🌐 Global Timezone Sync

The application is built to handle global consultations with precision:
- **Automatic Detection**: The system detects the user's (client or admin) local timezone automatically.
- **Intelligent Translation**:
    - **Admin Dashboard**: Shows all slots and availability in the **Admin's local time**.
    - **Booking Interface**: Shows availability converted to the **Client's local time**.
- **UTC Preservation**: All data is stored and processed in UTC to ensure no session is ever missed due to daylight savings or travel.

---


> [!TIP]
> **Pro Tip**: Keep an eye on the **Toasts** (notifications) at the bottom for instant feedback when you successfully update availability or delete a record.
