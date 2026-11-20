# 🚀 Atomic Habits Tracker — Production Deployment & Cron Guide

This repository supports both deployment configurations out of the box:
- **Setup 1 (Requested):** Frontend on **Render** (Static Site) + Backend on **Vercel** (Serverless Express API) + Cron Job.
- **Setup 2 (Alternative):** Backend on **Render** (Node Web Service) + Frontend on **Vercel** (Vite SPA) + Cron Job.

---

## 🌟 SETUP 1: Frontend on Render & Backend on Vercel (Recommended)

### Step 1: Deploy Backend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New..." → "Project"**.
2. Import the `habit-tracker` repository (`thePranav-kpk/habit-tracker`).
3. In **Project Configuration**:
   - **Framework Preset**: `Other`
   - **Root Directory**: click **Edit** and select **`backend`**
   - Leave Build and Output settings default (handled by `backend/vercel.json`).
4. In **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://pranav06:Pranav2006@cluster0.lj0ud71.mongodb.net/atomic_habits?retryWrites=true&w=majority` |
   | `NTFY_TOPIC` | `atomic-habits-pranav` |
   | `VAPID_PUBLIC_KEY` | `BAHn1E9Rr4RtlCYZ7UkdU8fhMDwL7xVoJ0tmUnTd8dGs4Xo6O7G7U_KyFYmZ-cQ0Z98p6O8dz3S0GnshrQx-my4` |
   | `VAPID_PRIVATE_KEY` | `nAdFLdP2loh7R670Dk9SlGeF0wHs-z-LsYMgdIAGJ9I` |
   | `VAPID_SUBJECT` | `mailto:admin@atomic-habits.local` |
5. Click **"Deploy"**.
6. Once deployed, note your Vercel backend URL:  
   `https://<your-backend-project>.vercel.app`  
   *(Verify by opening `https://<your-backend-project>.vercel.app/api/health` in your browser)*.

---

### Step 2: Deploy Frontend to Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **"New +" → "Static Site"**.
2. Connect your GitHub repository: `thePranav-kpk/habit-tracker`.
3. Configure the Static Site:
   - **Name**: `atomic-habits` (or your choice)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<your-backend-project>.vercel.app/api` |
5. Under **Redirects/Rewrites**:
   - Add a rewrite: Source: `/*` → Destination: `/index.html` (Action: `Rewrite`).
6. Click **"Create Static Site"**.
7. Once finished, open your Render URL (e.g. `https://atomic-habits.onrender.com`).

---

### Step 3: Setup the 24/7 Habit Reminder Cron Job (Free)
Because Vercel serverless functions spin down when idle, an external cron runner pings the cron endpoint every minute to trigger on-time habit reminders:
1. Go to [cron-job.org](https://cron-job.org/) and sign in (100% free forever).
2. Click **"Create Cronjob"**:
   - **Title**: `Atomic Habits 1-Min Check`
   - **URL**: `https://<your-backend-project>.vercel.app/api/cron/check`
   - **Schedule**: Every **1 minute** (`* * * * *`)
   - **Request Method**: `GET`
3. Click **"Create"**.
4. That's it! Every minute, it triggers the check:
   - Evaluates all habits scheduled for the current minute in **IST (Asia/Kolkata)**.
   - If already completed today, it mutes the alert.
   - If pending, it rings your phone and sends desktop push notifications.

---

## 🔄 SETUP 2: Backend on Render & Frontend on Vercel

If you prefer the reverse:
1. **Backend on Render:**
   - In Render, create **Web Service** → Root Directory: `backend` → Build Command: `npm install` → Start Command: `node server.js`.
   - Add the environment variables from table above.
2. **Frontend on Vercel:**
   - In Vercel, import repo → Root Directory: `frontend` → Set `VITE_API_BASE_URL=https://<your-render-app>.onrender.com/api`.
3. **Cron Job:**
   - In [cron-job.org](https://cron-job.org/), set URL to `https://<your-render-app>.onrender.com/api/cron/check` every minute.

---

## ✅ Post-Deployment Verification

1. **Health Check:** Open `https://<backend-url>/api/health` — should return `"status": "ok"`, `"today": "YYYY-MM-DD"` (in IST), and `"database": "connected"`.
2. **Test Push Notification:** In your browser app, click **"🔔 PC & Mobile Alerts"** → click **"⚡ Send Live Test Alert to PC & Phone Now"**. Both phone and desktop will receive the alert!
3. **Midnight Rollover:** At 12:00:00 AM IST, yesterday's completed habits auto-reset for the fresh day.
