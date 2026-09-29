const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus
} = require('../controllers/inquiryController');
const { validateInquiry } = require('../middleware/validator');
const { inquiryLimiter } = require('../middleware/rateLimiter');
const { adminAuth } = require('../middleware/auth');

// ==========================================
// Public Inquiry Submission Route
// ==========================================
/**
 * @route   POST /api/inquiries
 * @desc    Submit a new school inquiry from the website contact form
 * @access  Public (Rate-limited & validated)
 */
router.post('/', inquiryLimiter, validateInquiry, createInquiry);

// ==========================================
// Protected Administrative Routes
// ==========================================
/**
 * @route   GET /api/inquiries
 * @desc    Retrieve all inquiries (supports search & pagination)
 * @access  Private (Admin API Key required)
 */
router.get('/', adminAuth, getInquiries);

/**
 * @route   GET /api/inquiries/:id
 * @desc    Retrieve single inquiry by ID
 * @access  Private (Admin API Key required)
 */
router.get('/:id', adminAuth, getInquiryById);

/**
 * @route   PATCH /api/inquiries/:id/status
 * @desc    Update inquiry status
 * @access  Private (Admin API Key required)
 */
router.patch('/:id/status', adminAuth, updateInquiryStatus);

module.exports = router;
