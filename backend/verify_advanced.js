const BASE_URL = 'http://127.0.0.1:5000/api';

async function test() {
    try {
        console.log('--- STARTING ADVANCED VERIFICATION ---');

        // 1. Test Smart Matching
        const buyerToken = await getBuyerToken();
        if (buyerToken) {
             console.log('\n1. Testing Smart Matching (Buyer)');
             const matchRes = await fetch(`${BASE_URL}/matches`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${buyerToken}`
                },
                body: JSON.stringify({ 
                    category: 'Plastic', 
                    location: 'Mumbai', 
                    quantity: 50 
                })
             });
             const matches = await matchRes.json();
             console.log(`Found ${matches.length} matches for Plastic in Mumbai.`);
             if (matches.length > 0) {
                 console.log('Top Match:', matches[0].listing.title, '| Score:', matches[0].score);
                 console.log('Match Details:', matches[0].matchDetails);
             }
        }

        // 2. Test Provenance History (Public)
        console.log('\n2. Testing Provenance History (Public)');
        const listingsRes = await fetch(`${BASE_URL}/listings`); // Get all approved
        const listings = await listingsRes.json();
        
        if (listings.length > 0) {
            const listId = listings[0]._id;
            const provRes = await fetch(`${BASE_URL}/provenance/${listId}`);
            const provData = await provRes.json();
            console.log(`Provenance for ${listings[0].title}:`);
            console.log(`Chain Length: ${provData.chain.length}`);
            console.log(`Verified Integrity: ${provData.isVerified}`);
            provData.chain.forEach(block => {
                console.log(` -> [${block.action}] ${block.timestamp}`);
            });
        }

    } catch (e) {
        console.error('Verification Error:', e);
    }
}

async function getBuyerToken() {
    try {
        const res = await fetch(`${BASE_URL}/auth/buyer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'seed_buyer@test.com', password: 'hash' }) // Using seeded buyer
        });
        const data = await res.json();
        return data.token;
    } catch (e) { console.error('Login failed', e); }
}

test();
