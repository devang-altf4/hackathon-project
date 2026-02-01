const express = require('express');
const router = express.Router();
const provenanceController = require('../controllers/provenanceController');

// Public Access to Blockchain Ledger
router.get('/:listingId', provenanceController.getProvenanceHistory);

module.exports = router;
