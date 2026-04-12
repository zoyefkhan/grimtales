/* ============================================
   utils/cloudinary.js — Cloudinary Upload Helper
============================================ */

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Config is set in config/cloudinary.js — call that first

// ─── Upload Buffer to Cloudinary ─────────────
async function uploadImage(buffer, options = {}) {
  const defaults = {
    folder: 'grimtales',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...defaults, ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

// ─── Upload Novel Cover ───────────────────────
async function uploadNovelCover(buffer, novelId) {
  const result = await uploadImage(buffer, {
    folder: 'grimtales/covers',
    public_id: `cover_${novelId}`,
    overwrite: true,
    transformation: [
      { width: 600, height: 900, crop: 'fill', gravity: 'auto' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
  return result.secure_url;
}

// ─── Upload User Avatar ───────────────────────
async function uploadAvatar(buffer, userId) {
  const result = await uploadImage(buffer, {
    folder: 'grimtales/avatars',
    public_id: `avatar_${userId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
  return result.secure_url;
}

// ─── Delete Image ─────────────────────────────
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

// ─── Get optimized URL ────────────────────────
function getOptimizedUrl(url, { width, height } = {}) {
  if (!url || !url.includes('cloudinary')) return url;
  const transforms = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push('q_auto', 'f_auto');
  const transformStr = transforms.join(',');
  return url.replace('/upload/', `/upload/${transformStr}/`);
}

module.exports = { uploadImage, uploadNovelCover, uploadAvatar, deleteImage, getOptimizedUrl };
