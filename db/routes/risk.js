const express = require('express');
const RiskProfile = require('../models/RiskProfile');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Converts the quiz score into a risk level (same logic as the original frontend).
function calculateRiskLevel(score) {
  if (score <= 7) return 'Conservative';
  if (score <= 11) return 'Moderate';
  return 'Aggressive';
}

// GET /api/risk  - get the logged-in user's risk profile
router.get('/', async (req, res) => {
  try {
    let profile = await RiskProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await RiskProfile.create({ userId: req.user._id });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/risk  - submit the risk quiz answers and save the result
router.put('/', async (req, res) => {
  try {
    // answers is an array of 5 numbers (1-3) from the quiz dropdowns.
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length !== 5 || answers.some((a) => !a)) {
      return res.status(400).json({ message: 'Please answer all 5 quiz questions' });
    }

    const score = answers.reduce((sum, a) => sum + Number(a), 0);
    const level = calculateRiskLevel(score);

    const profile = await RiskProfile.findOneAndUpdate(
      { userId: req.user._id },
      { score, level },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
