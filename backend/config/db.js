const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // If already connected, reuse existing database connection (essential for Vercel Serverless)
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables. Please add MONGODB_URI in Vercel Project Settings.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'atomic_habits',
      serverSelectionTimeoutMS: 5000, // 5s timeout prevents Vercel 10s lambda hard crash
      connectTimeoutMS: 5000
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
