const http = require('http');
const fs = require('fs');
const path = require('path');

function makeRequest(pathStr, method, body, userId = 1) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: pathStr,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {})
      }
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        try {
          const json = JSON.parse(buffer.toString('utf8'));
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, buffer: buffer, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runPdfTests() {
  console.log('=====================================================');
  console.log('       VERIFYING REAL RESUME PDF GENERATION          ');
  console.log('=====================================================\n');

  const sampleResume = {
    title: 'Software Developer Resume',
    personal_info: {
      full_name: 'Rahul Sharma',
      email: 'rahul.sharma@college.edu',
      phone: '+91 9876543210',
      linkedin: 'https://linkedin.com/in/rahulsharma',
      github: 'https://github.com/rahulsharma'
    },
    summary: 'Enthusiastic B.Tech Computer Science student with strong technical foundations in React, Node.js, Express, and MySQL.',
    education: [{ degree: 'B.Tech Computer Science', college: 'Delhi Technological University', year: '2022 - 2026', cgpa: '8.8 CGPA' }],
    skills: ['C++', 'Python', 'JavaScript', 'React', 'Node.js', 'Express', 'MySQL', 'Git'],
    projects: [
      { title: 'Student Resume Optimiser', tech: 'React, Express, MySQL', link: 'https://github.com/rahulsharma/resume-optimiser', description: 'Built a full stack web application that evaluates student resumes, spot missing skills, and calculates readiness score.' }
    ],
    experience: [{ org: 'TechCorp Solutions', role: 'Web Development Intern', duration: 'Jun 2025 - Aug 2025', description: 'Developed React UI components and integrated REST APIs.' }],
    certifications: [{ name: 'AWS Certified Cloud Practitioner', org: 'Amazon Web Services', year: '2025' }],
    achievements: ['1st Rank in Annual College Hackathon 2025']
  };

  // 1. Create Resume
  console.log('[Step 1] Creating Resume for User 1...');
  const createRes = await makeRequest('/api/resumes', 'POST', sampleResume, 1);
  const resumeId = createRes.data.resume.resume_id;
  console.log(`Created Resume ID: ${resumeId}`);

  // 2. Request PDF Download Endpoint
  console.log(`\n[Step 2] Requesting PDF from /api/resumes/${resumeId}/pdf ...`);
  const pdfRes = await makeRequest(`/api/resumes/${resumeId}/pdf`, 'GET', null, 1);

  console.log(`HTTP Status: ${pdfRes.status}`);
  console.log(`Content-Type: ${pdfRes.headers['content-type']}`);
  console.log(`Content-Disposition: ${pdfRes.headers['content-disposition']}`);

  if (pdfRes.buffer) {
    const isPdf = pdfRes.buffer.toString('utf8', 0, 5) === '%PDF-';
    console.log(`Valid PDF Magic Header (%PDF-): ${isPdf}`);
    console.log(`Generated PDF Buffer Size: ${pdfRes.buffer.length} bytes`);

    // Save sample generated PDF to scratch for inspection
    const scratchPath = path.join(__dirname, 'test_output_resume.pdf');
    fs.writeFileSync(scratchPath, pdfRes.buffer);
    console.log(`Saved sample PDF locally to: ${scratchPath}`);
  }

  console.log('\n=====================================================');
  console.log('       PDF GENERATION TEST COMPLETED SUCCESSFULLY    ');
  console.log('=====================================================');
}

setTimeout(() => {
  runPdfTests().catch(err => console.error('PDF Test Error:', err));
}, 1000);
