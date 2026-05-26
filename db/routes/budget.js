const express = require('express');
const Budget = require('../models/Budget');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/budget  - get the logged-in user's budget
router.get('/', async (req, res) => {
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
});

// PUT /api/budget  - analyze and save the user's budget
router.put('/', async (req, res) => {
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
});

module.exports = router;
