const { body, validationResult } = require('express-validator');

/**
 * Normalizes Indian phone numbers:
 * Converts formats like "+91 9850326135", "919850326135", "09850326135", "98503-26135"
 * into a clean 10-digit string "9850326135".
 */
function normalizeIndianPhone(value) {
  if (!value) return '';
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

const validateInquiry = [
  // 1. Honeypot Anti-Spam Check (hidden field in form)
  (req, res, next) => {
    const honeypot = req.body._hp_school_check || req.body.website_url_hp;
    if (honeypot && honeypot.trim().length > 0) {
      console.warn(`[Security Alert] Bot detected via honeypot field. IP: ${req.ip}`);
      // Return fake success or silent 200 without saving to DB
      return res.status(200).json({
        success: true,
        message: 'Your inquiry has been submitted successfully.'
      });
    }
    next();
  },

  // 2. Sender Name Validation
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),

  // 3. Mobile Number Validation
  body('phone')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .customSanitizer(value => normalizeIndianPhone(value))
    .custom(value => {
      // Must be a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)
      const indianMobileRegex = /^[6-9]\d{9}$/;
      if (!indianMobileRegex.test(value)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number (e.g. 9850326135)');
      }
      return true;
    }),

  // 4. Category Validation
  body('category')
    .trim()
    .notEmpty().withMessage('Inquiry category is required')
    .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters')
    .escape(),

  // 5. Message Validation
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 5, max: 2000 }).withMessage('Message must be between 5 and 2000 characters')
    .escape(),

  // 6. Validation Result Handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }));

      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Unable to submit your inquiry.',
        errors: formattedErrors
      });
    }
    next();
  }
];

module.exports = {
  validateInquiry,
  normalizeIndianPhone
};
