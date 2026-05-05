const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');

module.exports = async function (req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    const revoked = await TokenBlacklist.findOne({ token });
    if (revoked) return res.status(401).json({ message: 'Token has been revoked' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
