const http = require('http');

function makeRequest(path, method, body, userId = 1) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {})
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
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runResumeTests() {
  console.log('--- STARTING RESUME CRUD API VERIFICATION TESTS ---');

  const testResumeData = {
    title: 'Software Developer Resume',
    personal_info: {
      full_name: 'Rahul Sharma',
      email: 'rahul@college.edu',
      phone: '9876543210',
      linkedin: 'https://linkedin.com/in/rahul',
      github: 'https://github.com/rahul'
    },
    summary: 'Enthusiastic CS student skilled in Web Development.',
    education: [{ degree: 'B.Tech CSE', college: 'Delhi Tech Univ', year: '2026', cgpa: '8.8' }],
    skills: ['JavaScript', 'React', 'Node.js', 'MySQL'],
    projects: [{ title: 'Resume Optimiser', description: 'Built full stack web application', tech: 'React, Express', link: 'https://github.com' }],
    experience: [{ org: 'TechCorp', role: 'Intern', duration: '3 Mos', description: 'React dev' }],
    certifications: [{ name: 'AWS Cloud', org: 'Amazon', year: '2025' }],
    achievements: ['1st Rank in College Hackathon']
  };

  // Test 1: Create Resume (POST /api/resumes)
  console.log('\n[Test 1] Create Resume for User 1...');
  const createRes = await makeRequest('/api/resumes', 'POST', testResumeData, 1);
  console.log(`Status: ${createRes.status}, Response:`, createRes.data);
  const createdId = createRes.data.resume ? createRes.data.resume.resume_id : 1;

  // Test 2: Get User Resumes (GET /api/resumes)
  console.log('\n[Test 2] Get Resumes for User 1...');
  const getUserRes = await makeRequest('/api/resumes', 'GET', null, 1);
  console.log(`Status: ${getUserRes.status}, Count:`, getUserRes.data.count);

  // Test 3: Get Single Resume (GET /api/resumes/:id)
  console.log(`\n[Test 3] Get Single Resume ${createdId} for User 1...`);
  const getSingleRes = await makeRequest(`/api/resumes/${createdId}`, 'GET', null, 1);
  console.log(`Status: ${getSingleRes.status}, Title:`, getSingleRes.data.resume ? getSingleRes.data.resume.title : 'N/A');

  // Test 4: Update Resume (PUT /api/resumes/:id)
  console.log(`\n[Test 4] Update Resume ${createdId}...`);
  const updateRes = await makeRequest(`/api/resumes/${createdId}`, 'PUT', {
    ...testResumeData,
    title: 'Senior Software Developer Resume'
  }, 1);
  console.log(`Status: ${updateRes.status}, Response:`, updateRes.data);

  // Test 5: Verify Isolation (User 2 should NOT see User 1's resume)
  console.log('\n[Test 5] Verify Data Isolation (User 2 requesting User 1 resume)...');
  const user2Res = await makeRequest(`/api/resumes/${createdId}`, 'GET', null, 2);
  console.log(`Status: ${user2Res.status}, Response:`, user2Res.data);

  // Test 6: Delete Resume (DELETE /api/resumes/:id)
  console.log(`\n[Test 6] Delete Resume ${createdId} for User 1...`);
  const deleteRes = await makeRequest(`/api/resumes/${createdId}`, 'DELETE', null, 1);
  console.log(`Status: ${deleteRes.status}, Response:`, deleteRes.data);

  console.log('\n--- RESUME CRUD TESTS COMPLETED ---');
}

setTimeout(() => {
  runResumeTests().catch(err => console.error('Test error:', err));
}, 1000);
