const mongoose = require('mongoose');

// GOAL collection - a user can have many goals (one-to-many).
const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // foreign key linking the goal to its owner
      required: true,
      index: true, // speeds up "find all goals for this user"
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
    },
    target: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0, 'Target cannot be negative'],
    },
    saved: {
      type: Number,
      default: 0,
      min: [0, 'Saved amount cannot be negative'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
