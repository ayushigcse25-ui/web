const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// Local DB is initialized on require if needed
const inquiryRoutes = require('./routes/inquiryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ==========================================
// 1. Security & Core Middleware
// ==========================================
app.use(helmet());

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsOrigin === '*' ? ['*'] : corsOrigin.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, file://, same-origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // In development mode, allow any local dev server port (e.g. 5500, 3000, 5173, 8080)
    if (process.env.NODE_ENV !== 'production') {
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  credentials: true
}));

// Body parsing with strict limits to prevent large payload attacks
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// ==========================================
// 2. Health & Info Route
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School inquiry server is running',
    status: 'healthy',
    institution: 'Zila Parishad Primary School, Ghorad',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 3. API Routes
// ==========================================
app.use('/api/admin', adminRoutes);      // Admin login + verify
app.use('/api/inquiries', inquiryRoutes); // Contact form inquiries
app.use('/api/notices', noticeRoutes);    // Public + admin notice board

// Optional: Serve frontend static files if running integrated dev/prod server
const publicDir = path.join(__dirname, '..');

// SECURITY: Prevent access to backend source code, env files, and local data via static server
app.use((req, res, next) => {
  if (req.path.startsWith('/backend') || req.path.includes('.env')) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

app.use(express.static(publicDir));

// ==========================================
// 4. 404 Route Handler for undefined endpoints
// ==========================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

// ==========================================
// 5. Centralized Error Handling Middleware
// ==========================================
app.use(errorHandler);

// ==========================================
// 6. Server Initialization
// ==========================================
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`======================================================`);
    console.log(`School inquiry backend running on port ${PORT} (Local DB mode)`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API URL:     http://localhost:${PORT}/api/inquiries`);
    console.log(`Health:      http://localhost:${PORT}/api/health`);
    console.log(`======================================================`);
  });
}

module.exports = app;
