const express = require('express');
const Budget = require('../models/Budget');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Controller functions (exported for unit testing)
async function getBudget(req, res) {
  try {
    let budget = await Budget.findOne({ userId: req.user._id });
    // If somehow missing, create an empty one so the frontend always gets data.
    if (!budget) {
      budget = await Budget.create({ userId: req.user._id });
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateBudget(req, res) {
  try {
    const income = Number(req.body.income);
    const expenses = Number(req.body.expenses);

    if (isNaN(income) || isNaN(expenses) || income < 0 || expenses < 0) {
      return res.status(400).json({ message: 'Please provide valid income and expenses' });
    }

    const balance = income - expenses;
    const status =
      balance < 0
        ? 'Overspending - consider lowering expenses.'
        : 'Saving well - keep it up!';

    // upsert: update the existing budget, or create it if none exists.
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id },
      { income, expenses, balance, status },
      { new: true, upsert: true }
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Routes
router.get('/', getBudget);
router.put('/', updateBudget);

module.exports = router;
module.exports.getBudget = getBudget;
module.exports.updateBudget = updateBudget;
