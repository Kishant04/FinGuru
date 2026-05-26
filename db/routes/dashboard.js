const express = require('express');
const Goal = require('../models/Goal');
const Budget = require('../models/Budget');
const RiskProfile = require('../models/RiskProfile');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/dashboard  - returns everything the dashboard page needs in one call:
// goals list, budget, risk profile, and pre-computed totals.
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    // Run all three queries together for speed.
    const [goals, budget, risk] = await Promise.all([
      Goal.find({ userId }).sort({ createdAt: -1 }),
      Budget.findOne({ userId }),
      RiskProfile.findOne({ userId }),
    ]);

    const totalSavings = goals.reduce((sum, g) => sum + Number(g.saved || 0), 0);

    res.json({
      user: { id: req.user._id, name: req.user.name, email: req.user.email },
      goals,
      budget: budget || { income: 0, expenses: 0, balance: 0, status: 'No budget data yet.' },
      risk: risk || { score: 0, level: 'Moderate' },
      totals: {
        totalGoals: goals.length,
        totalSavings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
