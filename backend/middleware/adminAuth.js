const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'honeybee_secret';
    const payload = jwt.verify(token, secret);

    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.admin = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = adminAuth;
