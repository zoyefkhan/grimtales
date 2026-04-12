/* ============================================
   models/User.js
============================================ */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['reader', 'author', 'admin'], default: 'reader' },
  avatar: { type: String, default: '' },
  bio: { type: String, maxlength: 500, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  library: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Novel' }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerifyToken: String,
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toPublicJSON = function() {
  return { id: this._id, username: this.username, avatar: this.avatar, bio: this.bio, role: this.role, isVerified: this.isVerified, followers: this.followers.length, following: this.following.length, createdAt: this.createdAt };
};

module.exports = mongoose.model('User', UserSchema);

/* ============================================
   models/Novel.js
============================================ */
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

NovelSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

const Novel = mongoose.model('Novel', NovelSchema);

/* ============================================
   models/Chapter.js
============================================ */
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
ChapterSchema.index({ novel: 1, isPublished: 1 });

ChapterSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.wordCount = this.content.trim().split(/\s+/).length;
  }
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const Chapter = mongoose.model('Chapter', ChapterSchema);

/* ============================================
   models/Comment.js
============================================ */
const CommentSchema = new mongoose.Schema({
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  isDeleted: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
}, { timestamps: true });

CommentSchema.index({ chapter: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', CommentSchema);

/* ============================================
   models/Bookmark.js
============================================ */
const BookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  scrollPosition: { type: Number, default: 0 },
  progressPercent: { type: Number, default: 0 },
}, { timestamps: true });

BookmarkSchema.index({ user: 1, novel: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', BookmarkSchema);

/* ============================================
   models/Rating.js
============================================ */
const RatingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });

RatingSchema.index({ user: 1, novel: 1 }, { unique: true });

const Rating = mongoose.model('Rating', RatingSchema);

module.exports = { Novel, Chapter, Comment, Bookmark, Rating };
