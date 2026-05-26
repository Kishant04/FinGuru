const express = require('express');
const Goal = require('../models/Goal');
const protect = require('../middleware/auth');

const router = express.Router();

// Every route here is protected - the user must be logged in.
router.use(protect);

// GET /api/goals  - list all goals for the logged-in user
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/goals  - add a new goal
router.post('/', async (req, res) => {
  try {
    const { name, target, saved } = req.body;
    if (!name || target == null || Number(target) <= 0) {
      return res.status(400).json({ message: 'Please provide a valid goal name and target' });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      name,
      target: Number(target),
      saved: Number(saved) || 0,
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/goals/:id  - update a goal
router.put('/:id', async (req, res) => {
  try {
    // Match on both id AND userId so users can only edit their own goals.
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { name, target, saved } = req.body;
    if (name != null) goal.name = name;
    if (target != null) goal.target = Number(target);
    if (saved != null) goal.saved = Number(saved);

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/goals/:id  - delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
