// Quick leta API test
const token = '9ad8af7c3ea3674aee27c3ea8e59928606852820';
const letaUrl = 'https://integrations.leta.ai/orders/add';

const depotCode = process.argv[2] || 'nairobi';

const payload = {
  reference: `GD-TEST-${Date.now()}`,
  customer: {
    phone_number: '254712345678',
    email: 'test@getdeals.co.ke',
    name: 'Test Order',
  },
  depot_code: depotCode,
  dropoff: {
    latitude: '-1.2860273',
    longitude: '36.8079678',
    name: 'Test Location',
  },
  products: [
    {
      code: 'TEST-001',
      quantity: 1,
      price: 100,
    },
  ],
  payment_method: 'prepaid',
};

console.log('Testing Lei API\n');
console.log(`Endpoint: ${letaUrl}`);
console.log(`Token: ${token.substring(0, 20)}...`);
console.log(`\nSending payload:\n`, JSON.stringify(payload, null, 2));

fetch(letaUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
})
  .then(res => res.json())
  .then(data => {
    if (data.status_code || data.detail) {
      console.log('\n API Error:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n Lei API Success!');
      console.log(JSON.stringify(data, null, 2));
      console.log(`\n Order created with ID: ${data.id}`);
      console.log(` Reference: ${data.reference}`);
      console.log(`Status: ${data.status}`);
    }
  })
  .catch(error => {
    console.log('\n Connection Error:');
    console.log(error.message);
  });
