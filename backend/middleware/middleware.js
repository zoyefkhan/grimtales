/* ============================================
   middleware/auth.js — JWT Authentication
============================================ */
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated. Please sign in.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = mongoose.model('User');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
    else if (req.cookies?.token) token = req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = mongoose.model('User');
      req.user = await User.findById(decoded.id);
    }
  } catch (_) { /* Not authenticated — that's fine */ }
  next();
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
  }
  next();
};

/* ============================================
   middleware/upload.js — Cloudinary Upload
============================================ */
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

exports.uploadCover = upload.single('cover');

// Cloudinary upload helper (call this after multer)
exports.uploadToCloudinary = async (buffer, folder = 'grimtales/covers') => {
  const cloudinary = require('cloudinary').v2;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 600, height: 900, crop: 'fill' }, { quality: 'auto' }] },
      (err, result) => { if (err) reject(err); else resolve(result.secure_url); }
    );
    const { Readable } = require('stream');
    Readable.from(buffer).pipe(stream);
  });
};

/* ============================================
   middleware/rateLimit.js — Rate Limiting
============================================ */
const rateLimitStore = new Map();

module.exports = ({ windowMs = 60000, max = 100, message = 'Too many requests. Please slow down.' } = {}) => {
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitStore.has(key)) rateLimitStore.set(key, []);

    const requests = rateLimitStore.get(key).filter(time => time > windowStart);
    requests.push(now);
    rateLimitStore.set(key, requests);

    const remaining = Math.max(0, max - requests.length);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000));

    if (requests.length > max) {
      return res.status(429).json({ success: false, message });
    }
    next();
  };
};
