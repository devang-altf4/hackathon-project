const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Listing = require('./models/Listing');
const Purchase = require('./models/Purchase');
const Transaction = require('./models/Transaction');
const Provenance = require('./models/Provenance');

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        console.log('\n=== PROVENANCE LEDGER DATA SUMMARY ===\n');
        
        // Count users by role
        const sellers = await User.find({ role: 'seller' }).select('name email');
        const buyers = await User.find({ role: 'buyer' }).select('name email');
        const workers = await User.find({ role: 'waste_worker' }).select('name email');
        
        console.log('SELLERS (' + sellers.length + '):');
        sellers.forEach(s => console.log('  - ' + s.name + ' (' + s.email + ')'));
        
        console.log('\nBUYERS (' + buyers.length + '):');
        buyers.forEach(b => console.log('  - ' + b.name + ' (' + b.email + ')'));
        
        console.log('\nWASTE WORKERS (' + workers.length + '):');
        workers.forEach(w => console.log('  - ' + w.name + ' (' + w.email + ')'));
        
        // Listings summary
        const listingStats = await Listing.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('\nLISTINGS BY STATUS:');
        listingStats.forEach(s => console.log('  - ' + s._id + ': ' + s.count));
        
        // Purchases summary
        const purchaseStats = await Purchase.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('\nPURCHASES BY STATUS:');
        purchaseStats.forEach(p => console.log('  - ' + p._id + ': ' + p.count));
        
        // Provenance summary
        const provenanceStats = await Provenance.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } }
        ]);
        console.log('\nPROVENANCE BLOCKS BY ACTION:');
        provenanceStats.forEach(p => console.log('  - ' + p._id + ': ' + p.count));
        
        // Transaction summary
        const txCount = await Transaction.countDocuments();
        console.log('\nTOTAL TRANSACTIONS: ' + txCount);
        
        // Sample provenance chain
        console.log('\n=== SAMPLE PROVENANCE CHAIN ===');
        const sampleListing = await Listing.findOne({ status: 'sold' }).populate('seller');
        if (sampleListing) {
            console.log('Listing: ' + sampleListing.title);
            console.log('Seller: ' + sampleListing.seller.name);
            const chain = await Provenance.find({ listingId: sampleListing._id }).sort({ timestamp: 1 }).populate('actor');
            console.log('Chain Length: ' + chain.length + ' blocks');
            chain.forEach((block, i) => {
                console.log('  Block ' + (i+1) + ': ' + block.action + ' by ' + block.actorRole);
                console.log('    Hash: ' + block.hash.substring(0, 20) + '...');
            });
        }
        
        console.log('\n✅ Verification Complete!\n');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

verify();
