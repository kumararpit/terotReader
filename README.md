# 🔮 Tarot Reader Tejashvini

A premium, modern web application for tarot card reading services. This platform offers a seamless experience for booking sessions, processing payments, and managing consultations through a dedicated admin dashboard.

---

## ✨ Features

- **Service Varieties**:
  - 📧 **Delivered Readings**: Written tarot insights sent directly to your email (3 or 5 question options).
  - 🎥 **Live Readings**: Real-time sessions via Zoom (20 or 40-minute slots) with automated scheduling.
  - 🌀 **Aura Scanning**: Energy field assessment based on photo analysis.
- **Smart Scheduling**: Integration with **Google Calendar** for real-time availability and **Zoom** for automated meeting links.
- **Secure Payments**: Multi-gateway support including **Stripe**, **PayPal**, and **Razorpay**.
- **Admin Dashboard**: Comprehensive management of bookings, availability slots, and client testimonials.
- **Automated Communication**: Instant email confirmations for clients and admin notifications with PDF booking details.
- **Premium UI**: Craftily designed with a calming light theme, smooth animations, and responsive layouts.
- **Security**: Robust authentication for admin access and secure handling of environment variables.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/)
- **State/Routing**: [React Router](https://reactrouter.com/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via Motor async driver)
- **Integrations**: Google Calendar API, Zoom OAuth2, SMTP for Emails
- **Payments**: Stripe, Razorpay, PayPal SDKs
- **PDF Generation**: [ReportLab](https://www.reportlab.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB (Running locally or on Atlas)

### Setup & Running
This project uses a unified `run.sh` script to simplify development.

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd tarotReader-main
    ```

2.  **Configuration**:
    - Create a `.env` file in the `backend/` directory from `.env.example`.
    - Create a `.env` file in the `frontend/` directory (set `REACT_APP_BACKEND_URL`).

3.  **Run the Application**:
    Use the provided shell script to install dependencies and start both servers:
    ```bash
    # For the first time (to install dependencies)
    ./run.sh --install

    # Regular start
    ./run.sh
    ```
    - **Frontend**: http://localhost:3000
    - **Backend API**: http://localhost:8000

---

## 📂 Project Structure

```text
.
├── backend/              # FastAPI server, services, and logic
│   ├── auth.py           # Admin authentication
│   ├── calendar_service.py # Google Calendar integration
│   ├── email_service.py    # SMTP and PDF generation
│   ├── server.py         # Main API routes
│   └── zoom_service.py   # Zoom meeting automation
├── frontend/             # React application
│   ├── src/components/   # Modular UI components
│   ├── src/pages/        # Routed pages
│   └── public/           # Static assets
├── run.sh                # Unified startup script
└── render.yaml           # Deployment configuration for Render
```

---

## 🛡 Admin Setup

On initial startup, navigate to `/admin/setup` (on the frontend) to create the primary admin account. This will initialize the `users` collection in MongoDB.

---

## 🌐 Deployment (Render)

The project includes a `render.yaml` for quick deployment to [Render](https://render.com/).

1. Connect your GitHub repository to Render.
2. Render will detect the Blueprints and prompt for environment variables:
   - `MONGO_URL`
   - `STRIPE_SECRET_KEY`
   - `SMTP_USER` / `SMTP_PASSWORD`
   - `GOOGLE_CREDENTIALS` (JSON format)
   - `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET`

---

## 📄 License

© 2026 Tarot Reader Tejashvini. All rights reserved.