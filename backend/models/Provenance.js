const mongoose = require('mongoose');

const provenanceSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
        'CREATED', 
        'SUBMITTED_FOR_REVIEW', 
        'APPROVED', 
        'REJECTED', 
        'SOLD', 
        'COLLECTED', 
        'IN_TRANSIT', 
        'DELIVERED', 
        'RECYCLED', 
        'REMANUFACTURED'
    ]
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Can be Seller, Buyer, or Admin
    required: true,
  },
  actorRole: {
    type: String,
    required: true, // Snapshot of role at time of action
  },
  details: {
    type: String, // Human readable description
  },
  metaData: {
    type: Object, // Any extra data (location, image url of processed goods etc)
  },
  previousHash: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Provenance', provenanceSchema);
