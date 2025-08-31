#!/usr/bin/env node

/**
 * M-Pesa Microservice Test Script
 * Tests the integration between main server and M-Pesa microservice
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:4000'; // Main server
const MPESA_SERVICE_URL = 'http://localhost:3001'; // M-Pesa microservice

async function testHealthChecks() {
  console.log('🔍 Testing health checks...');

  try {
    // Test main server health
    const mainHealth = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Main server health:', mainHealth.data);

    // Test M-Pesa microservice health
    const mpesaHealth = await axios.get(`${MPESA_SERVICE_URL}/health`);
    console.log('✅ M-Pesa microservice health:', mpesaHealth.data);

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function testMpesaIntegration() {
  console.log('\n💰 Testing M-Pesa integration...');

  try {
    // Test M-Pesa initiate through main server
    const testPayload = {
      phoneNumber: '254712345678', // Test phone number
      amount: 100,
      orderId: `test-${Date.now()}`
    };

    console.log('📤 Testing payment initiation...');
    const response = await axios.post(`${BASE_URL}/api/payments/mpesa/initiate`, testPayload, {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a valid token for auth
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment initiation response:', response.data);

  } catch (error) {
    console.error('❌ M-Pesa integration test failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting M-Pesa Microservice Integration Tests\n');

  await testHealthChecks();
  await testMpesaIntegration();

  console.log('\n✨ Tests completed!');
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testHealthChecks, testMpesaIntegration };
