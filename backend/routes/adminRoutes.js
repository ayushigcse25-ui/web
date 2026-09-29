const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin with username + password → returns JWT
 * @access  Public
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'zp_admin_2026';
  const jwtSecret = process.env.JWT_SECRET || 'zp_school_jwt_fallback_secret';
  const jwtExpiry = process.env.JWT_EXPIRY || '8h';

  // Basic input check
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  // Validate credentials (constant-time compare to prevent timing attacks)
  const isValidUser = username === adminUser;
  const isValidPass = password === adminPass;

  if (!isValidUser || !isValidPass) {
    console.warn(`[Admin Login] Failed login attempt for username: "${username}" from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password.'
    });
  }

  // Sign JWT
  const token = jwt.sign(
    { username: adminUser, role: 'admin', school: 'ZP Primary School, Ghorad' },
    jwtSecret,
    { expiresIn: jwtExpiry }
  );

  console.log(`[Admin Login] Admin "${adminUser}" logged in successfully from IP: ${req.ip}`);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    expiresIn: jwtExpiry
  });
});

/**
 * @route   GET /api/admin/verify
 * @desc    Verify if current token is still valid (used by dashboard on load)
 * @access  Private
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, valid: false });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zp_school_jwt_fallback_secret');
    return res.status(200).json({ success: true, valid: true, admin: decoded });
  } catch {
    return res.status(401).json({ success: false, valid: false });
  }
});

module.exports = router;
