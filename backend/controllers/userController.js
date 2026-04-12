/* ============================================
   controllers/userController.js
============================================ */
const User = require('../models/User');
const Novel = require('../models/Novel');
const { uploadAvatar } = require('../utils/cloudinary');

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['username', 'bio', 'location', 'website'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    // Handle avatar upload
    if (req.file) {
      updates.avatar = await uploadAvatar(req.file.buffer, req.user.id);
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.followUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const alreadyFollowing = target.followers.map(String).includes(req.user.id);
    if (alreadyFollowing) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }
    await User.findByIdAndUpdate(req.params.id, { $push: { followers: req.user.id } });
    await User.findByIdAndUpdate(req.user.id, { $push: { following: req.params.id } });
    res.json({ success: true, message: 'Now following' });
  } catch (err) { next(err); }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user.id } });
    await User.findByIdAndUpdate(req.user.id, { $pull: { following: req.params.id } });
    res.json({ success: true, message: 'Unfollowed' });
  } catch (err) { next(err); }
};

exports.getUserNovels = async (req, res, next) => {
  try {
    const novels = await Novel.find({ author: req.params.id, isVisible: true })
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: novels.length, data: novels });
  } catch (err) { next(err); }
};

exports.getLibrary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'library',
      select: 'title slug cover genres avgRating totalChapters status author',
      populate: { path: 'author', select: 'username' },
    });
    res.json({ success: true, data: user.library });
  } catch (err) { next(err); }
};

exports.updateLibrary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const inLibrary = user.library.map(String).includes(req.params.novelId);
    if (inLibrary) {
      user.library.pull(req.params.novelId);
    } else {
      user.library.push(req.params.novelId);
    }
    await user.save();
    res.json({ success: true, inLibrary: !inLibrary, libraryCount: user.library.length });
  } catch (err) { next(err); }
};
