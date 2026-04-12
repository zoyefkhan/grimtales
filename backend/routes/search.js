/* ============================================
   routes/search.js
============================================ */
const express = require('express');
const router = express.Router();
const { search, autocomplete } = require('../controllers/searchController');

router.get('/', search);
router.get('/autocomplete', autocomplete);

module.exports = router;
