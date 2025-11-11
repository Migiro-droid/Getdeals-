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
    orderCreation: { passed: false, message: '', orderId: null, reference: null },
    orderUpdate: { passed: false, message: '', updated: false },
    shippingRatesCalculation: { passed: false, message: '', rate: null },
    driverAvailability: { passed: false, message: '', available: false },
    orderCancellation: { passed: false, message: '', cancelled: false },
    depotCreation: { passed: false, message: '', depotId: null, depotCode: null },
    depotUpdate: { passed: false, message: '', updated: false }
  },
  summary: {
    totalTests: 7,
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
      console.log(`  [ATTEMPT ${attempt}/${maxAttempts}] ${label}...`);
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = CONFIG.RETRY_DELAY * attempt;
        console.log(`  [RETRY] In ${delay}ms due to: ${error.message}`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// Step 1: Validate configuration
function validateConfiguration() {
  console.log('\nStep 1: Validating Configuration');
  console.log('─'.repeat(60));

  testResults.configuration.valid = true;
  testResults.configuration.errors = [];

  if (!CONFIG.LETA_API_TOKEN) {
    testResults.configuration.valid = false;
    testResults.configuration.errors.push('LETA_API_TOKEN not set in environment');
    console.log('  [ERROR] LETA_API_TOKEN is missing');
  } else {
    console.log('  [OK] LETA_API_TOKEN is set');
  }

  if (!CONFIG.LETA_API_URL) {
    testResults.configuration.valid = false;
    testResults.configuration.errors.push('VITE_LETA_API_URL not set');
    console.log('  [ERROR] VITE_LETA_API_URL is missing');
  } else {
    console.log(`  [OK] VITE_LETA_API_URL: ${CONFIG.LETA_API_URL}`);
  }

  console.log(`  [OK] Test depot code: ${CONFIG.TEST_DEPOT_CODE}`);

  if (!testResults.configuration.valid) {
    console.log('\n[WARNINGS] Configuration Issues Found:');
    testResults.configuration.errors.forEach(err => console.log(`    - ${err}`));
    return false;
  }

  console.log('\n[SUCCESS] Configuration is valid!');
  return true;
}

// Step 2: Verify depot exists and is active
async function verifyDepot() {
  console.log('\nStep 2: Verifying Depot Registration');
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
        console.log(`  [TRYING] Endpoint: ${endpoint}`);
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          response = await res.json();
          console.log(`  [OK] Connected to: ${endpoint}`);
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
      console.log(`  [SUCCESS] Depot found: ${depot.name}`);
      console.log(`     ID: ${depot.id}`);
      console.log(`     Status: ${depot.status || 'active'}`);
      return true;
    } else if (response.success === false) {
      testResults.tests.depotVerification.message = `Depot not registered yet. Please run register-quickmart-depots.mjs first.`;
      console.log(`  [INFO] Depot not registered. Response:`, JSON.stringify(response).substring(0, 200));
      return false;
    } else {
      testResults.tests.depotVerification.message = 'No depot data in response';
      console.log(`  [INFO] Response:`, JSON.stringify(response).substring(0, 200));
      return false;
    }
  } catch (error) {
    testResults.tests.depotVerification.message = `Error: ${error.message}`;
    console.log(`   Error verifying depot: ${error.message}`);
    return false;
  }
}

// Step 3: Create a test order
async function createTestOrder() {
  console.log('\nStep 3: Creating Test Order');
  console.log('─'.repeat(60));

  const testOrder = {
    reference: `TEST-${Date.now()}`,
    customer: {
      phone_number: '+254722123456',
      email: `test-${Date.now()}@getdeals.co.ke`,
      name: 'Test User'
    },
    cargo_description: 'Essential Grocery Basket with household items',
    special_instruction: 'Handle with care',
    payment_method: 'postpaid_mobile_money',
    dropoff: {
      name: 'Test Delivery Location, Nairobi',
      latitude: '-1.2864',
      longitude: '36.8172'
    },
    pickup: {
      name: 'GetDeals Warehouse, Nairobi',
      latitude: '-1.3006',
      longitude: '36.7655'
    },
    products: [
      {
        code: 'BASKET-001',
        quantity: 1,
        price: 3200
      }
    ],
    total_price: 3200,
    delivery_fee: 200,
    total_weight: 5.5
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
    const orderId = response.data?.id || response.order?.id || response.detail?.id || response.id;
    const orderData = response.data || response.detail || response;
    
    if (orderId) {
      testResults.tests.orderCreation.passed = true;
      testResults.tests.orderCreation.orderId = orderId;
      testResults.tests.orderCreation.reference = orderData.reference || `TEST-${Date.now()}`;
      testResults.tests.orderCreation.message = `Order created: ${orderId}`;
      console.log(`  [SUCCESS] Order created successfully`);
      console.log(`     Order ID: ${orderId}`);
      console.log(`     Reference: ${orderData.reference || 'N/A'}`);
      console.log(`     Total: Ksh ${testOrder.total_price}`);
      return orderData;
    } else {
      testResults.tests.orderCreation.message = 'Order created but no ID returned';
      console.log(`  [WARNING] Order may not have been created (no ID in response)`);
      console.log(`     Response:`, JSON.stringify(response).substring(0, 200));
      return null;
    }
  } catch (error) {
    testResults.tests.orderCreation.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error creating order: ${error.message}`);
    return null;
  }
}

// Step 4: Calculate Shipping Rates
async function calculateShippingRates() {
  console.log('\nStep 4: Calculating Shipping Rates');
  console.log('─'.repeat(60));

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/shipping/rates/calculate/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origin: {
              latitude: -1.2860273,
              longitude: 36.8079678
            },
            destination: {
              latitude: -1.2885321,
              longitude: 36.8232210
            }
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      },
      'Calculating shipping rates'
    );

    const rateData = response.detail || response;
    if (rateData && rateData.price !== undefined) {
      testResults.tests.shippingRatesCalculation.passed = true;
      testResults.tests.shippingRatesCalculation.rate = rateData.price;
      testResults.tests.shippingRatesCalculation.message = `Rate calculated: KES ${rateData.price}`;
      console.log(`  [SUCCESS] Shipping rate calculated`);
      console.log(`     Distance: ${rateData.distance}m`);
      console.log(`     Price: KES ${rateData.price}`);
      console.log(`     Duration: ${rateData.duration}s`);
      return rateData;
    } else {
      testResults.tests.shippingRatesCalculation.message = 'No rate data returned';
      console.log(`  [WARNING] No rate data available`);
      return null;
    }
  } catch (error) {
    testResults.tests.shippingRatesCalculation.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error calculating rates: ${error.message}`);
    return null;
  }
}

// Step 5: Check Driver Availability
async function checkDriverAvailability() {
  console.log('\nStep 5: Checking Driver Availability');
  console.log('─'.repeat(60));

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/drivers/availability/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origin: {
              latitude: -1.2860273,
              longitude: 36.8079678
            },
            destination: {
              latitude: -1.2885321,
              longitude: 36.8232210
            },
            search_radius: 5000
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      },
      'Checking driver availability'
    );

    const availabilityData = response.detail || response;
    if (availabilityData && availabilityData.total_duration !== undefined) {
      testResults.tests.driverAvailability.passed = true;
      testResults.tests.driverAvailability.available = true;
      testResults.tests.driverAvailability.message = 'Drivers available';
      console.log(`  [SUCCESS] Drivers are available`);
      console.log(`     Pickup Distance: ${availabilityData.pickup_distance}m`);
      console.log(`     Delivery Duration: ${availabilityData.delivery_duration}s`);
      console.log(`     Total Duration: ${availabilityData.total_duration}s`);
      return availabilityData;
    } else {
      testResults.tests.driverAvailability.message = 'No drivers available';
      console.log(`  [WARNING] No drivers available in search radius`);
      return null;
    }
  } catch (error) {
    testResults.tests.driverAvailability.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error checking availability: ${error.message}`);
    return null;
  }
}

// Step 6: Create a Depot
async function createDepot() {
  console.log('\nStep 6: Creating Depot');
  console.log('─'.repeat(60));

  const depotCode = `TEST-DEPOT-${Date.now()}`;
  const depot = {
    name: `Test Depot ${Date.now()}`,
    code: depotCode,
    location: {
      latitude: -1.2860273,
      longitude: 36.8079678,
      name: 'Test Location, Nairobi, Kenya'
    },
    pickup_geofence_type: 'soft',
    pickup_geofence_radius: 500,
    dropoff_geofence_type: 'soft',
    dropoff_geofence_radius: 500,
    order_pickup_ready: false,
    restricted_radius: 1000,
    order_wait_time: 15,
    max_orders: 1
  };

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/depots/create/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(depot)
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      },
      'Creating depot'
    );

    const depotData = response.detail || response;
    if (depotData && (depotData.id || depotData.code)) {
      testResults.tests.depotCreation.passed = true;
      testResults.tests.depotCreation.depotId = depotData.id;
      testResults.tests.depotCreation.depotCode = depotData.code || depotCode;
      testResults.tests.depotCreation.message = `Depot created: ${depotData.code || depotCode}`;
      console.log(`  [SUCCESS] Depot created successfully`);
      console.log(`     Depot ID: ${depotData.id}`);
      console.log(`     Depot Code: ${depotData.code || depotCode}`);
      return depotData;
    } else {
      testResults.tests.depotCreation.message = 'Depot created but no ID returned';
      console.log(`  [WARNING] Depot may not have been created (no ID in response)`);
      return null;
    }
  } catch (error) {
    testResults.tests.depotCreation.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error creating depot: ${error.message}`);
    return null;
  }
}

// Step 7: Update an Order
async function updateOrder(orderReference) {
  console.log('\nStep 7: Updating Order');
  console.log('─'.repeat(60));

  if (!orderReference) {
    testResults.tests.orderUpdate.message = 'No order reference to update';
    console.log('  [WARNING] Skipping order update (no order reference)');
    return null;
  }

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/orders/update`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reference: orderReference,
            dropoff: {
              name: 'Updated Destination',
              latitude: '-1.2692453',
              longitude: '36.8087718'
            },
            customer: {
              phone_number: '+254722123456',
              email: 'updated@getdeals.co.ke'
            }
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      },
      'Updating order'
    );

    const orderData = response.detail || response;
    if (orderData && orderData.id) {
      testResults.tests.orderUpdate.passed = true;
      testResults.tests.orderUpdate.updated = true;
      testResults.tests.orderUpdate.message = 'Order updated successfully';
      console.log(`  [SUCCESS] Order updated successfully`);
      console.log(`     Order ID: ${orderData.id}`);
      console.log(`     New Destination: ${orderData.destination?.name || 'N/A'}`);
      return orderData;
    } else {
      testResults.tests.orderUpdate.message = 'Order update response unclear';
      console.log(`  [WARNING] Order may not have been updated`);
      return null;
    }
  } catch (error) {
    testResults.tests.orderUpdate.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error updating order: ${error.message}`);
    return null;
  }
}

// Step 8: Cancel an Order
async function cancelOrder(orderReference) {
  console.log('\nStep 8: Cancelling Order');
  console.log('─'.repeat(60));

  if (!orderReference) {
    testResults.tests.orderCancellation.message = 'No order reference to cancel';
    console.log('  [WARNING] Skipping order cancellation (no order reference)');
    return null;
  }

  try {
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(`${CONFIG.LETA_API_URL}/orders/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.LETA_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reference: orderReference
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      },
      'Cancelling order'
    );

    if (response.detail || response.status_code === 200) {
      testResults.tests.orderCancellation.passed = true;
      testResults.tests.orderCancellation.cancelled = true;
      testResults.tests.orderCancellation.message = 'Order cancelled successfully';
      console.log(`  [SUCCESS] Order cancelled successfully`);
      console.log(`     Message: ${response.detail || 'Order cancelled'}`);
      return response;
    } else {
      testResults.tests.orderCancellation.message = 'Order cancellation response unclear';
      console.log(`  [WARNING] Order cancellation status unclear`);
      return null;
    }
  } catch (error) {
    testResults.tests.orderCancellation.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error cancelling order: ${error.message}`);
    return null;
  }
}

// Step 9: Track order status
async function trackOrder(orderId) {
  console.log('\nStep 9: Tracking Order Status');
  console.log('─'.repeat(60));

  if (!orderId) {
    testResults.tests.orderTracking.message = 'No order ID to track';
    console.log('  [WARNING] Skipping tracking (no order ID)');
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
      console.log(`  [SUCCESS] Tracking information retrieved`);
      console.log(`     Tracking URL: ${response.data?.tracking_url || response.tracking_url || 'N/A'}`);
      console.log(`     Current Status: ${response.data?.status || response.status || 'pending'}`);
      return response.data || response;
    } else {
      testResults.tests.orderTracking.message = 'No tracking data returned';
      console.log(`  [WARNING] No tracking data available yet`);
      return null;
    }
  } catch (error) {
    testResults.tests.orderTracking.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error fetching tracking: ${error.message}`);
    return null;
  }
}

// Step 5: Poll order status
async function pollOrderStatus(orderId) {
  console.log('\nStep 5: Polling Order Status');
  console.log('─'.repeat(60));

  if (!orderId) {
    testResults.tests.orderStatusPolling.message = 'No order ID to poll';
    console.log('  [WARNING] Skipping status polling (no order ID)');
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
      console.log(`  [SUCCESS] Order status retrieved`);
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
      console.log(`  [WARNING] No order data available`);
      return null;
    }
  } catch (error) {
    testResults.tests.orderStatusPolling.message = `Error: ${error.message}`;
    console.log(`  [ERROR] Error polling order: ${error.message}`);
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
    testResults.summary.overallStatus = '[SUCCESS] ALL TESTS PASSED';
  } else if (passedCount >= 2) {
    testResults.summary.overallStatus = '[WARNING] PARTIAL SUCCESS';
  } else {
    testResults.summary.overallStatus = '[ERROR] TESTS FAILED';
  }
}

// Save results to file
function saveResults() {
  try {
    fs.writeFileSync(CONFIG.TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log(`\n[INFO] Results saved to: ${CONFIG.TEST_RESULTS_FILE}`);
  } catch (error) {
    console.log(`\n[WARNING] Failed to save results: ${error.message}`);
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Overall Status: ${testResults.summary.overallStatus}`);
  console.log(`Passed: ${testResults.summary.passedTests}/${testResults.summary.totalTests}`);
  console.log(`Failed: ${testResults.summary.failedTests}/${testResults.summary.totalTests}`);

  console.log('\nDetailed Results:');
  Object.entries(testResults.tests).forEach(([testName, result]) => {
    const icon = result.passed ? '[PASS]' : '[FAIL]';
    console.log(`  ${icon} ${testName}: ${result.message}`);
  });

  console.log('\n' + '='.repeat(60));

  if (testResults.configuration.errors.length > 0) {
    console.log('\n[WARNINGS] Configuration Errors:');
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
  console.log('\nLETA API Order Submission Test Suite');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  // Step 1: Validate configuration
  if (!validateConfiguration()) {
    console.log('\n[ERROR] Configuration validation failed. Please set required environment variables.');
    printSummary();
    saveResults();
    process.exit(1);
  }

  // Step 2: Create test order
  const orderResponse = await createTestOrder();
  const orderReference = orderResponse?.reference || `TEST-${Date.now()}`;

  // Step 3: Calculate shipping rates
  await calculateShippingRates();

  // Step 4: Check driver availability
  await checkDriverAvailability();

  // Step 5: Create a depot
  await createDepot();

  // Step 6: Update order (if order was created)
  if (orderResponse) {
    await updateOrder(orderResponse.reference);
  }

  // Step 7: Cancel order (if order was created)
  if (orderResponse) {
    await cancelOrder(orderResponse.reference);
  }

  // Calculate summary and save results
  calculateSummary();
  saveResults();
  printSummary();

  console.log('\n[COMPLETE] Test suite completed!');
}

// Run main
main().catch(error => {
  console.error('\n[FATAL] Unexpected error:', error);
  process.exit(1);
});
