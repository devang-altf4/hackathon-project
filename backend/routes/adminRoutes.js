const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/adminController');
const { authenticate, checkAdmin } = require('../middleware/authMiddleware');
const listingController = require('../controllers/listingController');

// Admin login
router.post('/login', loginAdmin);

// Protected admin routes
router.get('/listings/pending', authenticate, checkAdmin, listingController.getPendingListings);
router.get('/listings/all', authenticate, checkAdmin, listingController.getAllListings);
router.put('/listings/:id/approve', authenticate, checkAdmin, listingController.approveListing);
router.put('/listings/:id/reject', authenticate, checkAdmin, listingController.rejectListing);

module.exports = router;
