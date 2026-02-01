const express = require('express');
const router = express.Router();
const { authenticate, checkRole } = require('../middleware/authMiddleware');
const provenanceController = require('../controllers/provenanceController');
const Listing = require('../models/Listing');

// Endpoint to update status (Seller or Buyer)
// This implements the "Track material from collection to remanufacturing" requirement
router.put('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, details, location } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const listing = await Listing.findById(id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        // Validate transitions (Simplified for hackathon)
        // Seller can mark: COLLECTED, IN_TRANSIT
        // Buyer can mark: DELIVERED, RECYCLED, REMANUFACTURED, SOLD
        
        // Update Metadata
        const metaData = { location, details };

        // Create Blockchain Record
        await provenanceController.createProvenanceRecord(id, status, userId, userRole, metaData);

        // Update Listing Status if applicable
        // Map provenance actions to listing status where they match, or keep custom
        // For simplicity, we might not update the main 'status' field if it's purely internal tracking,
        // OR we map them. Let's map strict ones.
        if (['SOLD', 'REJECTED', 'APPROVED'].includes(status)) {
             listing.status = status.toLowerCase(); // Listings use lowercase
             await listing.save();
        }

        res.json({ message: `Status updated to ${status}`, listingId: id });

    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
});

module.exports = router;
