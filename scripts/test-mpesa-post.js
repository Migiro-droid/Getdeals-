const http = require('http');
const data = JSON.stringify({ phoneNumber: '0719575272', amount: 10, orderId: 'test-order-0719575272-10' });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/payments/mpesa/initiate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', body);
  });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(data);
req.end();
