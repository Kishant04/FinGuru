const express = require('express');
const User = require('../models/User');
const Budget = require('../models/Budget');
const RiskProfile = require('../models/RiskProfile');
const protect = require('../middleware/auth');

const router = express.Router();

// Returns a clean user object for the frontend (never includes the password).
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// Controller functions (exported for unit testing)
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    // Reject duplicate emails.
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    // Password stored as plain text (matches the original project).
    const user = await User.create({ name, email, password });

    // Give every new user an empty budget and a default risk profile
    // so the one-to-one collections always exist.
    await Budget.create({ userId: user._id });
    await RiskProfile.create({ userId: user._id });

    res.status(201).json({
      message: 'Account created successfully',
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Direct plain-text comparison.
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

function getMe(req, res) {
  res.json(publicUser(req.user));
}

async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (email && email.toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase() });
      if (taken) {
        return res.status(409).json({ message: 'That email is already in use' });
      }
      user.email = email.toLowerCase();
    }
    if (name) user.name = name;

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user._id);
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
module.exports.register = register;
module.exports.login = login;
module.exports.getMe = getMe;
module.exports.updateProfile = updateProfile;
module.exports.changePassword = changePassword;
