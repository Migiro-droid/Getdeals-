import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

async function testLogin() {
  try {
    console.log('Testing QuickMart login...');
    
    const postData = JSON.stringify({
      email: 'quickmart@getdeals.co.ke',
      password: 'quickmart123'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/signin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          console.log('Response data:', JSON.stringify(responseData, null, 2));

          if (responseData.token && responseData.user) {
            console.log('✅ Login successful!');
            console.log('User role:', responseData.user.role);
            console.log('User email:', responseData.user.email);
          } else {
            console.log('❌ Login failed');
          }
        } catch (error) {
          console.error('❌ Error parsing response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error testing login:', error.message);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ Error testing login:', error.message);
  }
}

testLogin();
