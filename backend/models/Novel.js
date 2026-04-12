/* ============================================
   models/Novel.js
============================================ */
const mongoose = require('mongoose');

const NovelSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, unique: true, lowercase: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  synopsis: { type: String, required: true, maxlength: 5000 },
  cover: { type: String, default: '' },
  genres: [{ type: String }],
  tags: [{ type: String }],
  status: { type: String, enum: ['ongoing', 'completed', 'hiatus', 'draft'], default: 'draft' },
  contentRating: { type: String, enum: ['all', 'teen', 'mature', 'adult'], default: 'teen' },
  language: { type: String, default: 'English' },
  totalViews: { type: Number, default: 0 },
  totalChapters: { type: Number, default: 0 },
  totalWords: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isFeatured: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
  lastChapterAt: { type: Date },
}, { timestamps: true });

NovelSchema.index({ title: 'text', synopsis: 'text', tags: 'text' });
NovelSchema.index({ genres: 1, status: 1, avgRating: -1 });
NovelSchema.index({ author: 1, updatedAt: -1 });

NovelSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Novel', NovelSchema);
