/* ============================================
   controllers/authController.js
============================================ */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/models').User || require('mongoose').model('User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.cookie('token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, data: user });
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await User.create({ username, email, password, role: role === 'author' ? 'author' : 'reader' });
    sendToken(user, 201, res);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Username or email already exists' });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { username: identifier }] }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.json({ success: true, message: 'Logged out' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    // In production: send email with token
    res.json({ success: true, message: 'Password reset email sent.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerifyToken: hashed });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified.' });
  } catch (err) { next(err); }
};

/* ============================================
   controllers/novelController.js
============================================ */
const { Novel } = require('../models/models');

exports.getNovels = async (req, res, next) => {
  try {
    const { genre, status, sort = 'totalViews', page = 1, limit = 20, tag } = req.query;
    const filter = { isVisible: true };
    if (genre) filter.genres = genre;
    if (status) filter.status = status;
    if (tag) filter.tags = tag;

    const sortMap = { trending: { totalViews: -1 }, new: { createdAt: -1 }, rating: { avgRating: -1 }, updated: { lastChapterAt: -1 } };
    const sortObj = sortMap[sort] || { totalViews: -1 };

    const total = await Novel.countDocuments(filter);
    const novels = await Novel.find(filter).sort(sortObj).skip((page - 1) * limit).limit(+limit).populate('author', 'username avatar isVerified');

    res.json({ success: true, count: novels.length, total, page: +page, pages: Math.ceil(total / limit), data: novels });
  } catch (err) { next(err); }
};

exports.getNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findOne({ $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { slug: req.params.id }] }).populate('author', 'username avatar bio isVerified');
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    await Novel.findByIdAndUpdate(novel._id, { $inc: { totalViews: 1 } });
    res.json({ success: true, data: novel });
  } catch (err) { next(err); }
};

exports.createNovel = async (req, res, next) => {
  try {
    const novel = await Novel.create({ ...req.body, author: req.user.id });
    res.status(201).json({ success: true, data: novel });
  } catch (err) { next(err); }
};

exports.updateNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id);
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    if (novel.author.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    const updated = await Novel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id);
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    if (novel.author.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    await novel.remove();
    res.json({ success: true, message: 'Novel deleted' });
  } catch (err) { next(err); }
};

exports.getMyNovels = async (req, res, next) => {
  try {
    const novels = await Novel.find({ author: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: novels.length, data: novels });
  } catch (err) { next(err); }
};

exports.featureNovel = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const novel = await Novel.findByIdAndUpdate(req.params.id, { isFeatured: req.body.featured }, { new: true });
    res.json({ success: true, data: novel });
  } catch (err) { next(err); }
};

/* ============================================
   controllers/chapterController.js
============================================ */
const { Chapter } = require('../models/models');

exports.getChapters = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, order = 'asc' } = req.query;
    const filter = { novel: req.params.novelId, isPublished: true };
    const total = await Chapter.countDocuments(filter);
    const chapters = await Chapter.find(filter).sort({ number: order === 'asc' ? 1 : -1 }).skip((page - 1) * limit).limit(+limit).select('-content');
    res.json({ success: true, count: chapters.length, total, data: chapters });
  } catch (err) { next(err); }
};

exports.getChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('novel', 'title author').populate('author', 'username');
    if (!chapter || (!chapter.isPublished && req.user?.id !== chapter.author.toString())) return res.status(404).json({ success: false, message: 'Chapter not found' });
    await Chapter.findByIdAndUpdate(chapter._id, { $inc: { views: 1 } });
    res.json({ success: true, data: chapter });
  } catch (err) { next(err); }
};

exports.createChapter = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.body.novel);
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    if (novel.author.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    const lastChapter = await Chapter.findOne({ novel: req.body.novel }).sort({ number: -1 });
    const chapter = await Chapter.create({ ...req.body, author: req.user.id, number: (lastChapter?.number || 0) + 1 });
    res.status(201).json({ success: true, data: chapter });
  } catch (err) { next(err); }
};

exports.updateChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    if (chapter.author.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    const updated = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    if (chapter.author.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    await chapter.remove();
    res.json({ success: true, message: 'Chapter deleted' });
  } catch (err) { next(err); }
};

exports.publishChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    if (chapter.author.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    chapter.isPublished = true;
    await chapter.save();
    await Novel.findByIdAndUpdate(chapter.novel, { $inc: { totalChapters: 1, totalWords: chapter.wordCount }, lastChapterAt: new Date() });
    res.json({ success: true, data: chapter });
  } catch (err) { next(err); }
};

/* ============================================
   controllers/commentController.js
============================================ */
const { Comment } = require('../models/models');

exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-likes' } = req.query;
    const filter = { chapter: req.params.chapterId, isDeleted: false, isHidden: false, parentComment: null };
    const total = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter).sort(sort).skip((page - 1) * limit).limit(+limit).populate('author', 'username avatar');
    res.json({ success: true, count: comments.length, total, data: comments });
  } catch (err) { next(err); }
};

exports.createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({ ...req.body, author: req.user.id });
    await comment.populate('author', 'username avatar');
    res.status(201).json({ success: true, data: comment });
  } catch (err) { next(err); }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    comment.text = req.body.text;
    await comment.save();
    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
    comment.isDeleted = true;
    await comment.save();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
};

exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    const liked = comment.likes.includes(req.user.id);
    if (liked) comment.likes.pull(req.user.id);
    else comment.likes.push(req.user.id);
    await comment.save();
    res.json({ success: true, liked: !liked, likeCount: comment.likes.length });
  } catch (err) { next(err); }
};

/* ============================================
   controllers/searchController.js
============================================ */
exports.search = async (req, res, next) => {
  try {
    const { q, genre, status, minRating, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query required' });
    const filter = { isVisible: true, $text: { $search: q } };
    if (genre) filter.genres = genre;
    if (status) filter.status = status;
    if (minRating) filter.avgRating = { $gte: +minRating };
    const total = await Novel.countDocuments(filter);
    const results = await Novel.find(filter, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).skip((page - 1) * limit).limit(+limit).populate('author', 'username avatar');
    res.json({ success: true, count: results.length, total, data: results });
  } catch (err) { next(err); }
};

exports.autocomplete = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });
    const novels = await Novel.find({ title: { $regex: q, $options: 'i' }, isVisible: true }).limit(6).select('title slug cover');
    res.json({ success: true, data: novels });
  } catch (err) { next(err); }
};

/* ============================================
   controllers/userController.js
============================================ */
const mongoose = require('mongoose');

exports.getUser = async (req, res, next) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const User = mongoose.model('User');
    const allowed = ['username', 'bio', 'location', 'website', 'avatar'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.followUser = async (req, res, next) => {
  try {
    const User = mongoose.model('User');
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    const alreadyFollowing = target.followers.includes(req.user.id);
    if (alreadyFollowing) return res.status(400).json({ success: false, message: 'Already following' });
    await User.findByIdAndUpdate(req.params.id, { $push: { followers: req.user.id } });
    await User.findByIdAndUpdate(req.user.id, { $push: { following: req.params.id } });
    res.json({ success: true, message: 'Now following' });
  } catch (err) { next(err); }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user.id } });
    await User.findByIdAndUpdate(req.user.id, { $pull: { following: req.params.id } });
    res.json({ success: true, message: 'Unfollowed' });
  } catch (err) { next(err); }
};

exports.getUserNovels = async (req, res, next) => {
  try {
    const novels = await Novel.find({ author: req.params.id, isVisible: true }).sort({ updatedAt: -1 });
    res.json({ success: true, count: novels.length, data: novels });
  } catch (err) { next(err); }
};

exports.getLibrary = async (req, res, next) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(req.user.id).populate('library');
    res.json({ success: true, data: user.library });
  } catch (err) { next(err); }
};

exports.updateLibrary = async (req, res, next) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(req.user.id);
    const inLibrary = user.library.includes(req.params.novelId);
    if (inLibrary) user.library.pull(req.params.novelId);
    else user.library.push(req.params.novelId);
    await user.save();
    res.json({ success: true, inLibrary: !inLibrary });
  } catch (err) { next(err); }
};

/* ============================================
   controllers/ratingController.js
============================================ */
const { Rating } = require('../models/models');

exports.rateNovel = async (req, res, next) => {
  try {
    const { score, review } = req.body;
    let rating = await Rating.findOne({ user: req.user.id, novel: req.params.novelId });
    if (rating) {
      rating.score = score;
      rating.review = review || '';
      await rating.save();
    } else {
      rating = await Rating.create({ user: req.user.id, novel: req.params.novelId, score, review });
    }
    // Recalculate avg rating
    const allRatings = await Rating.find({ novel: req.params.novelId });
    const avg = allRatings.reduce((a, r) => a + r.score, 0) / allRatings.length;
    await Novel.findByIdAndUpdate(req.params.novelId, { avgRating: Math.round(avg * 10) / 10, totalRatings: allRatings.length });
    res.json({ success: true, data: rating });
  } catch (err) { next(err); }
};

exports.getNovelRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find({ novel: req.params.novelId }).populate('user', 'username avatar').sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: ratings });
  } catch (err) { next(err); }
};

exports.deleteRating = async (req, res, next) => {
  try {
    await Rating.findOneAndDelete({ user: req.user.id, novel: req.params.novelId });
    res.json({ success: true, message: 'Rating removed' });
  } catch (err) { next(err); }
};
