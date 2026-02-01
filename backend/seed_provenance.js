const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Purchase = require('./models/Purchase');
const Transaction = require('./models/Transaction');
const Provenance = require('./models/Provenance');
const { calculateHash } = require('./security/hashUtil');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/hackathon_db';

// Dummy Sellers Data
const dummySellers = [
    { name: 'Green Earth Recyclers', email: 'greenearth@wastex.com', phoneNumber: '9876543210', role: 'seller' },
    { name: 'Eco Waste Solutions Pvt Ltd', email: 'ecowaste@wastex.com', phoneNumber: '9876543211', role: 'seller' },
    { name: 'Mumbai Scrap Dealers', email: 'mumbaiscrap@wastex.com', phoneNumber: '9876543212', role: 'seller' },
    { name: 'Delhi Recycling Hub', email: 'delhirecycle@wastex.com', phoneNumber: '9876543213', role: 'seller' },
    { name: 'Bangalore E-Waste Center', email: 'blrewaste@wastex.com', phoneNumber: '9876543214', role: 'seller' },
    { name: 'Chennai Metal Works', email: 'chennaimetal@wastex.com', phoneNumber: '9876543215', role: 'seller' },
    { name: 'Pune Plastic Recyclers', email: 'puneplastic@wastex.com', phoneNumber: '9876543216', role: 'seller' },
    { name: 'Kolkata Paper Mills', email: 'kolkatapaper@wastex.com', phoneNumber: '9876543217', role: 'seller' },
];

// Dummy Buyers Data
const dummyBuyers = [
    { name: 'ReCycle Industries', email: 'recycleindustries@wastex.com', phoneNumber: '9988776655', role: 'buyer' },
    { name: 'EcoFriendly Manufacturing', email: 'ecofriendly@wastex.com', phoneNumber: '9988776656', role: 'buyer' },
    { name: 'Green Future Corp', email: 'greenfuture@wastex.com', phoneNumber: '9988776657', role: 'buyer' },
    { name: 'Sustainable Materials Co', email: 'sustainable@wastex.com', phoneNumber: '9988776658', role: 'buyer' },
    { name: 'ReNew Plastics Ltd', email: 'renewplastics@wastex.com', phoneNumber: '9988776659', role: 'buyer' },
    { name: 'Metal Reborn Industries', email: 'metalreborn@wastex.com', phoneNumber: '9988776660', role: 'buyer' },
];

// Dummy Waste Workers
const dummyWorkers = [
    { name: 'Rahul Kumar', email: 'rahul.worker@wastex.com', phoneNumber: '9123456789', role: 'waste_worker' },
    { name: 'Priya Singh', email: 'priya.worker@wastex.com', phoneNumber: '9123456790', role: 'waste_worker' },
    { name: 'Amit Sharma', email: 'amit.worker@wastex.com', phoneNumber: '9123456791', role: 'waste_worker' },
];

// Waste Products
const wasteProducts = [
    { title: 'Industrial Plastic Scrap', category: 'plastic', description: 'High-quality industrial plastic waste from manufacturing. Suitable for recycling into pellets.', basePrice: 2500 },
    { title: 'Mixed Metal Scrap', category: 'metal', description: 'Assorted metal scrap including iron, aluminum, and copper. Perfect for smelting.', basePrice: 8500 },
    { title: 'Office Paper Waste', category: 'paper', description: 'Clean office paper waste, newspaper bundles, and cardboard. Ready for paper mill processing.', basePrice: 1200 },
    { title: 'E-Waste Computer Parts', category: 'electronic', description: 'Computer motherboards, processors, and electronic components with precious metals.', basePrice: 15000 },
    { title: 'Organic Kitchen Waste', category: 'organic', description: 'Restaurant and hotel organic waste. Ideal for composting and biogas production.', basePrice: 500 },
    { title: 'Textile Manufacturing Waste', category: 'textile', description: 'Cotton and polyester fabric scraps from garment factories.', basePrice: 3500 },
    { title: 'Broken Glass Bottles', category: 'glass', description: 'Sorted glass bottles and containers. Color segregated for glass recycling.', basePrice: 800 },
    { title: 'Industrial E-Waste Batch', category: 'electronic', description: 'Industrial electronic equipment including servers, UPS systems, and networking gear.', basePrice: 25000 },
    { title: 'HDPE Plastic Drums', category: 'plastic', description: 'Used HDPE drums from chemical industry. Cleaned and ready for reprocessing.', basePrice: 4500 },
    { title: 'Copper Wire Scrap', category: 'metal', description: 'Pure copper wire scrap from electrical installations. High copper content.', basePrice: 45000 },
    { title: 'Cardboard Packaging', category: 'paper', description: 'E-commerce packaging cardboard and corrugated boxes.', basePrice: 1800 },
    { title: 'Agricultural Organic Waste', category: 'organic', description: 'Crop residue and agricultural by-products for biomass energy.', basePrice: 350 },
    { title: 'Aluminum Cans', category: 'metal', description: 'Collected and compressed aluminum beverage cans.', basePrice: 12000 },
    { title: 'PET Bottles Bale', category: 'plastic', description: 'Compressed bales of PET bottles, sorted by color.', basePrice: 3200 },
    { title: 'LCD Screen Waste', category: 'electronic', description: 'Broken LCD monitors and TV screens for precious metal recovery.', basePrice: 8000 },
];

const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Kolkata', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow'];

// Helper to create provenance block
async function createProvenanceBlock(listingId, action, actorId, actorRole, previousHash, details = '', metaData = {}) {
    const timestamp = new Date();
    
    const hash = calculateHash(
        listingId.toString(), 
        action, 
        actorId.toString(), 
        timestamp.toISOString(), 
        previousHash, 
        metaData
    );

    const provenance = await Provenance.create({
        listingId,
        action,
        actor: actorId,
        actorRole,
        details: details || `${action} - Automated provenance record`,
        previousHash,
        hash,
        timestamp,
        metaData
    });

    return hash;
}

// Helper to add delay for realistic timestamps
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const seedProvenanceLedger = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('🔗 Connected to MongoDB');

        // Clean up existing dummy data (only dummy data with @wastex.com emails)
        await User.deleteMany({ email: { $regex: '@wastex.com$' } });
        await Listing.deleteMany({});
        await Purchase.deleteMany({});
        await Transaction.deleteMany({});
        await Provenance.deleteMany({});
        console.log('🧹 Cleaned up existing dummy data');

        // Create Sellers
        const sellers = [];
        for (const sellerData of dummySellers) {
            const seller = await User.create({
                ...sellerData,
                password: 'password123',
                walletBalance: Math.floor(Math.random() * 50000) + 10000
            });
            sellers.push(seller);
            console.log(`👤 Created Seller: ${seller.name}`);
        }

        // Create Buyers
        const buyers = [];
        for (const buyerData of dummyBuyers) {
            const buyer = await User.create({
                ...buyerData,
                password: 'password123',
                walletBalance: Math.floor(Math.random() * 200000) + 50000
            });
            buyers.push(buyer);
            console.log(`🏭 Created Buyer: ${buyer.name}`);
        }

        // Create Waste Workers
        const workers = [];
        for (const workerData of dummyWorkers) {
            const worker = await User.create({
                ...workerData,
                password: 'password123',
                walletBalance: Math.floor(Math.random() * 5000) + 1000
            });
            workers.push(worker);
            console.log(`🔧 Created Worker: ${worker.name}`);
        }

        console.log('\n📦 Creating Listings with Provenance Chains...\n');

        let successfulTransactions = 0;
        const allListings = [];
        const allPurchases = [];

        // Create listings for each seller
        for (let i = 0; i < sellers.length; i++) {
            const seller = sellers[i];
            const numListings = Math.floor(Math.random() * 4) + 2; // 2-5 listings per seller

            for (let j = 0; j < numListings; j++) {
                const product = wasteProducts[Math.floor(Math.random() * wasteProducts.length)];
                const location = locations[Math.floor(Math.random() * locations.length)];
                const quantity = Math.floor(Math.random() * 500) + 100;
                const price = product.basePrice + Math.floor(Math.random() * 2000) - 500;

                // Create Listing
                const listing = await Listing.create({
                    title: `${product.title} - Batch ${i * 10 + j + 1}`,
                    description: product.description,
                    category: product.category,
                    quantity: quantity,
                    unit: 'kg',
                    price: price,
                    location: location,
                    seller: seller._id,
                    status: 'pending'
                });
                allListings.push(listing);

                // GENESIS - Listing Created
                let lastHash = await createProvenanceBlock(
                    listing._id,
                    'CREATED',
                    seller._id,
                    'seller',
                    'GENESIS_BLOCK',
                    `${seller.name} listed ${product.title} from ${location}`,
                    { location, quantity, category: product.category }
                );

                // SUBMITTED FOR REVIEW
                lastHash = await createProvenanceBlock(
                    listing._id,
                    'SUBMITTED_FOR_REVIEW',
                    seller._id,
                    'seller',
                    lastHash,
                    'Listing submitted for admin review',
                    { submittedAt: new Date().toISOString() }
                );

                // Random chance of approval (80%)
                if (Math.random() < 0.8) {
                    listing.status = 'approved';
                    await listing.save();

                    lastHash = await createProvenanceBlock(
                        listing._id,
                        'APPROVED',
                        seller._id, // Using seller as admin for simplicity
                        'admin',
                        lastHash,
                        'Listing approved after quality verification',
                        { approvedAt: new Date().toISOString(), verificationScore: Math.floor(Math.random() * 20) + 80 }
                    );

                    // Random chance of being sold (60% of approved)
                    if (Math.random() < 0.6) {
                        const buyer = buyers[Math.floor(Math.random() * buyers.length)];
                        const purchaseQuantity = Math.floor(Math.random() * quantity) + 1;
                        const totalPrice = (purchaseQuantity / quantity) * price;

                        listing.status = 'sold';
                        await listing.save();

                        // Create Purchase record
                        const purchase = await Purchase.create({
                            listing: listing._id,
                            buyer: buyer._id,
                            seller: seller._id,
                            quantity: purchaseQuantity,
                            totalPrice: totalPrice,
                            status: 'pending',
                            paymentStatus: 'pending'
                        });
                        allPurchases.push(purchase);

                        // SOLD - Purchase initiated
                        lastHash = await createProvenanceBlock(
                            listing._id,
                            'SOLD',
                            buyer._id,
                            'buyer',
                            lastHash,
                            `${buyer.name} purchased ${purchaseQuantity}kg for ₹${totalPrice.toFixed(2)}`,
                            { buyerId: buyer._id.toString(), buyerName: buyer.name, quantity: purchaseQuantity, totalPrice }
                        );

                        // Update purchase status
                        purchase.status = 'confirmed';
                        purchase.paymentStatus = 'paid';
                        await purchase.save();

                        // Create transaction records
                        await Transaction.create({
                            user: buyer._id,
                            amount: totalPrice,
                            type: 'debit',
                            description: `Payment for ${product.title}`,
                            relatedPurchase: purchase._id
                        });

                        await Transaction.create({
                            user: seller._id,
                            amount: totalPrice,
                            type: 'credit',
                            description: `Sale of ${product.title} to ${buyer.name}`,
                            relatedPurchase: purchase._id
                        });

                        // COLLECTED - Waste collected from seller
                        if (Math.random() < 0.8) {
                            purchase.status = 'collected';
                            await purchase.save();

                            lastHash = await createProvenanceBlock(
                                listing._id,
                                'COLLECTED',
                                workers[Math.floor(Math.random() * workers.length)]._id,
                                'waste_worker',
                                lastHash,
                                `Waste collected from ${location}`,
                                { collectionDate: new Date().toISOString(), location, vehicleId: `WX-${Math.floor(Math.random() * 9000) + 1000}` }
                            );

                            // IN_TRANSIT
                            if (Math.random() < 0.8) {
                                purchase.status = 'in_transit';
                                await purchase.save();

                                lastHash = await createProvenanceBlock(
                                    listing._id,
                                    'IN_TRANSIT',
                                    workers[Math.floor(Math.random() * workers.length)]._id,
                                    'waste_worker',
                                    lastHash,
                                    `Shipment in transit to ${buyer.name}`,
                                    { dispatchTime: new Date().toISOString(), estimatedDelivery: new Date(Date.now() + 86400000).toISOString() }
                                );

                                // DELIVERED
                                if (Math.random() < 0.9) {
                                    purchase.status = 'delivered';
                                    await purchase.save();

                                    lastHash = await createProvenanceBlock(
                                        listing._id,
                                        'DELIVERED',
                                        buyer._id,
                                        'buyer',
                                        lastHash,
                                        `Successfully delivered to ${buyer.name}`,
                                        { deliveryDate: new Date().toISOString(), receivedBy: buyer.name, condition: 'Good' }
                                    );

                                    // RECYCLED (50% chance after delivery)
                                    if (Math.random() < 0.5) {
                                        lastHash = await createProvenanceBlock(
                                            listing._id,
                                            'RECYCLED',
                                            buyer._id,
                                            'buyer',
                                            lastHash,
                                            `${product.category} waste processed and recycled`,
                                            { 
                                                recyclingDate: new Date().toISOString(), 
                                                outputMaterial: `Recycled ${product.category}`,
                                                recyclingEfficiency: `${Math.floor(Math.random() * 15) + 80}%`
                                            }
                                        );

                                        // REMANUFACTURED (30% chance after recycling)
                                        if (Math.random() < 0.3) {
                                            purchase.status = 'completed';
                                            await purchase.save();

                                            lastHash = await createProvenanceBlock(
                                                listing._id,
                                                'REMANUFACTURED',
                                                buyer._id,
                                                'buyer',
                                                lastHash,
                                                'New products manufactured from recycled material',
                                                { 
                                                    remanufactureDate: new Date().toISOString(),
                                                    newProducts: ['Pellets', 'Recycled Raw Material', 'Eco-Products'][Math.floor(Math.random() * 3)],
                                                    circularEconomyScore: Math.floor(Math.random() * 20) + 80
                                                }
                                            );
                                        }
                                    }

                                    successfulTransactions++;
                                }
                            }
                        }
                    }
                } else {
                    // REJECTED
                    listing.status = 'rejected';
                    listing.adminNotes = 'Listing did not meet quality standards or documentation incomplete';
                    await listing.save();

                    lastHash = await createProvenanceBlock(
                        listing._id,
                        'REJECTED',
                        seller._id,
                        'admin',
                        lastHash,
                        'Listing rejected - Quality or documentation issues',
                        { rejectedAt: new Date().toISOString(), reason: 'Quality standards not met' }
                    );
                }

                console.log(`   📋 Created: ${listing.title} (${listing.status})`);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 PROVENANCE LEDGER SEED COMPLETED!');
        console.log('='.repeat(60));
        console.log(`\n📊 SUMMARY:`);
        console.log(`   👤 Sellers Created: ${sellers.length}`);
        console.log(`   🏭 Buyers Created: ${buyers.length}`);
        console.log(`   🔧 Waste Workers Created: ${workers.length}`);
        console.log(`   📦 Total Listings: ${allListings.length}`);
        console.log(`   💰 Total Purchases: ${allPurchases.length}`);
        console.log(`   ✅ Successful Transactions (Delivered): ${successfulTransactions}`);
        
        const provenanceCount = await Provenance.countDocuments();
        console.log(`   🔗 Total Provenance Blocks: ${provenanceCount}`);

        console.log('\n📝 SAMPLE ACCOUNTS:');
        console.log('   Sellers:');
        sellers.slice(0, 3).forEach(s => console.log(`      - ${s.email} (Password: password123)`));
        console.log('   Buyers:');
        buyers.slice(0, 3).forEach(b => console.log(`      - ${b.email} (Password: password123)`));

        console.log('\n✨ All provenance chains are properly linked with blockchain hashes!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding provenance ledger:', error);
        process.exit(1);
    }
};

seedProvenanceLedger();
