#!/usr/bin/env node

/**
 * Test Leta API Order Submission
 * 
 * This script tests the complete order submission workflow to the Leta delivery API.
 * It validates configuration, creates test orders, and monitors delivery status.
 * 
 * Usage:
 *   node test-leta-order-submission.mjs
 * 
 * Environment Variables (optional):
 *   LETA_API_TOKEN - Leta API authentication token
 *   VITE_LETA_API_URL - Leta API base URL
 *   TEST_DEPOT_CODE - Specific depot to test (default: QUICK_NAIROBI_CBD)
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  LETA_API_TOKEN: process.env.LETA_API_TOKEN,
  LETA_API_URL: (process.env.VITE_LETRA_API_URL || 'https://integrations.leta.ai').replace(/\/api\/?$/, ''),
  TEST_DEPOT_CODE: process.env.TEST_DEPOT_CODE || 'QUICK_NAIROBI_CBD',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // ms
  TEST_RESULTS_FILE: path.join(path.dirname(fileURLToPath(import.meta.url)), 'letra-order-test-results.json')
};

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  configuration: {
    valid: false,
    errors: []
  },
  tests: {
    depotVerification: { passed: false, message: '', depotId: null },
    orderCreation: { passed: false, message: '', orderId: null },
    orderTracking: { passed: false, message: '', trackingUrl: null },
    orderStatusPolling: { passed: false, message: '', finalStatus: null }
  },
  summary: {
    totalTests: 4,
    passedTests: 0,
    failedTests: 0,
    overallStatus: 'UNKNOWN'
  }
};

// Utility: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Retry helper
async function retryWithBackoff(fn, label, maxAttempts = CONFIG.RETRY_ATTEMPTS) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`  📡 ${label} (attempt ${attempt}/${maxAttempts})...`);
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = CONFIG.RETRY_DELAY * attempt;
        console.log(`  ⏳ Retry in ${delay}ms due to: ${error.message}`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// Step 1: Validate configuration
function validateConfiguration() {
  console.log('\n📋 Step 1: Validating Configuration');
  console.log('─'.repeat(60));

  testResults.configuration.valid = true;
  testResults.configuration.errors = [];

  if (!CONFIG.LETA_API_TOKEN) {
    testResults.configuration.valid = false;
    testResults.configuration.errors.push('LETA_API_TOKEN not set in environment');
    console.log('  ❌ LETA_API_TOKEN is missing');
  } else {
    console.log('  ✓ LETA_API_TOKEN is set');
  }

  if (!CONFIG.LETA_API_URL) {
    testResults.configuration.valid = false;
    testResults.configuration.errors.push('VITE_LETA_API_URL not set');
    console.log('  ❌ VITE_LETA_API_URL is missing');
  } else {
    console.log(`  ✓ VITE_LETA_API_URL: ${CONFIG.LETA_API_URL}`);
  }

  console.log(`  ✓ Test depot code: ${CONFIG.TEST_DEPOT_CODE}`);

  if (!testResults.configuration.valid) {
    console.log('\n⚠️  Configuration Issues Found:');
    testResults.configuration.errors.forEach(err => console.log(`    - ${err}`));
    return false;
  }

  console.log('\n✅ Configuration is valid!');
  return true;
}

// Step 2: Verify depot exists and is active
async function verifyDepot() {
  console.log('\n🏢 Step 2: Verifying Depot Registration');
  console.log('─'.repeat(60));

  try {
    // Try multiple endpoint variations
    const endpoints = [
      `${CONFIG.LETA_API_URL}/depots/?code=${CONFIG.TEST_DEPOT_CODE}`,
      `${CONFIG.LETA_API_URL}/depots/`,
      `${CONFIG.LETA_API_URL.replace('/api', '')}/api/v1/depots/?code=${CONFIG.TEST_DEPOT_CODE}`
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`  📡 Trying endpoint: ${endpoint}`);
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          response = await res.json();
          console.log(`  ✓ Connected to: ${endpoint}`);
          break;
        } else {
          lastError = `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!response) {
      throw new Error(`No valid endpoint found. Last error: ${lastError}`);
    }

    if (response.data && response.data.length > 0) {
      const depot = response.data[0];
      testResults.tests.depotVerification.passed = true;
      testResults.tests.depotVerification.depotId = depot.id;
      testResults.tests.depotVerification.message = `Depot verified: ${depot.name} (ID: ${depot.id})`;
      console.log(`  ✅ Depot found: ${depot.name}`);
      console.log(`     ID: ${depot.id}`);
      console.log(`     Status: ${depot.status || 'active'}`);
      return true;
    } else if (response.success === false) {
      testResults.tests.depotVerification.message = `Depot not registered yet. Please run register-quickmart-depots.mjs first.`;
      console.log(`  ℹ️  Depot not registered. Response:`, JSON.stringify(response).substring(0, 200));
      return false;
    } else {
      testResults.tests.depotVerification.message = 'No depot data in response';
      console.log(`  ℹ️  Response:`, JSON.stringify(response).substring(0, 200));
      return false;
    }
  } catch (error) {
    testResults.tests.depotVerification.message = `Error: ${error.message}`;
    console.log(`  ❌ Error verifying depot: ${error.message}`);
    return false;
  }
}

// Step 3: Create a test order
async function createTestOrder() {
  console.log('\n📦 Step 3: Creating Test Order');
  console.log('─'.repeat(60));

  const testOrder = {
    reference: `TEST-${Date.now()}`,
    customer_name: 'Test User',
    customer_email: `test-${Date.now()}@getdeals.co.ke`,
    customer_phone: '+254722123456',
    branch: CONFIG.TEST_DEPOT_CODE,
    depot_code: CONFIG.TEST_DEPOT_CODE,
    status: 'pending',
    payment_method: 'M-Pesa',
    delivery_method: 'speedy',
    items_breakdown: [
      {
        name: 'Essential Basket',
        quantity: 1,
        unit_price: 3000
      }
    ],
    subtotal_kes: 3000,
    delivery_fee_kes: 200,
    total_amount_kes: 3200,
    delivery_address: 'Test Address, Nairobi, Kenya',
    delivery_coordinates: {
      latitude: -1.2864,
      longitude: 36.8172
    }
  };

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/orders/add`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testOrder)
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      },
      'Creating order via /orders/add'
    );

    // Handle various response formats from Leta API
    const orderId = response.data?.id || response.order?.id || response.id;
    
    if (orderId) {
      testResults.tests.orderCreation.passed = true;
      testResults.tests.orderCreation.orderId = orderId;
      testResults.tests.orderCreation.message = `Order created: ${orderId}`;
      console.log(`  ✅ Order created successfully`);
      console.log(`     Order ID: ${orderId}`);
      console.log(`     Status: ${response.data?.status || response.status || 'pending'}`);
      console.log(`     Total: Ksh ${testOrder.total_amount_kes}`);
      return orderId;
    } else {
      testResults.tests.orderCreation.message = 'Order created but no ID returned';
      console.log(`  ⚠️  Order may not have been created (no ID in response)`);
      console.log(`     Response:`, JSON.stringify(response).substring(0, 200));
      return null;
    }
  } catch (error) {
    testResults.tests.orderCreation.message = `Error: ${error.message}`;
    console.log(`  ❌ Error creating order: ${error.message}`);
    return null;
  }
}

// Step 4: Track order status
async function trackOrder(orderId) {
  console.log('\n🚚 Step 4: Tracking Order Status');
  console.log('─'.repeat(60));

  if (!orderId) {
    testResults.tests.orderTracking.message = 'No order ID to track';
    console.log('  ⚠️  Skipping tracking (no order ID)');
    return null;
  }

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/orders/${orderId}/tracking`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return await res.json();
      },
      `Fetching tracking for order ${orderId}`
    );

    if (response.data || response.tracking_url) {
      testResults.tests.orderTracking.passed = true;
      testResults.tests.orderTracking.trackingUrl = response.data?.tracking_url || response.tracking_url;
      testResults.tests.orderTracking.message = `Tracking available`;
      console.log(`  ✅ Tracking information retrieved`);
      console.log(`     Tracking URL: ${response.data?.tracking_url || response.tracking_url || 'N/A'}`);
      console.log(`     Current Status: ${response.data?.status || response.status || 'pending'}`);
      return response.data || response;
    } else {
      testResults.tests.orderTracking.message = 'No tracking data returned';
      console.log(`  ⚠️  No tracking data available yet`);
      return null;
    }
  } catch (error) {
    testResults.tests.orderTracking.message = `Error: ${error.message}`;
    console.log(`  ❌ Error fetching tracking: ${error.message}`);
    return null;
  }
}

// Step 5: Poll order status
async function pollOrderStatus(orderId) {
  console.log('\n📊 Step 5: Polling Order Status');
  console.log('─'.repeat(60));

  if (!orderId) {
    testResults.tests.orderStatusPolling.message = 'No order ID to poll';
    console.log('  ⚠️  Skipping status polling (no order ID)');
    return null;
  }

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return await res.json();
      },
      `Polling order status for ${orderId}`
    );

    // Handle various response formats
    const orderData = response.data || response;
    
    if (orderData) {
      testResults.tests.orderStatusPolling.passed = true;
      testResults.tests.orderStatusPolling.finalStatus = orderData.status;
      testResults.tests.orderStatusPolling.message = `Status: ${orderData.status}`;
      console.log(`  ✅ Order status retrieved`);
      console.log(`     Status: ${orderData.status}`);
      console.log(`     Last Updated: ${orderData.updated_at || orderData.timestamp || 'N/A'}`);
      
      if (orderData.driver) {
        console.log(`     Driver: ${orderData.driver.name || 'Assigned'}`);
      }
      
      if (orderData.estimated_arrival) {
        console.log(`     ETA: ${orderData.estimated_arrival}`);
      }
      
      return orderData;
    } else {
      testResults.tests.orderStatusPolling.message = 'No order data returned';
      console.log(`  ⚠️  No order data available`);
      return null;
    }
  } catch (error) {
    testResults.tests.orderStatusPolling.message = `Error: ${error.message}`;
    console.log(`  ❌ Error polling order: ${error.message}`);
    return null;
  }
}

// Calculate test summary
function calculateSummary() {
  const tests = testResults.tests;
  let passedCount = 0;

  Object.values(tests).forEach(test => {
    if (test.passed) passedCount++;
  });

  testResults.summary.passedTests = passedCount;
  testResults.summary.failedTests = testResults.summary.totalTests - passedCount;

  if (passedCount === testResults.summary.totalTests) {
    testResults.summary.overallStatus = '✅ ALL TESTS PASSED';
  } else if (passedCount >= 2) {
    testResults.summary.overallStatus = '⚠️  PARTIAL SUCCESS';
  } else {
    testResults.summary.overallStatus = '❌ TESTS FAILED';
  }
}

// Save results to file
function saveResults() {
  try {
    fs.writeFileSync(CONFIG.TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log(`\n📁 Results saved to: ${CONFIG.TEST_RESULTS_FILE}`);
  } catch (error) {
    console.log(`\n⚠️  Failed to save results: ${error.message}`);
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Overall Status: ${testResults.summary.overallStatus}`);
  console.log(`Passed: ${testResults.summary.passedTests}/${testResults.summary.totalTests}`);
  console.log(`Failed: ${testResults.summary.failedTests}/${testResults.summary.totalTests}`);

  console.log('\nDetailed Results:');
  Object.entries(testResults.tests).forEach(([testName, result]) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} ${testName}: ${result.message}`);
  });

  console.log('\n' + '='.repeat(60));

  if (testResults.configuration.errors.length > 0) {
    console.log('\n⚠️  Configuration Errors:');
    testResults.configuration.errors.forEach(err => {
      console.log(`  - ${err}`);
    });
    console.log('\nTo fix, set environment variables:');
    console.log('  export LETA_API_TOKEN="your-token"');
    console.log('  export VITE_LETA_API_URL="https://integrations.leta.ai/api"');
  }
}

// Main execution
async function main() {
  console.log('\n🚀 LETA API Order Submission Test Suite');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log(`Depot: ${CONFIG.TEST_DEPOT_CODE}`);
  console.log('='.repeat(60));

  // Step 1: Validate configuration
  if (!validateConfiguration()) {
    console.log('\n❌ Configuration validation failed. Please set required environment variables.');
    printSummary();
    saveResults();
    process.exit(1);
  }

  // Step 2: Verify depot
  await verifyDepot();

  // Step 3: Create test order
  const orderId = await createTestOrder();

  // Step 4: Track order
  if (orderId) {
    await trackOrder(orderId);
  }

  // Step 5: Poll order status
  if (orderId) {
    await pollOrderStatus(orderId);
  }

  // Calculate summary and save results
  calculateSummary();
  saveResults();
  printSummary();

  console.log('\n✨ Test suite completed!');
}

// Run main
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
