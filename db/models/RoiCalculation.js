const mongoose = require('mongoose');

// ROICALCULATION collection - saves a history of ROI and compound interest
// calculations a user has run. A user can have many (one-to-many).
const roiCalculationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['roi', 'compound'], // which calculator was used
      required: true,
    },
    // Flexible objects - shape depends on calculator type.
    // roi:      { initial, finalValue }
    // compound: { principal, rate, years }
    inputs: {
      type: Object,
      required: true,
    },
    // roi:      { roi, profit }
    // compound: { futureValue, interestEarned }
    results: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoiCalculation', roiCalculationSchema);
