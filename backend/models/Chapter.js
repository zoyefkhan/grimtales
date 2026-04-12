/* ============================================
   models/Chapter.js
============================================ */
const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  number: { type: Number, required: true },
  content: { type: String, required: true },
  wordCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  authorNote: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });

ChapterSchema.index({ novel: 1, number: 1 }, { unique: true });
ChapterSchema.index({ novel: 1, isPublished: 1, number: 1 });

// Auto-calculate word count
ChapterSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
  }
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Chapter', ChapterSchema);
