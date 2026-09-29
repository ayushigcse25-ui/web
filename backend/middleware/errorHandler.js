/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);

  // Mongoose validation error handling
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Database validation error occurred.',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'A duplicate entry with this information already exists.'
    });
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Requested resource not found.'
    });
  }

  // MongoDB / Mongoose connection or network errors
  if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoTimeoutError'
  ) {
    console.error('MongoDB connection failed:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please try again later.'
    });
  }

  // Generic internal server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Database service is currently unavailable. Please try again later.'
  });
};

module.exports = errorHandler;
