const express = require('express');
const router = express.Router();
const Provenance = require('../models/Provenance');
const Listing = require('../models/Listing');

// Public route to get provenance records
router.get('/provenance', async (req, res) => {
  try {
    const records = await Provenance.find()
      .populate('listingId', 'title quantity unit') 
      .populate('actor', 'name role')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching records', error: error.message });
  }
});

module.exports = router;
