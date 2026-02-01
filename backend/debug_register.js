const BASE_URL = 'http://127.0.0.1:5000/api';

async function test() {
    try {
        const uniqueEmail = `debug_${Date.now()}@test.com`;
        console.log(`Registering: ${uniqueEmail}`);
        
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Debug User', email: uniqueEmail, password: 'password123', role: 'seller' })
        });

        const data = await res.text(); // Get text first to avoid JSON parse errors
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${data}`);

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
