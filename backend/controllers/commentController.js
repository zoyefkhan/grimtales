/* ============================================
   controllers/commentController.js
============================================ */
const Comment = require('../models/Comment');

exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = {
      chapter: req.params.chapterId,
      isDeleted: false,
      isHidden: false,
      parentComment: null,
    };
    const total = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('author', 'username avatar isVerified');

    // Attach like count and whether current user liked
    const userId = req.user?.id;
    const enriched = comments.map(c => {
      const obj = c.toObject();
      obj.likeCount = c.likes.length;
      obj.userLiked = userId ? c.likes.map(String).includes(userId) : false;
      return obj;
    });

    res.json({ success: true, count: enriched.length, total, data: enriched });
  } catch (err) { next(err); }
};

exports.createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({ ...req.body, author: req.user.id });
    await comment.populate('author', 'username avatar isVerified');
    res.status(201).json({ success: true, data: comment });
  } catch (err) { next(err); }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    comment.text = req.body.text;
    await comment.save();
    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    comment.isDeleted = true;
    await comment.save();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
};

exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    const alreadyLiked = comment.likes.map(String).includes(req.user.id);
    if (alreadyLiked) {
      comment.likes.pull(req.user.id);
    } else {
      comment.likes.push(req.user.id);
    }
    await comment.save();
    res.json({ success: true, liked: !alreadyLiked, likeCount: comment.likes.length });
  } catch (err) { next(err); }
};
