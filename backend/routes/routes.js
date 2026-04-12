/* ============================================
   routes/auth.js
============================================ */
const express = require('express');
const router = express.Router();
const { register, login, logout, forgotPassword, resetPassword, verifyEmail, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

module.exports = router;

/* ============================================
   routes/novels.js
============================================ */
const novelsRouter = express.Router();
const { getNovels, getNovel, createNovel, updateNovel, deleteNovel, getMyNovels, featureNovel } = require('../controllers/novelController');
const { protect: protectNovels, optionalAuth } = require('../middleware/auth');
const { uploadCover } = require('../middleware/upload');

novelsRouter.get('/', optionalAuth, getNovels);
novelsRouter.get('/mine', protectNovels, getMyNovels);
novelsRouter.get('/:id', optionalAuth, getNovel);
novelsRouter.post('/', protectNovels, uploadCover, createNovel);
novelsRouter.put('/:id', protectNovels, uploadCover, updateNovel);
novelsRouter.delete('/:id', protectNovels, deleteNovel);
novelsRouter.put('/:id/feature', protectNovels, featureNovel);

module.exports = novelsRouter;

/* ============================================
   routes/chapters.js
============================================ */
const chaptersRouter = express.Router();
const { getChapters, getChapter, createChapter, updateChapter, deleteChapter, publishChapter } = require('../controllers/chapterController');
const { protect: protectChapters, optionalAuth: optChapters } = require('../middleware/auth');

chaptersRouter.get('/novel/:novelId', optChapters, getChapters);
chaptersRouter.get('/:id', optChapters, getChapter);
chaptersRouter.post('/', protectChapters, createChapter);
chaptersRouter.put('/:id', protectChapters, updateChapter);
chaptersRouter.delete('/:id', protectChapters, deleteChapter);
chaptersRouter.put('/:id/publish', protectChapters, publishChapter);

module.exports = chaptersRouter;

/* ============================================
   routes/users.js
============================================ */
const usersRouter = express.Router();
const { getUser, updateProfile, followUser, unfollowUser, getUserNovels, getLibrary, updateLibrary } = require('../controllers/userController');
const { protect: protectUsers } = require('../middleware/auth');

usersRouter.get('/:id', getUser);
usersRouter.put('/me', protectUsers, updateProfile);
usersRouter.post('/:id/follow', protectUsers, followUser);
usersRouter.delete('/:id/follow', protectUsers, unfollowUser);
usersRouter.get('/:id/novels', getUserNovels);
usersRouter.get('/me/library', protectUsers, getLibrary);
usersRouter.put('/me/library/:novelId', protectUsers, updateLibrary);

module.exports = usersRouter;

/* ============================================
   routes/comments.js
============================================ */
const commentsRouter = express.Router();
const { getComments, createComment, updateComment, deleteComment, likeComment } = require('../controllers/commentController');
const { protect: protectComments, optionalAuth: optComments } = require('../middleware/auth');

commentsRouter.get('/chapter/:chapterId', optComments, getComments);
commentsRouter.post('/', protectComments, createComment);
commentsRouter.put('/:id', protectComments, updateComment);
commentsRouter.delete('/:id', protectComments, deleteComment);
commentsRouter.put('/:id/like', protectComments, likeComment);

module.exports = commentsRouter;

/* ============================================
   routes/search.js
============================================ */
const searchRouter = express.Router();
const { search, autocomplete } = require('../controllers/searchController');

searchRouter.get('/', search);
searchRouter.get('/autocomplete', autocomplete);

module.exports = searchRouter;

/* ============================================
   routes/ratings.js
============================================ */
const ratingsRouter = express.Router();
const { rateNovel, getNovelRatings, deleteRating } = require('../controllers/ratingController');
const { protect: protectRatings } = require('../middleware/auth');

ratingsRouter.post('/:novelId', protectRatings, rateNovel);
ratingsRouter.get('/:novelId', getNovelRatings);
ratingsRouter.delete('/:novelId', protectRatings, deleteRating);

module.exports = ratingsRouter;
