/* ============================================
   models/Rating.js
============================================ */
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });

// One rating per user per novel
RatingSchema.index({ user: 1, novel: 1 }, { unique: true });
RatingSchema.index({ novel: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', RatingSchema);
