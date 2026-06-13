const express = require('express');
const RoiCalculation = require('../models/RoiCalculation');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Controller functions (exported for unit testing)
async function getROI(req, res) {
  try {
    const calculations = await RoiCalculation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(calculations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function createROI(req, res) {
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
}

// Routes
router.get('/', getROI);
router.post('/', createROI);

module.exports = router;
module.exports.getROI = getROI;
module.exports.createROI = createROI;
