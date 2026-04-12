/* ============================================
   routes/chapters.js
============================================ */
const express = require('express');
const router = express.Router();
const {
  getChapters, getChapter, createChapter,
  updateChapter, deleteChapter, publishChapter,
} = require('../controllers/chapterController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/novel/:novelId', optionalAuth, getChapters);
router.get('/:id', optionalAuth, getChapter);
router.post('/', protect, createChapter);
router.put('/:id', protect, updateChapter);
router.delete('/:id', protect, deleteChapter);
router.put('/:id/publish', protect, publishChapter);

module.exports = router;
