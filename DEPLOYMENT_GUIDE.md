# Deployment Guide

This guide details the steps to deploy the Tarot Reader application.
The architecture consists of:
- **Database**: MongoDB Atlas
- **Backend**: Render.com (Python FastAPI)
- **Frontend**: Vercel (React)

## 1. Prerequisites

- GitHub account (code must be pushed to a repository).
- [Render.com](https://render.com) account.
- [Vercel](https://vercel.com) account.
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (Cluster already set up).

## 2. Backend Deployment (Render.com)

1.  **Dashboard**: Go to your Render Dashboard.
2.  **New File Plan**: Click **New +** -> **Blueprints**.
3.  **Connect Repo**: Connect your GitHub repository `kumararpit/terotReader` (or whatever the repo name is).
4.  **Auto Config**: Render will detect `render.yaml` and prompt you to apply it.
5.  **Environment Variables**:
    You will be asked to provide values for the variables marked as `sync: false` in `render.yaml`. Use the values from your local `.env` file (but **DO NOT** commit the `.env` file).
    
    Required Secrets:
    - `MONGO_URL`: Your MongoDB connection string.
    - `CORS_ORIGINS`: The URL of your Frontend (you will get this after Step 3). For now, you can use `*` or leave it empty and update later.
    - `SMTP_USER`: Email for sending notifications.
    - `SMTP_PASSWORD`: App Password for the email.
    - `ADMIN_EMAIL`: Admin notification email.
    - `STRIPE_SECRET_KEY`: Stripe Private Key.
    - `RAZORPAY_KEY_*`: Razorpay credentials.
    - `PAYPAL_*`: PayPal credentials.
    - `PAYPAL_*`: PayPal credentials.
    - `ZOOM_*`: Zoom App credentials.
    - `GOOGLE_CREDENTIALS`: The **Content** of your `backend/credentials.json` file.
      *   Open `backend/credentials.json` in a text editor.
      *   Copy the entire JSON content.
      *   Paste it as the value for this environment variable.
      *   (Optional) You can minify the JSON (remove newlines) to make it cleaner, but it's not strictly required.

6.  **Deploy**: Click **Apply**. Render will build and deploy the backend.
7.  **URL**: Note down the backend URL (e.g., `https://tarotreader-backend.onrender.com`).

## 3. Frontend Deployment (Vercel)

1.  **Dashboard**: Go to Vercel Dashboard.
2.  **Add New**: Click **Add New...** -> **Project**.
3.  **Import**: Import the same GitHub repository.
4.  **Configure Project**:
    - **Framework Preset**: Create React App (should auto-detect).
    - **Root Directory**: Click **Edit** and select `frontend`.
5.  **Environment Variables**:
    Add the following environment variable:
    - `REACT_APP_BACKEND_URL`: The URL of your backend from Step 2 (e.g., `https://tarotreader-backend.onrender.com`).
      *Note: Do NOT add a trailing slash `/`.*

6.  **Deploy**: Click **Deploy**.
7.  **URL**: Note down the frontend URL (e.g., `https://tarot-reader.vercel.app`).

## 4. Final Configuration

1.  **Update Backend CORS**:
    - Go back to your Render Dashboard -> Services -> `tarotreader-backend` -> Environment.
    - Edit `CORS_ORIGINS` and set it to your Vercel URL (e.g., `https://tarot-reader.vercel.app`).
    - Save changes. Render will auto-redeploy.

2.  **Verify**:
    - Open your Vercel URL.
    - Try to book a slot or log in to Admin panel.

## 5. Keep-Alive (Prevent Sleep)

Render's Free Tier spins down after 15 minutes of inactivity. To keep it awake:
1.  Go to [Cron-job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/).
2.  Create a new monitor/job.
3.  **URL**: `https://your-backend-url.onrender.com/api/health`
4.  **Interval**: Every 10 minutes.
5.  This will "ping" your server and prevent it from going to sleep.

## Troubleshooting

- **Backend Logs**: Check the "Logs" tab in Render if the API fails.
- **Frontend Errors**: Open Browser Console (F12) to see if network requests are failing (CORS errors usually mean `CORS_ORIGINS` is wrong).
