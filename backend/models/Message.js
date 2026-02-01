const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'offer', 'system', 'order'],
    default: 'text'
  },
  offerDetails: {
    price: Number,
    quantity: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  orderDetails: {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase'
    },
    status: {
      type: String, // pending, dispatched
      default: 'pending'
    },
    quantity: Number,
    price: Number
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
