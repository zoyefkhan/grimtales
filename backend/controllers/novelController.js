/* ============================================
   controllers/novelController.js
============================================ */
const Novel = require('../models/Novel');
const { uploadNovelCover } = require('../utils/cloudinary');

function mapAuthor(a) {
  if (!a) return a;
  const obj = a.toObject ? a.toObject() : a;
  return Object.assign({}, obj, {
    avatar_url: obj.avatar || obj.avatar_url || '',
    username: obj.username,
    id: obj._id || obj.id,
  });
}

function mapNovel(n) {
  if (!n) return n;
  const obj = n.toObject ? n.toObject() : n;
  return Object.assign({}, obj, {
    id: obj._1 || obj._id || obj.id,
    cover_url: obj.cover || obj.cover_url || '',
    total_views: obj.totalViews || obj.total_views || 0,
    total_chapters: obj.totalChapters || obj.total_chapters || 0,
    total_words: obj.totalWords || obj.total_words || 0,
    avg_rating: obj.avgRating || obj.avg_rating || 0,
    total_ratings: obj.totalRatings || obj.total_ratings || 0,
    last_chapter_at: obj.lastChapterAt || obj.last_chapter_at || obj.last_chapter_at,
    created_at: obj.createdAt || obj.created_at,
    updated_at: obj.updatedAt || obj.updated_at,
    is_visible: obj.isVisible || obj.is_visible,
    is_featured: obj.isFeatured || obj.is_featured,
    author: mapAuthor(obj.author),
  });
}

exports.getNovels = async (req, res, next) => {
  try {
    const { genre, status, sort = 'trending', page = 1, limit = 20, tag } = req.query;
    const filter = { isVisible: true };
    if (genre) filter.genres = genre;
    if (status) filter.status = status;
    if (tag) filter.tags = tag;

    const sortMap = {
      trending: { totalViews: -1 },
      new: { createdAt: -1 },
      rating: { avgRating: -1 },
      updated: { lastChapterAt: -1 },
    };

    const total = await Novel.countDocuments(filter);
    const novels = await Novel.find(filter)
      .sort(sortMap[sort] || { totalViews: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('author', 'username avatar isVerified');

    res.json({ success: true, count: novels.length, total, page: +page, pages: Math.ceil(total / limit), data: novels.map(mapNovel) });
  } catch (err) { next(err); }
};

exports.getNovel = async (req, res, next) => {
  try {
    const isId = /^[a-f\d]{24}$/i.test(req.params.id);
    const novel = await Novel.findOne(
      isId ? { _id: req.params.id } : { slug: req.params.id }
    ).populate('author', 'username avatar bio isVerified');
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    await Novel.findByIdAndUpdate(novel._id, { $inc: { totalViews: 1 } });
    res.json({ success: true, data: mapNovel(novel) });
  } catch (err) { next(err); }
};

exports.createNovel = async (req, res, next) => {
  try {
    let cover = '';
    if (req.file) cover = await uploadNovelCover(req.file.buffer, 'new');
    const novel = await Novel.create({ ...req.body, author: req.user.id, cover });
    res.status(201).json({ success: true, data: mapNovel(novel) });
  } catch (err) { next(err); }
};

exports.updateNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id);
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    if (novel.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (req.file) req.body.cover = await uploadNovelCover(req.file.buffer, req.params.id);
    const updated = await Novel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: mapNovel(updated) });
  } catch (err) { next(err); }
};

exports.deleteNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id);
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    if (novel.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await novel.deleteOne();
    res.json({ success: true, message: 'Novel deleted' });
  } catch (err) { next(err); }
};

exports.getMyNovels = async (req, res, next) => {
  try {
    const novels = await Novel.find({ author: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: novels.length, data: novels.map(mapNovel) });
  } catch (err) { next(err); }
};

exports.featureNovel = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const novel = await Novel.findByIdAndUpdate(req.params.id, { isFeatured: req.body.featured }, { new: true });
    res.json({ success: true, data: mapNovel(novel) });
  } catch (err) { next(err); }
};
