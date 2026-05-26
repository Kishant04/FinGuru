const mongoose = require('mongoose');

// RISKPROFILE collection - one risk profile per user (one-to-one).
// Stores the result of the risk profiling quiz on the dashboard.
const riskProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      enum: ['Conservative', 'Moderate', 'Aggressive'], // only these 3 values allowed
      default: 'Moderate',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RiskProfile', riskProfileSchema);
