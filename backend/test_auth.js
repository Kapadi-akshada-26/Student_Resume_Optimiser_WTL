const http = require('http');

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING AUTH API VERIFICATION TESTS ---');

  // Test 1: Register a new user
  console.log('\n[Test 1] Register new user (teststudent@example.com)...');
  const res1 = await makeRequest('/api/auth/register', 'POST', {
    name: 'Test Student',
    email: 'teststudent@example.com',
    password: 'password123'
  });
  console.log(`Status: ${res1.status}, Response:`, res1.data);

  // Test 2: Try registering duplicate email
  console.log('\n[Test 2] Try registering duplicate email...');
  const res2 = await makeRequest('/api/auth/register', 'POST', {
    name: 'Test Student Duplicate',
    email: 'teststudent@example.com',
    password: 'password123'
  });
  console.log(`Status: ${res2.status}, Response:`, res2.data);

  // Test 3: Login using correct credentials
  console.log('\n[Test 3] Login using correct credentials...');
  const res3 = await makeRequest('/api/auth/login', 'POST', {
    email: 'teststudent@example.com',
    password: 'password123'
  });
  console.log(`Status: ${res3.status}, Response:`, res3.data);

  // Test 4: Login using incorrect password
  console.log('\n[Test 4] Login using incorrect password...');
  const res4 = await makeRequest('/api/auth/login', 'POST', {
    email: 'teststudent@example.com',
    password: 'wrongpassword'
  });
  console.log(`Status: ${res4.status}, Response:`, res4.data);

  console.log('\n--- TESTS COMPLETED ---');
}

// Give server time to spin up
setTimeout(() => {
  runTests().catch(err => console.error('Test script error:', err));
}, 1000);
