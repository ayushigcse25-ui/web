const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas database
 * @param {string|null} uriOverride - Optional URI for automated testing environments
 */
const connectDB = async (uriOverride = null) => {
  const uri = uriOverride || process.env.MONGODB_URI;

  if (!uri) {
    const errMessage = 'MONGODB_URI environment variable is not defined in backend/.env';
    console.error('MongoDB connection failed:', errMessage);
    throw new Error(errMessage);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log('MongoDB connected successfully');
    console.log(`[MongoDB] Connected to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

// ==========================================
// MongoDB Connection Lifecycle Event Listeners
// ==========================================
mongoose.connection.on('connected', () => {
  console.log('[MongoDB Event] Connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Event] Disconnected from MongoDB database');
});

module.exports = connectDB;

