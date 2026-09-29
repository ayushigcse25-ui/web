const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json || data });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runLiveChecks() {
  console.log('====================================================');
  console.log('ZP Primary School Ghorad - Live Server Verification');
  console.log('====================================================\n');

  // 1. Health check
  console.log('1. Health check (GET /api/health)');
  const health = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('   Status:', health.statusCode, 'Body:', health.body);

  // 2. Invalid Phone Validation
  console.log('\n2. Invalid Phone Number Validation (POST /api/inquiries with 12345)');
  const invalidPhone = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inquiries',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Ramesh Patil',
    phone: '12345',
    category: 'Admission',
    message: 'Class 1 inquiry message'
  });
  console.log('   Status:', invalidPhone.statusCode, 'Body:', invalidPhone.body);

  // 3. Missing Name Validation
  console.log('\n3. Missing Name Validation (POST /api/inquiries with empty name)');
  const missingName = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inquiries',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: '',
    phone: '9850326135',
    category: 'Admission',
    message: 'Class 1 inquiry message'
  });
  console.log('   Status:', missingName.statusCode, 'Body:', missingName.body);

  // 3b. Valid Inquiry in Disconnected Mode
  console.log('\n3b. Valid Inquiry Database Check (POST /api/inquiries)');
  const validInquiry = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inquiries',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Suresh Patil',
    phone: '9850326135',
    category: 'Admission Inquiry',
    message: 'Please provide admission procedure for Class 1.'
  });
  console.log('   Status:', validInquiry.statusCode, 'Body:', validInquiry.body);

  // 4. Honeypot Anti-Spam Check
  console.log('\n4. Honeypot Anti-Spam Check (POST /api/inquiries with honeypot)');
  const honeypotRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inquiries',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Spam Bot',
    phone: '9850326135',
    category: 'General',
    message: 'Buy now discount link',
    _hp_school_check: 'http://spam-link.xyz'
  });
  console.log('   Status:', honeypotRes.statusCode, 'Body:', honeypotRes.body);

  // 5. Unauthorized Admin Access
  console.log('\n5. Unauthorized Admin Inquiries List (GET /api/inquiries)');
  const unauthRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inquiries',
    method: 'GET'
  });
  console.log('   Status:', unauthRes.statusCode, 'Body:', unauthRes.body);

  // 6. Authorized Admin Access Header
  console.log('\n6. Authorized Admin Inquiries List (GET /api/inquiries with x-admin-key)');
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inquiries',
    method: 'GET',
    headers: { 'x-admin-key': 'admin_zp_ghorad_secret_2026' }
  });
  console.log('   Status:', authRes.statusCode, 'Body:', authRes.body);

  // 7. Verify Static Website Files
  console.log('\n7. Verify Existing Website Pages & Assets (HTTP GET)');
  const pages = [
    '/index.html',
    '/about.html',
    '/academics.html',
    '/facilities.html',
    '/activities.html',
    '/gallery.html',
    '/notices.html',
    '/contact.html',
    '/css/style.css',
    '/js/contact.js'
  ];

  for (const page of pages) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: page,
      method: 'GET'
    });
    console.log(`   ${page} -> Status: ${res.statusCode} (Length: ${res.body.length} bytes)`);
  }

  console.log('\n====================================================');
  console.log('All Live Server Verification Checks Completed!');
  console.log('====================================================');
}

runLiveChecks().catch(console.error);
