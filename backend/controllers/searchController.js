/* ============================================
   controllers/searchController.js
============================================ */
const Novel = require('../models/Novel');
const User = require('../models/User');

function mapAuthor(a) {
  if (!a) return a;
  const obj = a.toObject ? a.toObject() : a;
  return Object.assign({}, obj, { avatar_url: obj.avatar || obj.avatar_url || '', id: obj._id || obj.id, username: obj.username });
}

function mapNovel(n) {
  if (!n) return n;
  const obj = n.toObject ? n.toObject() : n;
  return Object.assign({}, obj, { id: obj._id || obj.id, cover_url: obj.cover || obj.cover_url || '', avg_rating: obj.avgRating || obj.avg_rating || 0, total_views: obj.totalViews || obj.total_views || 0, total_chapters: obj.totalChapters || obj.total_chapters || 0, author: mapAuthor(obj.author) });
}

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
      data: novels.map(mapNovel),
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
        novels: novels.map(n => Object.assign({}, n.toObject ? n.toObject() : n, { cover_url: n.cover || n.cover_url || '' })),
        authors: authors.map(mapAuthor),
      },
    });
  } catch (err) { next(err); }
};
