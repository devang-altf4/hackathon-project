const Listing = require('../models/Listing');

exports.findMatches = async (req, res) => {
  try {
    const { category, quantity, location } = req.body;

    if (!category) {
        return res.status(400).json({ message: 'Category is required for matching' });
    }

    // 1. Fetch potential matches (Approved listings of same category)
    const candidates = await Listing.find({ 
        category: { $regex: new RegExp(category, 'i') }, // Case insensitive
        status: 'approved'
    }).populate('seller', 'name email');

    // 2. Score candidates
    const scoredMatches = candidates.map(listing => {
        let score = 0;
        const details = [];

        // Location Score (Simple string match for hackathon)
        if (location && listing.location.toLowerCase().includes(location.toLowerCase())) {
            score += 10;
            details.push('Exact Location Match (+10)');
        }

        // Quantity Score
        if (quantity && listing.quantity >= quantity) {
            score += 5;
            details.push('Sufficient Quantity (+5)');
        } else if (quantity && listing.quantity >= (quantity * 0.5)) {
             score += 2; // Partial fill possible
             details.push('Partial Quantity (+2)');
        }

        // Price Score (Lower is better, but hard to score without range. Skip for now or add dummy)
        
        return {
            listing,
            score,
            matchDetails: details
        };
    });

    // 3. Sort by Score (High to Low)
    scoredMatches.sort((a, b) => b.score - a.score);

    res.json(scoredMatches);

  } catch (error) {
    res.status(500).json({ message: 'Error finding matches', error: error.message });
  }
};
