import fs from 'fs';

async function testFailedTicket() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
  } catch (e) {
    console.error('Login error', e);
  }
}
testFailedTicket();
