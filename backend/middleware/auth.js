const jwt = require('jsonwebtoken');

/**
 * Admin JWT Authentication Middleware
 * Verifies a signed JWT token in Authorization: Bearer <token>
 */
const adminAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided. Please log in.'
    });
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Malformed authorization header.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zp_school_jwt_fallback_secret');
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token.',
      code: 'TOKEN_INVALID'
    });
  }
};

module.exports = { adminAuth };
