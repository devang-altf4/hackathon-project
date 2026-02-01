const Provenance = require('../models/Provenance');
const Listing = require('../models/Listing');
const { calculateHash } = require('../security/hashUtil');

// Helper to create a new record
exports.createProvenanceRecord = async (listingId, action, actorId, actorRole, metaData = {}) => {
  try {
    // 1. Get the last record to link the chain
    const lastRecord = await Provenance.findOne({ listingId }).sort({ timestamp: -1 });
    const previousHash = lastRecord ? lastRecord.hash : 'GENESIS_BLOCK';

    const timestamp = new Date();

    // 2. Calculate Hash
    const hash = calculateHash(
        listingId.toString(), 
        action, 
        actorId.toString(), 
        timestamp.toISOString(), 
        previousHash, 
        metaData
    );

    // 3. Create Record
    const record = await Provenance.create({
      listingId,
      action,
      actor: actorId,
      actorRole,
      details: getDescriptionForAction(action, actorRole),
      previousHash,
      hash,
      timestamp,
      metaData
    });

    console.log(`🔗 Provenance Chain Updated: [${action}] ${hash.substring(0, 10)}... (Prev: ${previousHash.substring(0, 10)})`);
    return record;
  } catch (error) {
    console.error('Error creating provenance record:', error);
    // Silent fail - do not block main flow, but log critical error
  }
};

// Public: Get History
exports.getProvenanceHistory = async (req, res) => {
  try {
    const { listingId } = req.params;
    const chain = await Provenance.find({ listingId })
        .populate('actor', 'name role')
        .sort({ timestamp: 1 }); // Oldest to newest (Chain order)

    // Verify Chain Integrity on Read
    let isVerified = true;
    for (let i = 0; i < chain.length; i++) {
        const current = chain[i];
        if (i === 0) {
            if (current.previousHash !== 'GENESIS_BLOCK') isVerified = false;
        } else {
            const previous = chain[i-1];
            if (current.previousHash !== previous.hash) isVerified = false;
        }
    }

    res.json({ listingId, isVerified, chain });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

function getDescriptionForAction(action, role) {
    switch (action) {
        case 'CREATED': return 'Waste listing initialized on blockchain.';
        case 'SUBMITTED_FOR_REVIEW': return 'Listing submitted for quality check.';
        case 'APPROVED': return 'Listing verified and approved by Admin.';
        case 'REJECTED': return 'Listing rejected by Admin.';
        case 'SOLD': return 'Deal concluded. Ownership transfer initiated.';
        case 'COLLECTED': return 'Material collected from generation site.';
        case 'IN_TRANSIT': return 'Material is on the way to recycling facility.';
        case 'DELIVERED': return 'Material delivered to Buyer.';
        case 'RECYCLED': return 'Material processed into raw recyclables.';
        case 'REMANUFACTURED': return 'Material remanufactured into new products.';
        default: return 'Status updated.';
    }
}
