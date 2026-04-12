/* ============================================
   controllers/searchController.js
============================================ */
const Novel = require('../models/Novel');
const User = require('../models/User');

exports.search = async (req, res, next) => {
  try {
    const { q, genre, status, minRating, page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const filter = { isVisible: true, $text: { $search: q.trim() } };
    if (genre) filter.genres = genre;
    if (status) filter.status = status;
    if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };

    const total = await Novel.countDocuments(filter);
    const novels = await Novel.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, avgRating: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('author', 'username avatar isVerified');

    res.json({
      success: true,
      query: q,
      count: novels.length,
      total,
      page: +page,
      pages: Math.ceil(total / limit),
      data: novels,
    });
  } catch (err) { next(err); }
};

exports.autocomplete = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const [novels, authors] = await Promise.all([
      Novel.find({ title: { $regex: q, $options: 'i' }, isVisible: true })
        .limit(5)
        .select('title slug cover genres'),
      User.find({ username: { $regex: q, $options: 'i' }, role: { $in: ['author', 'admin'] } })
        .limit(3)
        .select('username avatar isVerified'),
    ]);

    res.json({
      success: true,
      data: {
        novels,
        authors,
      },
    });
  } catch (err) { next(err); }
};
