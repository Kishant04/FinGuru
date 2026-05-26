// Seed script - fills the database with one demo user and sample data.
// Run with:  npm run seed
// Useful for testing and for demos so you don't start from an empty database.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Goal = require('./models/Goal');
const Budget = require('./models/Budget');
const RiskProfile = require('./models/RiskProfile');
const RoiCalculation = require('./models/RoiCalculation');

async function seed() {
  await connectDB();

  // Clear existing data so the seed is repeatable.
  await Promise.all([
    User.deleteMany({}),
    Goal.deleteMany({}),
    Budget.deleteMany({}),
    RiskProfile.deleteMany({}),
    RoiCalculation.deleteMany({}),
  ]);
  console.log('Cleared old data.');

  // Demo user - password stored as plain text.
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@finguru.com',
    password: 'demo123',
  });
  console.log('Created demo user:  demo@finguru.com  /  demo123');

  await Goal.create([
    { userId: user._id, name: 'Emergency Fund', target: 10000, saved: 6500 },
    { userId: user._id, name: 'New Laptop', target: 4000, saved: 1200 },
    { userId: user._id, name: 'Holiday Trip', target: 8000, saved: 8000 },
  ]);

  await Budget.create({
    userId: user._id,
    income: 5000,
    expenses: 3200,
    balance: 1800,
    status: 'Saving well - keep it up!',
  });

  await RiskProfile.create({
    userId: user._id,
    score: 10,
    level: 'Moderate',
  });

  await RoiCalculation.create({
    userId: user._id,
    type: 'roi',
    inputs: { initial: 1000, finalValue: 1350 },
    results: { roi: 35, profit: 350 },
  });

  console.log('Seeded goals, budget, risk profile and a sample calculation.');
  await mongoose.connection.close();
  console.log('Done. Database connection closed.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
