/* ============================================
   models/Comment.js
============================================ */
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  isDeleted: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
}, { timestamps: true });

CommentSchema.index({ chapter: 1, createdAt: -1 });
CommentSchema.index({ novel: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
