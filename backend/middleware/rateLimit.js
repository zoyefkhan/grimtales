/* ============================================
   middleware/rateLimit.js — Rate Limiting
============================================ */

const store = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (data.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter factory
 * @param {object} options
 * @param {number} options.windowMs   - Time window in ms (default: 60000)
 * @param {number} options.max        - Max requests per window (default: 100)
 * @param {string} options.message    - Error message
 */
module.exports = ({
  windowMs = 60 * 1000,
  max = 100,
  message = 'Too many requests. Please slow down.',
} = {}) => {
  return (req, res, next) => {
    // Use IP + route as key so limits are per-route
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `${ip}:${req.baseUrl}`;
    const now = Date.now();

    if (!store.has(key)) {
      store.set(key, { count: 0, resetAt: now + windowMs });
    }

    const entry = store.get(key);

    // Reset window if expired
    if (entry.resetAt < now) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));
    res.setHeader('Retry-After', Math.ceil(windowMs / 1000));

    if (entry.count > max) {
      return res.status(429).json({ success: false, message });
    }

    next();
  };
};
