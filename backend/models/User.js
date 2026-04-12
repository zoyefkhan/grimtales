/* ============================================
   models/User.js
============================================ */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String, required: [true, 'Username is required'],
    unique: true, trim: true, minlength: 3, maxlength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: 8, select: false,
  },
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

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Public JSON (strips sensitive fields)
UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    website: this.website,
    role: this.role,
    isVerified: this.isVerified,
    isEmailVerified: this.isEmailVerified,
    followerCount: this.followers.length,
    followingCount: this.following.length,
    libraryCount: this.library.length,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
