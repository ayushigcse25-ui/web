const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for inquiry submission endpoint (POST /api/inquiries)
 * Limits an IP to 10 submissions per 15 minutes to prevent spam attacks
 */
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 inquiry requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many inquiries submitted from this IP address. Please wait a few minutes before trying again.'
  }
});

/**
 * General API rate limiter for all /api endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests received from this IP address. Please slow down.'
  }
});

module.exports = {
  inquiryLimiter,
  apiLimiter
};
