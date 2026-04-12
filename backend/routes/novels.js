/* ============================================
   routes/novels.js
============================================ */
const express = require('express');
const router = express.Router();
const {
  getNovels, getNovel, createNovel,
  updateNovel, deleteNovel, getMyNovels, featureNovel,
} = require('../controllers/novelController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadCover } = require('../middleware/upload');

router.get('/', optionalAuth, getNovels);
router.get('/mine', protect, getMyNovels);
router.get('/:id', optionalAuth, getNovel);
router.post('/', protect, uploadCover, createNovel);
router.put('/:id', protect, uploadCover, updateNovel);
router.delete('/:id', protect, deleteNovel);
router.put('/:id/feature', protect, featureNovel);

module.exports = router;
