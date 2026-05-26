const express = require('express');
const RoiCalculation = require('../models/RoiCalculation');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/roi  - list the user's saved calculations (most recent first)
router.get('/', async (req, res) => {
  try {
    const calculations = await RoiCalculation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(calculations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/roi  - save a calculation to history
// Body: { type: 'roi'|'compound', inputs: {...}, results: {...} }
router.post('/', async (req, res) => {
  try {
    const { type, inputs, results } = req.body;

    if (!['roi', 'compound'].includes(type) || !inputs || !results) {
      return res.status(400).json({ message: 'Invalid calculation data' });
    }

    const calculation = await RoiCalculation.create({
      userId: req.user._id,
      type,
      inputs,
      results,
    });
    res.status(201).json(calculation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
