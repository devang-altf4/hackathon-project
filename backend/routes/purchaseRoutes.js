const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Listing = require('../models/Listing');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/authMiddleware');
const { createProvenanceRecord } = require('../controllers/provenanceController');

// Create a new purchase (buyer initiates purchase)
router.post('/', authenticate, async (req, res) => {
  try {
    const { listingId, quantity, notes } = req.body;
    const buyerId = req.user.id;

    // Check if user is a buyer
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can make purchases' });
    }

    // Find the listing
    const listing = await Listing.findById(listingId).populate('seller');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status !== 'approved') {
      return res.status(400).json({ message: 'This listing is not available for purchase' });
    }

    // Calculate total price
    const purchaseQuantity = quantity || listing.quantity;
    const totalPrice = (listing.price / listing.quantity) * purchaseQuantity;

    // Create purchase
    const purchase = await Purchase.create({
      listing: listingId,
      buyer: buyerId,
      seller: listing.seller._id,
      quantity: purchaseQuantity,
      totalPrice,
      notes: notes || ''
    });

    // Create provenance record for the purchase
    await createProvenanceRecord(
      listingId,
      'PURCHASED',
      buyerId,
      'buyer',
      { purchaseId: purchase._id, quantity: purchaseQuantity }
    );

    // Send order message to chat
    const conversation = await Conversation.findOne({
      listing: listingId,
      participants: { $all: [buyerId, listing.seller._id] }
    });

    if (conversation) {
      await Message.create({
        conversationId: conversation._id,
        sender: buyerId,
        content: `Order Placed! Waiting for dispatch.`,
        type: 'order',
        orderDetails: {
          purchaseId: purchase._id,
          status: 'pending',
          quantity: purchaseQuantity,
          price: totalPrice
        }
      });

      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: 'Order Placed! 📦',
        lastMessageAt: new Date()
      });
    }

    // Populate and return
    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('listing')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    res.status(201).json(populatedPurchase);
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Failed to create purchase' });
  }
});

// Get buyer's purchases
router.get('/my-purchases', authenticate, async (req, res) => {
  try {
    const buyerId = req.user.id;

    const purchases = await Purchase.find({ buyer: buyerId })
      .populate({
        path: 'listing',
        populate: { path: 'seller', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

// Get single purchase details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate({
        path: 'listing',
        populate: { path: 'seller', select: 'name email' }
      })
      .populate('buyer', 'name email');

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Ensure user is buyer or seller of this purchase
    if (purchase.buyer._id.toString() !== req.user.id && 
        purchase.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this purchase' });
    }

    res.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ message: 'Failed to fetch purchase' });
  }
});

// Update purchase status (for tracking)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Validate authorization
    const isBuyer = purchase.buyer.toString() === req.user.id;
    const isSeller = purchase.seller.toString() === req.user.id;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update status
    purchase.status = status;
    await purchase.save();

    // Create provenance record
    await createProvenanceRecord(
      purchase.listing,
      status.toUpperCase(),
      req.user.id,
      req.user.role,
      { purchaseId: purchase._id }
    );

    // Update chat if dispatched
    if (status === 'in_transit') {
      const orderMessage = await Message.findOne({ 'orderDetails.purchaseId': purchase._id });
      if (orderMessage && orderMessage.conversationId) {
        // Update the order card status
        orderMessage.orderDetails.status = 'dispatched';
        await orderMessage.save();
        
        // Send system notification
        await Message.create({
          conversationId: orderMessage.conversationId,
          sender: req.user.id,
          content: 'Order Dispatched! 🚚 Track it on the blockchain.',
          type: 'system'
        });
      }
    }

    res.json(purchase);
  } catch (error) {
    console.error('Error updating purchase status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

module.exports = router;
