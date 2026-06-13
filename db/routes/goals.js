const express = require('express');
const Goal = require('../models/Goal');
const protect = require('../middleware/auth');

const router = express.Router();

// Every route here is protected - the user must be logged in.
router.use(protect);

// Controller functions (exported for unit testing)
async function getGoals(req, res) {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function createGoal(req, res) {
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
}

async function updateGoal(req, res) {
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
}

async function deleteGoal(req, res) {
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
}

// Routes
router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
module.exports.getGoals = getGoals;
module.exports.createGoal = createGoal;
module.exports.updateGoal = updateGoal;
module.exports.deleteGoal = deleteGoal;
