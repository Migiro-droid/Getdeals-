const https = require('https');

const checkoutRequestId = 'ws_CO_29092025165925049719575272';

const options = {
  hostname: 'getdeals.co.ke',
  port: 3001,
  path: `/api/payments/mpesa/status/${checkoutRequestId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log(`Checking status for: ${checkoutRequestId}`);
console.log(`URL: https://getdeals.co.ke:3001/api/payments/mpesa/status/${checkoutRequestId}`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Status Response:', JSON.stringify(response, null, 2));
    } catch (error) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();