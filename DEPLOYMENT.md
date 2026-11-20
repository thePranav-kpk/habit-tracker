# 🚀 Atomic Habits Tracker — Production Deployment Guide

If your Render account has exceeded its 750 free hours limit, you can deploy **100% on Vercel** (both Frontend and Backend) for **completely free forever** with **no monthly hour limits**!

---

## ⚡ OPTION 1: Deploy Both Frontend & Backend on Vercel (100% Free, Zero Hour Limits)

Vercel is serverless, meaning it **does not count hours** and allows **1,000,000 free requests per month**. Even with a 1-minute cron job (43,200 requests/month), you use only **4.3%** of the free tier!

### Step 1: Deploy Backend to Vercel
1. Open [Vercel Dashboard](https://vercel.com/) and click **"Add New..." → "Project"**.
2. Select your repository: **`thePranav-kpk/habit-tracker`**.
3. In **Project Configuration**:
   * **Project Name:** `atomic-habits-api` (or your choice)
   * **Framework Preset:** Select **Other**
   * **Root Directory:** Click **Edit** and select **`backend`**
   * *(Build and Output settings are automatically managed by `backend/vercel.json`)*
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://pranav06:Pranav2006@cluster0.lj0ud71.mongodb.net/atomic_habits?retryWrites=true&w=majority` |
   | `NTFY_TOPIC` | `atomic-habits-pranav` |
   | `VAPID_PUBLIC_KEY` | `BAHn1E9Rr4RtlCYZ7UkdU8fhMDwL7xVoJ0tmUnTd8dGs4Xo6O7G7U_KyFYmZ-cQ0Z98p6O8dz3S0GnshrQx-my4` |
   | `VAPID_PRIVATE_KEY` | `nAdFLdP2loh7R670Dk9SlGeF0wHs-z-LsYMgdIAGJ9I` |
   | `VAPID_SUBJECT` | `mailto:admin@atomic-habits.local` |
5. Click **"Deploy"**.
6. When deployment finishes, copy your live backend URL:  
   `https://<your-backend-project>.vercel.app`  
   *(Verify by opening `https://<your-backend-project>.vercel.app/health` in your browser)*.

---

### Step 2: Deploy Frontend to Vercel
1. In [Vercel Dashboard](https://vercel.com/), click **"Add New..." → "Project"** again.
2. Select the same repository: **`thePranav-kpk/habit-tracker`**.
3. In **Project Configuration**:
   * **Project Name:** `atomic-habits-tracker` (or your choice)
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click **Edit** and select **`frontend`**
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<your-backend-project>.vercel.app/api` |
5. Click **"Deploy"**.
6. When finished, open your live web app URL (e.g. `https://atomic-habits-tracker.vercel.app`)!

---

### Step 3: Setup the 24/7 Habit Reminder Cron Job (Free on cron-job.org)

Because serverless functions only run when triggered, an external ping evaluates your habit reminders every minute:
1. Go to [cron-job.org](https://cron-job.org/) and sign in (100% free).
2. Click **"Create Cronjob"**:
   * **Title:** `Atomic Habits 1-Min Check`
   * **URL:** `https://<your-backend-project>.vercel.app/api/cron/check`
   * **Schedule:** Select **Every 1 minute** (`* * * * *`)
   * **Request Method:** `GET`
3. Click **"Create"**.
4. Every minute:
   * Checks pending habits for the current minute in **IST (Asia/Kolkata)**.
   * Rings your mobile phone and sends PC desktop push.
   * Mutes completed habits.
   * Auto-resets habits at **12:00 AM IST** for the new day.

---

## 🌐 OPTION 2: Free 24/7 Persistent Container Alternative (Koyeb)

If you prefer a persistent Node.js container instead of serverless, [Koyeb](https://koyeb.com) provides **1 free 24/7 Web Service (512MB RAM)** with **no monthly runtime hour limits**:
1. Sign up at [koyeb.com](https://koyeb.com) (free tier).
2. Create **New App** → Select GitHub repo `thePranav-kpk/habit-tracker`.
3. Root Directory: `backend` | Build Command: `npm install` | Run Command: `node server.js` | Port: `5000`.
4. Add the environment variables from the table above.
5. Deploy Frontend to Vercel pointing to your Koyeb URL!
