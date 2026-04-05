const jwt = require('jsonwebtoken');
const { prepare } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'finance-dashboard-secret-change-in-production';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Provide a valid Bearer token in the Authorization header'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(payload.userId);

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status === 'inactive') return res.status(403).json({ error: 'Account is inactive. Contact an administrator.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', message: 'Please log in again' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of these roles: ${roles.join(', ')}`,
        yourRole: req.user.role
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize, JWT_SECRET };
