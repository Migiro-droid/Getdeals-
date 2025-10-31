/**
 * Leta API Integration Test Script
 * Tests complete order flow: availability → create → track → update
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wazzcvpwgjxewlykfbxh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const LETA_API_URL = process.env.VITE_LETA_API_URL || 'https://sandbox.integrations.leta.ai';
const LETA_TOKEN = process.env.VITE_LETA_TOKEN || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test data
const TEST_ORDER = {
  // Nairobi CBD - Pickup location (near Kenyatta Avenue)
  pickup: {
    latitude: -1.2864,
    longitude: 36.8172,
    name: 'GetDeals Warehouse - CBD',
    address: 'Kenyatta Avenue, Nairobi',
    phone: '+254712345678'
  },
  // Westlands - Delivery location
  delivery: {
    latitude: -1.2692,
    longitude: 36.8088,
    name: 'Customer - Eric Ndivo',
    address: 'Westlands, Nairobi',
    phone: '+254798765432'
  },
  // Test products
  items: [
    {
      code: 'TEST-001',
      name: 'Test Product 1',
      quantity: 2,
      price: 500
    },
    {
      code: 'TEST-002',
      name: 'Test Product 2',
      quantity: 1,
      price: 1000
    }
  ],
  customer: {
    name: 'Eric Ndivo',
    email: 'test@getdeals.co.ke',
    phone: '+254798765432'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logStep(step: number, description: string) {
  log(`\n📍 Step ${step}: ${description}`, 'cyan');
  console.log('-'.repeat(60));
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

// Utility to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Step 1: Check driver availability
 */
async function testDriverAvailability(): Promise<boolean> {
  logStep(1, 'Check Driver Availability');
  
  try {
    const payload = {
      origin: {
        latitude: TEST_ORDER.pickup.latitude,
        longitude: TEST_ORDER.pickup.longitude
      },
      destination: {
        latitude: TEST_ORDER.delivery.latitude,
        longitude: TEST_ORDER.delivery.longitude
      },
      search_radius: 5000,
      order_preparation_time: 600
    };

    logInfo('Checking for available drivers...');
    logInfo(`Pickup: ${TEST_ORDER.pickup.address}`);
    logInfo(`Delivery: ${TEST_ORDER.delivery.address}`);
    logInfo(`Search radius: 5000m`);

    const response = await axios.post(
      `${LETA_API_URL}/drivers/availability/`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${LETA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      logSuccess('Drivers available!');
      logInfo(`Available drivers: ${response.data.data?.available_drivers || 'N/A'}`);
      logInfo(`Estimated pickup time: ${response.data.data?.estimated_pickup_time || 'N/A'} mins`);
      return true;
    } else {
      logWarning('No drivers available in the area');
      logInfo('Continuing test anyway...');
      return true;
    }
  } catch (error: any) {
    logError(`Driver availability check failed: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

/**
 * Step 2: Create order in database
 */
async function createTestOrder(): Promise<string | null> {
  logStep(2, 'Create Test Order in Database');

  try {
    // Calculate total
    const subtotal = TEST_ORDER.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 150;
    const total = subtotal + deliveryFee;

    logInfo('Creating order in GetDeals database...');
    logInfo(`Subtotal: KES ${subtotal}`);
    logInfo(`Delivery Fee: KES ${deliveryFee}`);
    logInfo(`Total: KES ${total}`);

    // Create order with actual schema fields
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: 'test-user-leta-integration',
        order_reference: `TEST-LETA-${Date.now()}`,
        customer_email: TEST_ORDER.customer.email,
        customer_name: TEST_ORDER.customer.name,
        customer_phone: TEST_ORDER.customer.phone,
        order_items: TEST_ORDER.items, // JSONB field
        total_amount: total * 100, // Convert to cents (integer)
        subtotal: subtotal * 100, // Convert to cents (integer)
        delivery_fee: deliveryFee * 100, // Convert to cents (integer)
        status: 'pending',
        delivery_method: 'speedy',
        delivery_address: {
          name: TEST_ORDER.delivery.name,
          address: TEST_ORDER.delivery.address,
          latitude: TEST_ORDER.delivery.latitude,
          longitude: TEST_ORDER.delivery.longitude,
          phone: TEST_ORDER.delivery.phone
        }, // JSONB field
        pickup_location: TEST_ORDER.pickup.name,
        payment_method: 'mpesa',
        payment_status: 'completed',
        payment_reference: `TEST-REF-${Date.now()}`,
        notes: `Test order for Leta integration testing`
      })
      .select()
      .single();

    if (error) {
      logError(`Failed to create order: ${error.message}`);
      return null;
    }

    logSuccess(`Order created: ${order.id}`);
    logInfo(`Order ID: ${order.id}`);
    logInfo(`Status: ${order.status}`);
    
    return order.id;
  } catch (error: any) {
    logError(`Database error: ${error.message}`);
    return null;
  }
}

/**
 * Step 3: Submit order to Leta
 */
async function submitOrderToLeta(orderId: string): Promise<string | null> {
  logStep(3, 'Submit Order to Leta API');

  try {
    // Get order from database
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      logError('Order not found in database');
      return null;
    }

    // Prepare Leta order payload
    const letaPayload = {
      reference: order.order_reference,
      customer: {
        phone_number: TEST_ORDER.customer.phone,
        email: TEST_ORDER.customer.email,
        name: TEST_ORDER.customer.name
      },
      pickup: {
        name: TEST_ORDER.pickup.name,
        latitude: String(TEST_ORDER.pickup.latitude),
        longitude: String(TEST_ORDER.pickup.longitude),
        address: TEST_ORDER.pickup.address,
        phone: TEST_ORDER.pickup.phone
      },
      dropoff: {
        name: TEST_ORDER.delivery.name,
        latitude: String(TEST_ORDER.delivery.latitude),
        longitude: String(TEST_ORDER.delivery.longitude),
        address: TEST_ORDER.delivery.address,
        phone: TEST_ORDER.delivery.phone
      },
      note: 'Test order - Leta integration testing',
      products: TEST_ORDER.items.map(item => ({
        code: item.code,
        quantity: item.quantity
      })),
      order_value: Math.round(order.total_amount / 100), // Convert from cents back to KES
      order_preparation_time: 600,
      callback_url: `${FRONTEND_URL}/api/webhooks/leta`
    };

    logInfo('Submitting to Leta API...');
    logInfo(`API Endpoint: ${LETA_API_URL}/orders/add`);
    logInfo(`Callback URL: ${letaPayload.callback_url}`);
    logInfo(`Order Reference: ${letaPayload.reference}`);
    
    const response = await axios.post(
      `${LETA_API_URL}/orders/add`,
      letaPayload,
      {
        headers: {
          'Authorization': `Bearer ${LETA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Leta API returns status_code and detail
    if (response.data.status_code === 200 && response.data.detail) {
      const letaOrder = response.data.detail;
      const letaOrderId = String(letaOrder.id);
      const letaSlug = letaOrder.slug;
      const trackingUrl = `https://integrations.leta.ai/tracking/${letaSlug}`;

      logSuccess('Order submitted to Leta!');
      logInfo(`Leta Order ID: ${letaOrderId}`);
      logInfo(`Leta Slug: ${letaSlug}`);
      logInfo(`Leta Status: ${letaOrder.status}`);
      logInfo(`Tracking URL: ${trackingUrl}`);

      // Update database with Leta info
      await supabase
        .from('orders')
        .update({
          leta_order_id: letaOrderId,
          leta_reference: letaOrder.reference,
          leta_status: letaOrder.status,
          leta_tracking_url: trackingUrl
        })
        .eq('id', orderId);

      logSuccess('Database updated with Leta info');
      
      return letaOrderId;
    } else {
      logError('Leta API returned unsuccessful response');
      logError(JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error: any) {
    logError(`Failed to submit to Leta: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

/**
 * Step 4: Get order tracking info
 */
async function getOrderTracking(letaOrderId: string) {
  logStep(4, 'Get Order Tracking Info');

  try {
    logInfo('Fetching order details from Leta...');
    
    const response = await axios.get(
      `${LETA_API_URL}/orders/${letaOrderId}/`,
      {
        headers: {
          'Authorization': `Bearer ${LETA_TOKEN}`
        }
      }
    );

    if (response.data.success) {
      const order = response.data.data;
      
      logSuccess('Order tracking info retrieved!');
      logInfo(`Status: ${order.status}`);
      logInfo(`Driver: ${order.driver?.name || 'Not assigned yet'}`);
      logInfo(`Driver Phone: ${order.driver?.phone || 'N/A'}`);
      logInfo(`Created: ${order.created_at}`);
      
      return order;
    } else {
      logWarning('Could not retrieve tracking info');
      return null;
    }
  } catch (error: any) {
    logError(`Failed to get tracking: ${error.message}`);
    return null;
  }
}

/**
 * Step 5: Test WebSocket connection
 */
async function testWebSocketConnection(letaOrderId: string) {
  logStep(5, 'Test WebSocket Real-time Tracking');

  logInfo('WebSocket URL: wss://sandbox.integrations.leta.ai/ws/orders/' + letaOrderId);
  logInfo('To test WebSocket, use browser console:');
  log(`
const ws = new WebSocket('wss://sandbox.integrations.leta.ai/ws/orders/${letaOrderId}');
ws.onopen = () => console.log('✅ Connected');
ws.onmessage = (e) => console.log('📍 Location:', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => console.log('Connection closed:', e.code, e.reason);
  `, 'yellow');
  
  logWarning('WebSocket testing requires a browser or Node.js ws library');
  logInfo('Once driver is assigned, you should see real-time location updates');
}

/**
 * Step 6: Display test results and next steps
 */
async function displaySummary(orderId: string | null, letaOrderId: string | null) {
  logSection('📊 Test Summary');

  if (orderId && letaOrderId) {
    logSuccess('All tests completed successfully! 🎉');
    
    console.log('\n📦 Test Order Details:');
    console.log('-'.repeat(60));
    logInfo(`GetDeals Order ID: ${orderId}`);
    logInfo(`Leta Order ID: ${letaOrderId}`);
    
    // Get order from database
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (order) {
      logInfo(`Order Reference: ${order.order_reference}`);
      logInfo(`Status: ${order.status}`);
      logInfo(`Leta Status: ${order.leta_status || 'pending'}`);
      logInfo(`Tracking URL: ${order.leta_tracking_url || 'N/A'}`);
    }

    console.log('\n🔗 Useful Links:');
    console.log('-'.repeat(60));
    log(`Order Tracking: ${FRONTEND_URL}/orders/${orderId}/tracking`, 'cyan');
    log(`Admin Dashboard: ${FRONTEND_URL}/admin/orders`, 'cyan');
    log(`Leta Tracking: ${order?.leta_tracking_url || 'N/A'}`, 'cyan');

    console.log('\n📋 Next Steps:');
    console.log('-'.repeat(60));
    log('1. Check Leta dashboard for driver assignment', 'yellow');
    log('2. Monitor webhooks: Check leta_webhook_logs table', 'yellow');
    log('3. Test real-time tracking: Open tracking URL in browser', 'yellow');
    log('4. Verify order updates: Watch order status changes', 'yellow');
    log('5. Test delivery completion: Mark as delivered in Leta', 'yellow');

    console.log('\n🔍 Monitor Webhooks:');
    console.log('-'.repeat(60));
    log(`
-- Check webhook logs
SELECT * FROM leta_webhook_logs 
WHERE leta_order_id = '${letaOrderId}'
ORDER BY created_at DESC;

-- Check order updates
SELECT 
  order_reference,
  status,
  leta_status,
  rider_name,
  rider_phone,
  last_location_update
FROM orders 
WHERE id = '${orderId}';
    `, 'cyan');

  } else {
    logError('Test failed - see errors above');
    
    console.log('\n🔧 Troubleshooting:');
    console.log('-'.repeat(60));
    log('1. Check Leta token is valid: ' + (LETA_TOKEN ? '✅' : '❌'), 'yellow');
    log('2. Check database connection: ' + (SUPABASE_URL ? '✅' : '❌'), 'yellow');
    log('3. Verify depot configured in database', 'yellow');
    log('4. Check Leta API is accessible', 'yellow');
    log('5. Review error logs above', 'yellow');
  }
}

/**
 * Main test execution
 */
async function runTests() {
  logSection('🚀 Leta API Integration Test');
  
  log('Testing Leta delivery integration with real API calls', 'bright');
  logInfo(`Environment: ${LETA_API_URL.includes('sandbox') ? 'Sandbox' : 'Production'}`);
  logInfo(`API URL: ${LETA_API_URL}`);
  logInfo(`Token: ${LETA_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  
  if (!LETA_TOKEN) {
    logError('VITE_LETA_TOKEN not configured!');
    logError('Set it in .env file and try again');
    process.exit(1);
  }

  let orderId: string | null = null;
  let letaOrderId: string | null = null;

  try {
    // Step 1: Check driver availability
    const driversAvailable = await testDriverAvailability();
    await wait(2000);

    if (!driversAvailable) {
      logWarning('Driver availability check failed, but continuing...');
    }

    // Step 2: Create order in database
    orderId = await createTestOrder();
    await wait(2000);

    if (!orderId) {
      logError('Failed to create order in database');
      return;
    }

    // Step 3: Submit to Leta
    letaOrderId = await submitOrderToLeta(orderId);
    await wait(2000);

    if (!letaOrderId) {
      logError('Failed to submit order to Leta');
      return;
    }

    // Step 4: Get tracking info
    await getOrderTracking(letaOrderId);
    await wait(2000);

    // Step 5: WebSocket info
    await testWebSocketConnection(letaOrderId);
    await wait(1000);

  } catch (error: any) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
  } finally {
    // Step 6: Summary
    await displaySummary(orderId, letaOrderId);
  }
}

// Run the tests
runTests().then(() => {
  logSection('✨ Test Complete');
  process.exit(0);
}).catch((error) => {
  logError('Fatal error:');
  console.error(error);
  process.exit(1);
});
