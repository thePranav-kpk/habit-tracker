require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initScheduler } = require('./services/scheduler');
const { router: cronRouter, getHealth, triggerCronCheck } = require('./routes/cronRoutes');

// Connect to MongoDB & start scheduler (only when run directly via "node server.js", NOT on Vercel Serverless)
if (require.main === module && !process.env.VERCEL) {
  connectDB().then(() => {
    initScheduler();
  }).catch((err) => {
    console.warn('[DB Startup Warning]:', err.message);
  });
}

const app = express();

// Flexible CORS to allow localhost, local Wi-Fi IP, Render backend and Vercel production frontend
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('vercel.app') ||
      origin.includes('onrender.com') ||
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
      (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL))
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Ensure MongoDB is connected on each incoming request (vital for Vercel Serverless)
app.use(async (req, res, next) => {
  const p = req.path || '';
  const isExempt = p === '/' || p === '/api' || p.startsWith('/health') || p.startsWith('/api/health');
  try {
    await connectDB();
    next();
  } catch (err) {
    console.warn('[DB Connection Warning]:', err.message);
    if (isExempt) {
      return next();
    }
    return res.status(500).json({
      success: false,
      error: `Database connection error: ${err.message}`,
      hint: 'Please ensure MONGODB_URI is configured in Vercel Project Settings, and 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.'
    });
  }
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root landing endpoint (handles both / and /api in case of Vercel rewrites)
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'atomic-habits-api',
    environment: process.env.VERCEL ? 'vercel-serverless' : (process.env.NODE_ENV || 'development'),
    healthEndpoint: '/health',
    cronEndpoint: '/api/cron/check',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoints (Primary: /health, with /api/health for compatibility)
app.get(['/health', '/api/health'], getHealth);
app.get(['/health/cron', '/api/health/cron'], triggerCronCheck);
app.use(['/api/cron', '/cron'], cronRouter);

// Mount Feature Routes (support with and without /api prefix)
app.use(['/api/habits', '/habits'], require('./routes/habitRoutes'));
app.use(['/api/logs', '/logs'], require('./routes/logRoutes'));
app.use(['/api/notifications', '/notifications'], require('./routes/notificationRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
let server;

// Standalone server mode (Render, Local dev, Docker) - strictly avoided on Vercel
if (require.main === module && !process.env.VERCEL) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Atomic Habits Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]:`, err.message);
  if (server && !process.env.VERCEL) {
    server.close(() => process.exit(1));
  }
});

module.exports = app;
