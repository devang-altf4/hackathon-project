const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Listing = require('../models/Listing');
const { authenticate } = require('../middleware/authMiddleware');

// Start or get existing conversation
router.post('/start', authenticate, async (req, res) => {
  try {
    const { listingId, sellerId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sellerObjId = new mongoose.Types.ObjectId(sellerId);

    if (userId.equals(sellerObjId)) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      listing: listingId,
      participants: { $all: [userId, sellerObjId] }
    }).populate('listing');

    if (!conversation) {
      conversation = await Conversation.create({
        listing: listingId,
        participants: [userId, sellerObjId],
        lastMessage: 'Conversation started',
        lastMessageAt: new Date()
      });
    }
    
    // Always populate both participants and listing for return
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email role')
      .populate('listing');

    res.json(conversation);
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email role')
      .populate('listing', 'title price images')
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message (REST fallback/initial implementation)
router.post('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type, offerDetails } = req.body;
    const senderId = req.user.id;

    const message = await Message.create({
      conversationId,
      sender: senderId,
      content,
      type: type || 'text',
      offerDetails
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: type === 'offer' ? 'Sent an offer' : content,
      lastMessageAt: new Date()
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name');

    // Here we would typically emit a socket event if we had access to io instance
    // req.app.get('io').to(conversationId).emit('newMessage', populatedMessage);

    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept offer
router.put('/:conversationId/messages/:messageId/accept', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message || message.type !== 'offer') {
      return res.status(404).json({ message: 'Offer not found' });
    }

    message.offerDetails.status = 'accepted';
    await message.save();

    // Create a system message
    const systemMsg = await Message.create({
      conversationId: message.conversationId,
      sender: userId,
      content: 'Offer Accepted! Proceeding to payment.',
      type: 'system'
    });

    res.json(message);
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
