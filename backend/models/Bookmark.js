/* ============================================
   models/Bookmark.js
============================================ */
const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  scrollPosition: { type: Number, default: 0 },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

// One bookmark per user per novel
BookmarkSchema.index({ user: 1, novel: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema);
