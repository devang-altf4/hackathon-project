const Listing = require('../models/Listing');

// Create a new listing (seller) - goes to pending status for admin review
exports.createListing = async (req, res) => {
  try {
    const { title, description, category, quantity, unit, price, location, images } = req.body;
    
    const listing = await Listing.create({
      title,
      description,
      category,
      quantity,
      unit,
      price,
      location,
      images: images || [],
      seller: req.user.id,
      status: 'pending' // Always starts as pending for admin review
    });

    res.status(201).json({ 
      message: 'Listing submitted for review. You will be notified once approved.',
      listing 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating listing', error: error.message });
  }
};

// Get seller's own listings
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user.id })
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
};

// Get all approved listings (for buyers)
exports.getApprovedListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'approved' })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
};

// Admin: Get all pending listings
exports.getPendingListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'pending' })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending listings', error: error.message });
  }
};

// Admin: Get all listings
exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find()
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
};

// Admin: Approve a listing
exports.approveListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const listing = await Listing.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        adminNotes: adminNotes || '',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ 
      message: 'Listing approved successfully',
      listing 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving listing', error: error.message });
  }
};

// Admin: Reject a listing
exports.rejectListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const listing = await Listing.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        adminNotes: adminNotes || 'Listing did not meet our guidelines',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ 
      message: 'Listing rejected',
      listing 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting listing', error: error.message });
  }
};
