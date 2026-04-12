/* ============================================
   routes/comments.js
============================================ */
const express = require('express');
const router = express.Router();
const {
  getComments, createComment, updateComment,
  deleteComment, likeComment,
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/chapter/:chapterId', optionalAuth, getComments);
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.put('/:id/like', protect, likeComment);

module.exports = router;
