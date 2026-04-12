/* ============================================
   config/cloudinary.js — Cloudinary Config
============================================ */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log(`☁️  Cloudinary connected: ${process.env.CLOUDINARY_CLOUD_NAME}`);

module.exports = cloudinary;
