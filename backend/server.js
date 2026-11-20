require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initScheduler } = require('./services/scheduler');

// Connect to MongoDB
connectDB().then(() => {
  // Start reminder scheduler once DB is connected
  initScheduler();
});

const app = express();

// Flexible CORS to allow localhost and local Wi-Fi IP access from mobile devices
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    // Allow any localhost or local IP port 5173 or 5000
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow during local development
  },
  credentials: true
}));

app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'atomic-habits-api',
    mongodb: 'connected',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Atomic Habits Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
