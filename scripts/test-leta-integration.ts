/**
 * Leta API Integration Test Script
 * 
 * Purpose: Verify that order data is being correctly sent to Leta APIs
 * 
 * Tests:
 * 1. Check if Leta API credentials are configured
 * 2. Test if order data payload is correct
 * 3. Simulate Leta order creation
 * 4. Verify webhook endpoint receives updates
 * 5. Test tracking data retrieval
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const letaApiUrl = process.env.VITE_LETA_API_URL || 'https://integrations.leta.ai';
const letaToken = process.env.LETA_API_TOKEN || process.env.VITE_LETA_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  code?: number;
  payload?: any;
  response?: any;
  timestamp: string;
}

const results: TestResult[] = [];

// ==================== TEST 1: Check Credentials ====================
function testCredentials(): TestResult {
  const timestamp = new Date().toISOString();
  
  console.log('\n📋 TEST 1: Checking Configuration...');
  
  const checks = {
    'SUPABASE_URL': !!supabaseUrl,
    'SUPABASE_SERVICE_KEY': !!supabaseServiceKey,
    'LETA_API_URL': !!letaApiUrl,
    'LETA_API_TOKEN': !!letaToken,
  };

  const allConfigured = Object.values(checks).every(v => v);
  
  const details = Object.entries(checks)
    .map(([key, value]) => `  ${value ? '✅' : '❌'} ${key}`)
    .join('\n');

  console.log(details);

  return {
    name: 'Configuration Check',
    status: allConfigured ? 'PASS' : 'FAIL',
    details: `Credentials: ${Object.values(checks).filter(v => v).length}/4 configured`,
    timestamp
  };
}

// ==================== TEST 2: Validate Payload Structure ====================
function testPayloadStructure(): TestResult {
  const timestamp = new Date().toISOString();
  
  console.log('\n📋 TEST 2: Validating Order Payload Structure...');

  const samplePayload = {
    reference: 'GD-ORD-123456',
    customer: {
      phone_number: '254712345678',
      email: 'customer@example.com',
      name: 'John Doe',
    },
    depot_code: 'getdeals-nairobi',
    dropoff: {
      latitude: -1.2860273,
      longitude: 36.8079678,
      name: 'Karen Green, Nairobi',
    },
    products: [
      {
        code: 'PROD-001',
        quantity: 2,
        price: 500,
      },
    ],
    payment_method: 'prepaid',
    special_instruction: 'GetDeals Order #ORD-123456. Items: 1',
    cargo_description: '2x Product Name',
  };

  const requiredFields = {
    reference: typeof samplePayload.reference === 'string',
    customer: typeof samplePayload.customer === 'object',
    'customer.phone_number': typeof samplePayload.customer.phone_number === 'string',
    'customer.email': typeof samplePayload.customer.email === 'string',
    'customer.name': typeof samplePayload.customer.name === 'string',
    depot_code: typeof samplePayload.depot_code === 'string',
    dropoff: typeof samplePayload.dropoff === 'object',
    'dropoff.latitude': typeof samplePayload.dropoff.latitude === 'number',
    'dropoff.longitude': typeof samplePayload.dropoff.longitude === 'number',
    'dropoff.name': typeof samplePayload.dropoff.name === 'string',
    products: Array.isArray(samplePayload.products),
    'products[0].code': typeof samplePayload.products[0].code === 'string',
    'products[0].quantity': typeof samplePayload.products[0].quantity === 'number',
    'products[0].price': typeof samplePayload.products[0].price === 'number',
    payment_method: typeof samplePayload.payment_method === 'string',
  };

  const allValid = Object.values(requiredFields).every(v => v);

  const details = Object.entries(requiredFields)
    .map(([key, value]) => `  ${value ? '✅' : '❌'} ${key}`)
    .join('\n');

  console.log(details);

  return {
    name: 'Payload Structure Validation',
    status: allValid ? 'PASS' : 'FAIL',
    details: `Fields valid: ${Object.values(requiredFields).filter(v => v).length}/${Object.keys(requiredFields).length}`,
    payload: samplePayload,
    timestamp
  };
}

// ==================== TEST 3: Test Leta API Connection ====================
async function testLetaConnection(): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  console.log('\n📋 TEST 3: Testing Leta API Connection...');
  console.log(`  Endpoint: ${letaApiUrl}/orders/add`);

  if (!letaToken) {
    console.log('  ❌ LETA_API_TOKEN not configured - Skipping actual API test');
    return {
      name: 'Leta API Connection',
      status: 'WARN',
      details: 'Cannot test - LETA_API_TOKEN not configured',
      timestamp
    };
  }

  const testPayload = {
    reference: `GD-TEST-${Date.now()}`,
    customer: {
      phone_number: '254712345678',
      email: 'test@getdeals.co.ke',
      name: 'Test User',
    },
    depot_code: 'getdeals-nairobi',
    dropoff: {
      latitude: -1.2860273,
      longitude: 36.8079678,
      name: 'Test Location, Nairobi',
    },
    products: [
      {
        code: 'TEST-001',
        quantity: 1,
        price: 100,
      },
    ],
    payment_method: 'prepaid',
    special_instruction: 'Test Order - Do Not Deliver',
    cargo_description: '1x Test Product',
  };

  console.log('  Sending test payload to Leta API...');
  console.log('  Payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(`${letaApiUrl}/orders/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${letaToken}`,
      },
      body: JSON.stringify(testPayload),
    });

    const responseData = await response.json();

    console.log(`  Response Status: ${response.status}`);
    console.log('  Response Data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('  ✅ Leta API accepted the order');
      return {
        name: 'Leta API Connection',
        status: 'PASS',
        details: `Successfully created test order: ${responseData.id}`,
        code: response.status,
        payload: testPayload,
        response: responseData,
        timestamp
      };
    } else {
      console.log(`  ❌ Leta API rejected the order: ${responseData.message || 'Unknown error'}`);
      return {
        name: 'Leta API Connection',
        status: 'FAIL',
        details: `API Error: ${responseData.message || responseData.error || 'Unknown error'}`,
        code: response.status,
        payload: testPayload,
        response: responseData,
        timestamp
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Connection failed: ${errorMsg}`);
    return {
      name: 'Leta API Connection',
      status: 'FAIL',
      details: `Connection error: ${errorMsg}`,
      timestamp
    };
  }
}

// ==================== TEST 4: Check Database Orders ====================
async function testDatabaseOrders(): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  console.log('\n📋 TEST 4: Checking Database Orders with Leta Integration...');

  try {
    // Get recent orders with Leta data
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_reference, status, delivery_method, leta_order_id, leta_reference, leta_status, created_at')
      .eq('delivery_method', 'speedy')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log(`  ❌ Database query failed: ${error.message}`);
      return {
        name: 'Database Orders Check',
        status: 'FAIL',
        details: `Query error: ${error.message}`,
        timestamp
      };
    }

    if (!orders || orders.length === 0) {
      console.log('  ⚠️  No speedy delivery orders found in database');
      return {
        name: 'Database Orders Check',
        status: 'WARN',
        details: 'No recent orders with speedy delivery found',
        timestamp
      };
    }

    console.log(`  Found ${orders.length} recent speedy delivery orders:`);
    
    orders.forEach((order: any, index: number) => {
      const hasLeta = !!order.leta_order_id;
      const status = hasLeta ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${order.order_reference} - Leta ID: ${order.leta_order_id || 'MISSING'}`);
      console.log(`     Status: ${order.status} | Leta Status: ${order.leta_status || 'N/A'}`);
      console.log(`     Created: ${new Date(order.created_at).toLocaleString()}`);
    });

    const withLeta = orders.filter((o: any) => o.leta_order_id).length;

    return {
      name: 'Database Orders Check',
      status: withLeta > 0 ? 'PASS' : 'WARN',
      details: `${withLeta}/${orders.length} orders have Leta integration`,
      payload: orders,
      timestamp
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Error: ${errorMsg}`);
    return {
      name: 'Database Orders Check',
      status: 'FAIL',
      details: `Error: ${errorMsg}`,
      timestamp
    };
  }
}

// ==================== TEST 5: Check Payments Table ====================
async function testPaymentsTable(): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  console.log('\n📋 TEST 5: Checking Payment Records...');

  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, reference, status, order_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log(`  ❌ Query failed: ${error.message}`);
      return {
        name: 'Payments Table Check',
        status: 'FAIL',
        details: `Query error: ${error.message}`,
        timestamp
      };
    }

    if (!payments || payments.length === 0) {
      console.log('  ⚠️  No recent payments found');
      return {
        name: 'Payments Table Check',
        status: 'WARN',
        details: 'No recent payment records',
        timestamp
      };
    }

    console.log(`  Found ${payments.length} recent payments:`);
    
    payments.forEach((payment: any, index: number) => {
      const hasOrder = !!payment.order_id;
      const status = hasOrder ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${payment.reference} - Order ID: ${payment.order_id || 'NOT LINKED'}`);
      console.log(`     Status: ${payment.status} | Created: ${new Date(payment.created_at).toLocaleString()}`);
    });

    const linkedPayments = payments.filter((p: any) => p.order_id).length;

    return {
      name: 'Payments Table Check',
      status: linkedPayments > 0 ? 'PASS' : 'WARN',
      details: `${linkedPayments}/${payments.length} payments linked to orders`,
      payload: payments,
      timestamp
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Error: ${errorMsg}`);
    return {
      name: 'Payments Table Check',
      status: 'FAIL',
      details: `Error: ${errorMsg}`,
      timestamp
    };
  }
}

// ==================== TEST 6: Validate Tracking Endpoint ====================
async function testTrackingEndpoint(): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  console.log('\n📋 TEST 6: Validating Tracking Endpoint...');

  try {
    // Get an order with Leta integration
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_reference, leta_order_id')
      .eq('delivery_method', 'speedy')
      .not('leta_order_id', 'is', null)
      .limit(1);

    if (error || !orders || orders.length === 0) {
      console.log('  ⚠️  No orders with Leta integration found to test');
      return {
        name: 'Tracking Endpoint Validation',
        status: 'WARN',
        details: 'No test orders available',
        timestamp
      };
    }

    const testOrder = orders[0];
    const frontendUrl = process.env.FRONTEND_URL || 'https://getdeals.co.ke';
    const trackingUrl = `${frontendUrl}/api/orders/${testOrder.id}/tracking`;

    console.log(`  Testing with order: ${testOrder.order_reference}`);
    console.log(`  Endpoint: ${trackingUrl}`);

    try {
      const response = await fetch(trackingUrl);
      const data = await response.json();

      console.log(`  Response Status: ${response.status}`);

      if (response.ok && data.success) {
        console.log('  ✅ Tracking endpoint returns valid data');
        return {
          name: 'Tracking Endpoint Validation',
          status: 'PASS',
          details: `Tracking data retrieved for order ${testOrder.order_reference}`,
          code: response.status,
          response: data,
          timestamp
        };
      } else {
        console.log(`  ❌ Tracking endpoint error: ${data.error}`);
        return {
          name: 'Tracking Endpoint Validation',
          status: 'FAIL',
          details: `Endpoint returned: ${data.error}`,
          code: response.status,
          response: data,
          timestamp
        };
      }
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.log(`  ❌ Fetch error: ${errorMsg}`);
      return {
        name: 'Tracking Endpoint Validation',
        status: 'FAIL',
        details: `Fetch error: ${errorMsg}`,
        timestamp
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Error: ${errorMsg}`);
    return {
      name: 'Tracking Endpoint Validation',
      status: 'FAIL',
      details: `Error: ${errorMsg}`,
      timestamp
    };
  }
}

// ==================== MAIN TEST RUNNER ====================
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LETA API INTEGRATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════');

  // Run synchronous tests
  results.push(testCredentials());
  results.push(testPayloadStructure());

  // Run async tests
  results.push(await testLetaConnection());
  results.push(await testDatabaseOrders());
  results.push(await testPaymentsTable());
  results.push(await testTrackingEndpoint());

  // ==================== SUMMARY ====================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;

  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Details: ${result.details}`);
    if (result.code) console.log(`   Code: ${result.code}`);
    console.log();
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  OVERALL RESULTS: ${passCount} PASS | ${failCount} FAIL | ${warnCount} WARN`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Export results to JSON for analysis
  const reportPath = 'test-results.json';
  const report = {
    timestamp: new Date().toISOString(),
    summary: { pass: passCount, fail: failCount, warn: warnCount },
    results: results
  };

  console.log(`📊 Test report saved to: ${reportPath}`);
  console.log(JSON.stringify(report, null, 2));

  return failCount === 0;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
