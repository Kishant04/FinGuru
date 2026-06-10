const mongoose = require('mongoose');

// Connects to MongoDB using the connection string in .env (MONGO_URI).
// Works with both local MongoDB and MongoDB Atlas - just change MONGO_URI.
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Do not exit: allow the server to run in frontend-only mode for local development.
    return false;
  }
}

module.exports = connectDB;
