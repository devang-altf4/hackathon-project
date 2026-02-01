const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middleware/authMiddleware');

// Public or Protected? Let's make it protected for Buyers/Sellers
router.post('/', authenticate, matchController.findMatches);

module.exports = router;
