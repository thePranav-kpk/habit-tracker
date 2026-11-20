# Atomic Habits Tracker (Full-Stack MERN Application)

A modern, full-stack habit tracker web application inspired by James Clear's *Atomic Habits*. Features a GitHub/LeetCode-style 365-day contribution heatmap, real-time streak calculations, milestone celebrations, inline editing, and deep dark mode.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Vanilla CSS with custom design system, Web Audio API, Canvas Confetti
- **Backend**: Node.js, Express.js, RESTful API
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Consistency**: Optimistic state updates, atomic database operations, cross-tab synchronization

---

## 📁 Directory Structure

```text
habitTracker/
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB connection configuration
│   ├── controllers/
│   │   ├── habitController.js   # Habit CRUD and toggle handlers
│   │   └── logController.js     # Daily logs and streak statistics
│   ├── models/
│   │   ├── Habit.js             # Mongoose Habit schema
│   │   └── DailyLog.js          # Mongoose DailyLog schema
│   ├── routes/
│   │   ├── habitRoutes.js       # /api/habits endpoints
│   │   └── logRoutes.js         # /api/logs endpoints
│   ├── .env                     # Backend environment variables
│   ├── package.json
│   └── server.js                # Express app entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── habitApi.js      # API client for backend communication
│   │   ├── components/
│   │   │   ├── LeftPanel/       # HabitInput, HabitCard, HabitList
│   │   │   ├── RightPanel/      # StatsRow, HeatmapBoard, HeatmapTooltip, WisdomSection
│   │   │   └── UI/              # Confetti canvas component
│   │   ├── utils/
│   │   │   ├── dateUtils.js     # Heatmap coordinate and date formatting math
│   │   │   ├── streakUtils.js   # Streak and milestone calculation
│   │   │   └── audioUtils.js    # Synthesized pleasant completion chimes
│   │   ├── App.jsx              # Main App layout & state management
│   │   ├── App.css              # App styling
│   │   ├── index.css            # Global CSS variables & reset
│   │   └── main.jsx             # React DOM entry point
│   ├── .env                     # Frontend environment variables (VITE_API_BASE_URL)
│   ├── index.html               # Vite HTML template
│   ├── package.json
│   └── vite.config.js           # Vite dev server + /api proxy
│
├── package.json                 # Root script runner (concurrently)
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start (Localhost)

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on default port `27017` (e.g. `systemctl status mongod` or `mongod`)

### 2. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
*(Or run `npm install` inside both `backend/` and `frontend/`)*

### 3. Run the Development Server
```bash
npm run dev
```
This runs both servers concurrently:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

Open **`http://localhost:5173`** in your browser!

---

## 🛠️ API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/habits` | Fetch all habits |
| `POST` | `/api/habits` | Create a new habit (`{ name }`) |
| `PUT` | `/api/habits/:id` | Rename / update a habit (`{ name }`) |
| `DELETE` | `/api/habits/:id` | Delete a habit |
| `POST` | `/api/habits/:id/toggle` | Toggle habit complete/incomplete for today |
| `GET` | `/api/logs` | Fetch 365-day daily logs |
| `GET` | `/api/logs/stats` | Compute current streak, longest streak, and check-in totals |

---

## 🌟 Key Features

1. **Two-Panel Dark Layout**:
   - Deep dark palette (`#0d1117`, `#161b22`, `#21262d`) with vibrant violet accents (`#7c3aed`, `#a78bfa`).
   - Left panel (380px fixed on desktop) for habit checklist.
   - Right panel for GitHub-style contribution heatmap and progress telemetry.
   - Fully responsive for mobile devices (< 768px).

2. **Inline Double-Click Editing**:
   - Double-click any habit title to edit in place. Press `Enter` or click away to commit.

3. **Streak Heatmap (53 Weeks × 7 Days)**:
   - Interactive contribution grid showing all 365 days of consistency.
   - Color intensity based on daily completions (`0`: near-black, `1`: dark violet, `2`: medium violet, `3+`: bright violet).
   - Rich hover tooltip displaying exact date and bulleted habit names.

4. **Milestone Celebrations**:
   - Visual badges and glowing borders when crossing milestone thresholds:
     - 🌱 **7 Days**: First Week Consistency
     - ⚡ **21 Days**: Neural Pathways Formed
     - 🚀 **66 Days**: Habit Automaticity (Scientific standard)
     - 👑 **100 Days**: Centurion Master
   - Confetti bursts and Web Audio API harmonic sound feedback upon habit completion.
