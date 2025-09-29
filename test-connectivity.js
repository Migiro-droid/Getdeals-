// Simple health check for M-Pesa service
import axios from 'axios';

async function testConnectivity() {
  console.log('🔍 Testing M-Pesa service connectivity...');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/health', {
      timeout: 5000
    });
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test CORS preflight
    console.log('2. Testing CORS preflight...');
    const corsResponse = await axios.options('http://localhost:3001/api/payments/mpesa/stk-push', {
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000
    });
    console.log('✅ CORS preflight passed');
    
    // Test actual endpoint with minimal data
    console.log('3. Testing actual endpoint (should fail validation)...');
    try {
      await axios.post('http://localhost:3001/api/payments/mpesa/stk-push', {
        test: 'data'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080'
        },
        timeout: 5000
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Endpoint reachable (validation error expected):', error.response.data);
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 All connectivity tests passed!');
    console.log('The M-Pesa service is accessible from your frontend.');
    
  } catch (error) {
    console.error('\n❌ Connectivity test failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('- M-Pesa service is not running on port 3001');
      console.error('- Start it with: cd mpesa-service && npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('- Connection timeout - service might be overloaded');
    } else if (error.response) {
      console.error('- HTTP Error:', error.response.status, error.response.data);
    } else {
      console.error('- Error:', error.message);
    }
  }
}

testConnectivity();