const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticate } = require('../middleware/authMiddleware');

// Get Wallet Balance & Transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const transactions = await Transaction.find({ user: req.user.id }).sort({ timestamp: -1 });
    res.json({ balance: user.walletBalance, transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
});

// P2P Transfer
router.post('/transfer', authenticate, async (req, res) => {
    try {
        const { email, amount, note } = req.body;
        const senderId = req.user.id;
        const transferAmount = Number(amount);

        if (transferAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

        const sender = await User.findById(senderId);
        if (sender.walletBalance < transferAmount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const recipient = await User.findOne({ email: email.toLowerCase() });
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        if (recipient._id.toString() === senderId) {
            return res.status(400).json({ message: 'Cannot transfer to self' });
        }

        // Perform Transfer
        sender.walletBalance -= transferAmount;
        await sender.save();

        recipient.walletBalance += transferAmount;
        await recipient.save();

        // Record Transactions
        await Transaction.create({
            user: senderId,
            amount: transferAmount,
            type: 'debit',
            description: `Transfer to ${recipient.name} (${email}): ${note || ''}`
        });

        await Transaction.create({
            user: recipient._id,
            amount: transferAmount,
            type: 'credit',
            description: `Received from ${sender.name}: ${note || ''}`
        });

        res.json({ message: 'Transfer successful', newBalance: sender.walletBalance });

    } catch (error) {
        console.error('Transfer Error:', error);
        res.status(500).json({ message: 'Transfer failed', error: error.message });
    }
});

module.exports = router;
