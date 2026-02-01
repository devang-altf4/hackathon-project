const BASE_URL = 'http://127.0.0.1:5000/api';

async function test() {
    try {
        const timestamp = Date.now();
        const sellerEmail = `seller_${timestamp}@test.com`;
        const buyerEmail = `buyer_${timestamp}@test.com`;

        console.log('--- STARTING VERIFICATION ---');

        // 1. Register Seller
        console.log(`\n1. Registering Seller: ${sellerEmail}`);
        await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Seller', email: sellerEmail, password: 'password123', role: 'seller' })
        });

        // 2. Register Buyer
        console.log(`2. Registering Buyer: ${buyerEmail}`);
        await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Buyer', email: buyerEmail, password: 'password123', role: 'buyer' })
        });

        // 3. Login Seller
        console.log('\n3. Logging in Seller...');
        const sellerLoginRes = await fetch(`${BASE_URL}/auth/seller/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: sellerEmail, password: 'password123' })
        });
        const sellerData = await sellerLoginRes.json();
        const sellerToken = sellerData.token;
        console.log('Seller Login:', sellerLoginRes.status === 200 ? 'SUCCESS' : 'FAILED');

        // 4. Login Buyer
        console.log('4. Logging in Buyer...');
        const buyerLoginRes = await fetch(`${BASE_URL}/auth/buyer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: buyerEmail, password: 'password123' })
        });
        const buyerData = await buyerLoginRes.json();
        const buyerToken = buyerData.token;
        console.log('Buyer Login:', buyerLoginRes.status === 200 ? 'SUCCESS' : 'FAILED');

        // 5. Test: Buyer tries to create listing (Should Fail)
        console.log('\n5. Test: Buyer creates listing (Expect 403 Forbidden)');
        const buyerCreateRes = await fetch(`${BASE_URL}/listings`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${buyerToken}`
            },
            body: JSON.stringify({ 
                wasteType: 'Plastic', 
                quantity: { value: 10, unit: 'kg' }, 
                price: { value: 100 }, 
                location: { address: '123 Fake St', city: 'Test City' },
                description: 'Test Waste'
            })
        });
        console.log('Buyer Create Status:', buyerCreateRes.status);
        if (buyerCreateRes.status === 403) console.log('PASS: Buyer was denied access.');
        else console.error('FAIL: Buyer was NOT denied access.');

        // 6. Test: Seller tries to create listing (Should Success)
        console.log('\n6. Test: Seller creates listing (Expect 201 Created)');
        const sellerCreateRes = await fetch(`${BASE_URL}/listings`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sellerToken}`
            },
            body: JSON.stringify({ 
                wasteType: 'Plastic', 
                wasteSource: 'Industrial',
                quantity: { value: 50, unit: 'kg' }, 
                price: { value: 500 }, 
                location: { address: '456 Warehouse Blvd', city: 'Factory City' },
                description: 'High quality plastic waste',
                logistics: { availableForPickup: true }
            })
        });
        const listingData = await sellerCreateRes.json();
        console.log('Seller Create Status:', sellerCreateRes.status);
        if (sellerCreateRes.status === 201) console.log('PASS: Listing created successfully.');
        else console.error('FAIL: Listing creation failed.', listingData);

        // 7. Test: Get All Listings
        console.log('\n7. Test: Get All Listings (Public)');
        const getRes = await fetch(`${BASE_URL}/listings`);
        const listings = await getRes.json();
        console.log(`Fetched ${listings.length} listings.`);

    } catch (e) {
        console.error('Verification Error:', e);
    }
}

test();
