const mongoose = require('mongoose');

// Connects to MongoDB using the connection string in .env (MONGO_URI).
// Works with both local MongoDB and MongoDB Atlas - just change MONGO_URI.
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Stop the server if the database is unreachable - nothing will work without it.
    process.exit(1);
  }
}

module.exports = connectDB;
