const data = { phoneNumber: '0719575272', amount: 10, orderId: 'test-order-0719575272-10' };

(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/payments/mpesa/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
})();
