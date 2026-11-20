# 🚀 Atomic Habits Tracker — Production Deployment Guide

This is the standard, best-practice production setup:
* **Backend:** Hosted on **Render** (as a 24/7 Node.js Web Service with internal `node-cron`).
* **Frontend:** Hosted on **Vercel** (as a high-speed global CDN Vite + React SPA).
* **24/7 Keep-Alive Cron:** Powered by **cron-job.org** to keep Render awake 24/7 and trigger reminders every minute.

---

## 1. Deploying Backend to Render (Node.js Web Service)

1. Go to your [Render Dashboard](https://dashboard.render.com/) and click **"New +" → "Web Service"**.
2. Connect your GitHub repository: `habit-tracker` (`thePranav-kpk/habit-tracker`).
3. Fill in the service configuration:
   * **Name:** `atomic-habits-api` (or your choice)
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
   * **Plan:** `Free`
   * **Health Check Path:** `/api/health`
4. Under **Environment Variables**, add these keys:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | `mongodb+srv://pranav06:Pranav2006@cluster0.lj0ud71.mongodb.net/atomic_habits?retryWrites=true&w=majority` |
   | `NTFY_TOPIC` | `atomic-habits-pranav` |
   | `VAPID_PUBLIC_KEY` | `BAHn1E9Rr4RtlCYZ7UkdU8fhMDwL7xVoJ0tmUnTd8dGs4Xo6O7G7U_KyFYmZ-cQ0Z98p6O8dz3S0GnshrQx-my4` |
   | `VAPID_PRIVATE_KEY` | `nAdFLdP2loh7R670Dk9SlGeF0wHs-z-LsYMgdIAGJ9I` |
   | `VAPID_SUBJECT` | `mailto:admin@atomic-habits.local` |
   | `FRONTEND_URL` | `https://<your-vercel-app>.vercel.app` *(or update after Step 2)* |
5. Click **"Deploy Web Service"**.
6. When deployment finishes, copy your live Render URL:  
   `https://<your-render-backend>.onrender.com`  
   *(Verify by visiting `https://<your-render-backend>.onrender.com/api/health` in your browser — it should return `"status": "ok"` and `"database": "connected"` in IST)*.

---

## 2. Deploying Frontend to Vercel (Vite + React SPA)

1. Go to your [Vercel Dashboard](https://vercel.com/) and click **"Add New..." → "Project"**.
2. Import the `thePranav-kpk/habit-tracker` repository.
3. Configure the project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click **Edit** and choose **`frontend`**
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<your-render-backend>.onrender.com/api` |
5. Click **"Deploy"**.
6. Once deployed, Vercel gives you your live URL (e.g. `https://habit-tracker-pranav.vercel.app`).
7. *(Optional but recommended)*: Go back to Render Dashboard → `atomic-habits-api` → **Environment** → set `FRONTEND_URL` to your live Vercel URL.

---

## 3. Keep Backend Awake 24/7 & Trigger On-Time Reminders

Render free tier instances sleep after 15 minutes of inactivity. A free 1-minute ping keeps your backend running 24/7 without cold starts and fires scheduled habit reminders on time:

1. Go to [cron-job.org](https://cron-job.org/) and sign in (100% free).
2. Click **"Create Cronjob"**:
   * **Title:** `Atomic Habits Keep-Alive & Reminder Check`
   * **URL:** `https://<your-render-backend>.onrender.com/api/cron/check`
   * **Schedule:** Select **Every 1 minute** (`* * * * *`)
   * **Request Method:** `GET`
3. Click **"Create"**.

#### What happens every minute:
* **Keeps Render Awake:** Render will never go to sleep.
* **On-Time Reminders in IST:** Evaluates all habits scheduled for the current minute in **Asia/Kolkata (IST)**.
* **Auto-Mutes:** If you already completed the habit today, notifications are muted.
* **Alerts:** If pending, sends mobile notification with standard chime and PC desktop notification.
* **12:00 AM IST Rollover:** Auto-resets habit completion for the fresh day.

---

## 4. Testing Your Live Deployment

1. **Open your Vercel App URL** on your phone and PC.
2. Click **"🔔 PC & Mobile Alerts"** in the top navigation bar.
3. Click **"⚡ Send Live Test Alert to PC & Phone Now"**.
4. Both your computer and phone will immediately receive the test notification!
