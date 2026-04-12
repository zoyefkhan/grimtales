/* ============================================
   routes/ratings.js
============================================ */
const express = require('express');
const router = express.Router();
const { rateNovel, getNovelRatings, deleteRating } = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

router.post('/:novelId', protect, rateNovel);
router.get('/:novelId', getNovelRatings);
router.delete('/:novelId', protect, deleteRating);

module.exports = router;
