# 🚀 Atomic Habits Tracker — Deployment Guide

This guide details how to deploy the **Backend API** to **Render** and the **Frontend SPA** to **Vercel** with full push notification support across mobile and PC.

---

## 1. Deploying Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **"New +" → "Web Service"**.
2. Connect your GitHub repository: `habitTracker`.
3. Fill in the service configuration:
   - **Name**: `atomic-habits-api` (or your choice)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | `mongodb+srv://pranav06:Pranav2006@cluster0.lj0ud71.mongodb.net/atomic_habits?retryWrites=true&w=majority` |
   | `NTFY_TOPIC` | `atomic-habits-pranav` |
   | `VAPID_PUBLIC_KEY` | `BAHn1E9Rr4RtlCYZ7UkdU8fhMDwL7xVoJ0tmUnTd8dGs4Xo6O7G7U_KyFYmZ-cQ0Z98p6O8dz3S0GnshrQx-my4` |
   | `VAPID_PRIVATE_KEY` | `nAdFLdP2loh7R670Dk9SlGeF0wHs-z-LsYMgdIAGJ9I` |
   | `VAPID_SUBJECT` | `mailto:admin@atomic-habits.local` |
   | `FRONTEND_URL` | `https://<your-vercel-app>.vercel.app` |
5. Click **"Deploy Web Service"**.
6. Once deployed, note down your Render service URL:  
   `https://<your-render-app>.onrender.com`

---

## 2. Deploying Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New..." → "Project"**.
2. Import the `habitTracker` repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: click **Edit** and choose `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<your-render-app>.onrender.com/api` |
5. Click **"Deploy"**.
6. When Vercel completes deployment, copy your Vercel URL (e.g. `https://habit-tracker-pranav.vercel.app`) and paste it into Render's `FRONTEND_URL` environment variable.

---

## 3. Keep Backend Awake 24/7 & Trigger On-Time Reminders

Render free tier instances sleep after 15 minutes of inactivity. Use a free monitoring service like [cron-job.org](https://cron-job.org/) to keep it awake and trigger on-time habit reminders:
1. Create a free account at [cron-job.org](https://cron-job.org/).
2. Create a new cron job:
   - **URL**: `https://<your-render-app>.onrender.com/api/cron/check`
   - **Schedule**: Every 1 minute (`* * * * *`)
   - **Request Method**: `GET`
3. This keeps your Render backend running 24/7 without cold starts and evaluates scheduled habit reminders every minute!

---

## 4. Notification Verification

### Mobile Notifications (Standard App Sound)
- Connect via `https://ntfy.sh/atomic-habits-pranav` (scan QR in app modal).
- Alerts are dispatched with `Sound: 'default'` and `Priority: 'high'`, using your phone's default notification sound rather than alarm sirens.
- Completed habits are strictly muted.

### PC Desktop Notifications (Tab Open or Closed)
- Open the deployed app on your computer.
- Click **"🔔 PC & Mobile Alerts"** in the top navigation bar.
- Click **"Enable PC Desktop Notifications"** and grant browser notification permission.
- The service worker handles alerts in the background with `requireInteraction: true`, displaying them in the Windows Action Center / macOS Notification Center even when the browser tab is closed.
