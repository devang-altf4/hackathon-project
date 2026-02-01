const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Provenance = require('./models/Provenance');
const { calculateHash } = require('./security/hashUtil');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/hackathon_db';

// Helper to create provenance
async function createProv(listingId, action, actorId, actorRole, previousHash, metaData = {}) {
    const timestamp = new Date();
    // Simulate slight time delay for history
    timestamp.setMinutes(timestamp.getMinutes() + Math.floor(Math.random() * 100));

    const hash = calculateHash(
        listingId.toString(), action, actorId.toString(), timestamp.toISOString(), previousHash, metaData
    );

    await Provenance.create({
        listingId, action, actor: actorId, actorRole, details: `Auto-generated ${action}`, previousHash, hash, timestamp, metaData
    });
    return hash;
}

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to DB');

        // Clear existing
        await Listing.deleteMany({});
        await Provenance.deleteMany({});
        await User.deleteMany({ email: { $regex: 'seed_' } }); // Only delete seed users

        // Create Users
        const seller = await User.create({ 
            name: 'Seed Seller', 
            email: 'seed_seller@test.com', 
            password: 'hash', 
            role: 'seller',
            phoneNumber: '8369743238' 
        });
        const buyer = await User.create({ name: 'Seed Buyer', email: 'seed_buyer@test.com', password: 'hash', role: 'buyer' });
        const adminID = seller._id; // reusing for simplicity, or fetch admin

        const categories = ['plastic', 'metal', 'paper', 'electronic', 'organic'];
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad'];

        // 1. Create 50 Listings
        for (let i = 1; i <= 50; i++) {
            const city = cities[i % cities.length];
            const cat = categories[i % categories.length];
            
            const listing = await Listing.create({
                title: `${cat.toUpperCase()} Waste Batch #${i}`,
                description: `High quality ${cat} from ${city} industrial zone. Batch suitable for recycling.`,
                category: cat,
                quantity: (i * 50) + 100,
                unit: 'kg',
                price: (i * 20) + 500,
                location: city,
                seller: seller._id,
                status: 'pending' // Initial
            });

            // Genesis Block
            let lastHash = await createProv(listing._id, 'CREATED', seller._id, 'seller', 'GENESIS_BLOCK');

            // Varied Lifecycle
            if (i % 3 !== 0) { // 2/3rds are approved
                // Approved
                listing.status = 'approved';
                await listing.save();
                lastHash = await createProv(listing._id, 'APPROVED', adminID, 'admin', lastHash);
            }

            if (i % 5 === 0) { // 1/5th are sold
                // Sold -> Collected -> In Transit
                listing.status = 'sold'; // Custom internal status
                await listing.save();
                lastHash = await createProv(listing._id, 'SOLD', buyer._id, 'buyer', lastHash);
                lastHash = await createProv(listing._id, 'COLLECTED', seller._id, 'seller', lastHash, { location: city });
                lastHash = await createProv(listing._id, 'IN_TRANSIT', seller._id, 'seller', lastHash);
            }

            if (i % 10 === 0) { // 1/10th are completed
                // Delivered -> Recycled -> Remanufactured
                lastHash = await createProv(listing._id, 'DELIVERED', buyer._id, 'buyer', lastHash);
                lastHash = await createProv(listing._id, 'RECYCLED', buyer._id, 'buyer', lastHash, { output: 'Pellets' });
                lastHash = await createProv(listing._id, 'REMANUFACTURED', buyer._id, 'buyer', lastHash, { product: 'Eco-Products' });
            }
        }

        console.log('✅ Seeding Complete: 50 Listings with Provenance Chains');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
