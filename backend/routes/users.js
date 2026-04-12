/* ============================================
   routes/users.js
============================================ */
const express = require('express');
const router = express.Router();
const {
  getUser, updateProfile, followUser,
  unfollowUser, getUserNovels, getLibrary, updateLibrary,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/:id', getUser);
router.put('/me', protect, updateProfile);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/novels', getUserNovels);
router.get('/me/library', protect, getLibrary);
router.put('/me/library/:novelId', protect, updateLibrary);

module.exports = router;
