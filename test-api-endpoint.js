// Test the admin credentials API endpoint
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testApiEndpoint() {
  console.log('🧪 Testing Admin Credentials API Endpoint...');
  
  const testData = {
    name: 'Test Admin User',
    email: 'admin@getdeals.co.ke',
    password: 'TempPass123!@#',
    role: 'admin',
    permissions: ['all']
  };

  try {
    const response = await fetch('http://localhost:4000/api/admin/send-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a dummy auth header for testing
        'Authorization': 'Bearer dummy-token'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', result);

    if (response.ok) {
      console.log('✅ API endpoint working correctly!');
    } else {
      console.log('❌ API endpoint failed');
    }
  } catch (error) {
    console.log('❌ Failed to connect to server:', error.message);
    console.log('Make sure the server is running on port 4000');
  }
}

testApiEndpoint();