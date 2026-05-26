const mongoose = require('mongoose');
const User = require('../models/User');

// Identifies the user for a request.
// Without JWT, the frontend sends the logged-in user's id in a header:
//   x-user-id: <mongo user id>
// The middleware looks that user up and attaches it to the request.
async function protect(req, res, next) {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized - please log in' });
  }

  // Reject malformed ids before hitting the database.
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ message: 'Not authorized - invalid user id' });
  }

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = protect;
