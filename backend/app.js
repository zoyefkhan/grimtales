/* ============================================
   app.js — Express App Configuration
============================================ */
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const cookieParser = require('cookie-parser');

// Config (runs cloudinary setup on import)
require('./config/cloudinary');

// Middleware
const rateLimit = require('./middleware/rateLimit');

// Routes — each in its own file
const authRoutes    = require('./routes/auth');
const novelRoutes   = require('./routes/novels');
const chapterRoutes = require('./routes/chapters');
const userRoutes    = require('./routes/users');
const commentRoutes = require('./routes/comments');
const searchRoutes  = require('./routes/search');
const ratingRoutes  = require('./routes/ratings');

const app = express();

// ─── Security & Parsing ───────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ─── Rate Limiting ────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api',      rateLimit({ windowMs: 60 * 1000,      max: 200 }));

// ─── Routes ───────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/novels',   novelRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search',   searchRoutes);
app.use('/api/ratings',  ratingRoutes);

// ─── Health Check ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── 404 Handler ──────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
