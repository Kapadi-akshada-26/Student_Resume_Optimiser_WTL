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

async function runCompleteTests() {
  console.log('=====================================================');
  console.log('  FULL SYSTEM & ANALYSIS ENGINE VERIFICATION TESTS   ');
  console.log('=====================================================\n');

  // 1. Strong Resume Data
  const strongResume = {
    title: 'Complete Software Engineer Resume',
    personal_info: {
      full_name: 'Ankit Kumar',
      email: 'ankit@college.edu',
      phone: '+91 9876543210',
      linkedin: 'https://linkedin.com/in/ankit',
      github: 'https://github.com/ankit'
    },
    summary: 'Enthusiastic B.Tech Computer Science student with strong technical skills in React, Node.js, Express, and MySQL.',
    education: [{ degree: 'B.Tech Computer Science', college: 'IIT Delhi', year: '2026', cgpa: '9.1' }],
    skills: ['C++', 'JavaScript', 'React', 'Node.js', 'Express', 'MySQL', 'Git'],
    projects: [
      { title: 'Student Resume Optimiser', tech: 'React, Express, MySQL', link: 'https://github.com/ankit/project1', description: 'Built a full stack web application that evaluates student resumes, calculates readiness score, and provides actionable recommendations.' },
      { title: 'E-Commerce Platform', tech: 'Node.js, React', link: 'https://github.com/ankit/project2', description: 'Engineered a scalable online store with shopping cart and payment gateway integration.' }
    ],
    experience: [{ org: 'TechCorp', role: 'Software Engineer Intern', duration: '3 Months', description: 'Developed React components and integrated REST APIs.' }],
    certifications: [{ name: 'AWS Certified Cloud Practitioner', org: 'AWS', year: '2025' }],
    achievements: ['1st Rank in Annual Hackathon 2025']
  };

  // 2. Weak Resume Data (Missing GitHub, summary, certifications, skills < 3, 0 projects)
  const weakResume = {
    title: 'Incomplete Draft Resume',
    personal_info: {
      full_name: 'Amit Patel',
      email: 'patel@college.edu'
      // Phone, LinkedIn, GitHub missing
    },
    summary: '', // Missing summary
    education: [{ degree: 'B.Tech', college: 'Local College', year: '2026', cgpa: '7.0' }],
    skills: ['HTML', 'CSS'], // Only 2 skills
    projects: [{ title: 'Mini Project', tech: 'HTML', link: '', description: 'Basic site' }], // 1 project
    experience: [],
    certifications: [],
    achievements: []
  };

  // Step 1: Create Strong Resume
  console.log('[Step 1] Creating Strong Resume for User 1...');
  const resStrong = await makeRequest('/api/resumes', 'POST', strongResume, 1);
  const strongId = resStrong.data.resume.resume_id;
  console.log(`Created Strong Resume ID: ${strongId}`);

  // Step 2: Create Weak Resume
  console.log('\n[Step 2] Creating Weak Resume for User 1...');
  const resWeak = await makeRequest('/api/resumes', 'POST', weakResume, 1);
  const weakId = resWeak.data.resume.resume_id;
  console.log(`Created Weak Resume ID: ${weakId}`);

  // Step 3: Run Analysis on Strong Resume
  console.log('\n[Step 3] Running Analysis Engine on Strong Resume...');
  const analysisStrong = await makeRequest(`/api/analyse/${strongId}`, 'POST', null, 1);
  console.log(`Strong Score: ${analysisStrong.data.analysis.overall_score} / 100`);
  console.log('Strengths Count:', analysisStrong.data.analysis.strengths.length);

  // Step 4: Run Analysis on Weak Resume
  console.log('\n[Step 4] Running Analysis Engine on Weak Resume...');
  const analysisWeak = await makeRequest(`/api/analyse/${weakId}`, 'POST', null, 1);
  console.log(`Weak Score: ${analysisWeak.data.analysis.overall_score} / 100`);
  console.log('Actionable Suggestions Count:', analysisWeak.data.analysis.suggestions.length);
  console.log('Sample Suggestions:', analysisWeak.data.analysis.suggestions.slice(0, 3));

  // Step 5: Check History API
  console.log('\n[Step 5] Fetching Analysis History...');
  const historyRes = await makeRequest('/api/analysis/history', 'GET', null, 1);
  console.log(`Total History Logs: ${historyRes.data.count}`);

  console.log('\n=====================================================');
  console.log('         ALL VERIFICATION TESTS COMPLETED            ');
  console.log('=====================================================');
}

setTimeout(() => {
  runCompleteTests().catch(err => console.error('Test script error:', err));
}, 1000);
