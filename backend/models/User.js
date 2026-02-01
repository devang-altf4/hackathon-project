const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    required: false, // Optional for now, or true if mandatory
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'waste_worker'], 
    required: true,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
