const express = require('express');
const router = express.Router();
const { authenticate, checkRole } = require('../middleware/authMiddleware');
const listingController = require('../controllers/listingController');

// Public: Get all approved listings (for buyers browsing)
router.get('/', listingController.getApprovedListings);

// Private: Seller only - Create a listing (goes to pending)
router.post('/', authenticate, checkRole('seller'), listingController.createListing);

// Private: Seller only - Get my listings
router.get('/my-listings', authenticate, checkRole('seller'), listingController.getMyListings);

module.exports = router;
