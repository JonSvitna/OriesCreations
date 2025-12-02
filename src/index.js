require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const membershipRoutes = require('./routes/membership');
const paymentRoutes = require('./routes/payments');
const newsletterRoutes = require('./routes/newsletter');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting (needed for production and dev containers)
app.set('trust proxy', 1);

// Initialize database
initializeDatabase();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs for auth
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Parse JSON for all routes except Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Serve static files from client dist folder (when built)
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Serve static files from public folder (legacy)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// Serve SPA for all other routes (with rate limiting)
const staticLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Higher limit for static file serving
  standardHeaders: true,
  legacyHeaders: false,
});

// Catch-all middleware for SPA (must be last)
app.use(staticLimiter, (req, res) => {
  // First try client dist, then fall back to public
  const clientPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');
  const publicPath = path.join(__dirname, '..', 'public', 'index.html');
  
  res.sendFile(clientPath, (err) => {
    if (err) {
      res.sendFile(publicPath, (err) => {
        if (err) {
          res.status(404).send('Not found');
        }
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🏰 OriesCreations server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
