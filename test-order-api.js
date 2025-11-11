/**
 * Test script for Order API after order creation
 * Run with: node test-order-api.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Fetch all orders
async function testFetchAllOrders() {
  log('\n--- Test 1: Fetch All Orders ---', 'cyan');
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/list`);
    const data = await response.json();
    
    if (response.ok) {
      log(`✓ Success: Retrieved ${data.orders?.length || 0} orders`, 'green');
      log(`Total count: ${data.total || 0}`, 'blue');
      if (data.orders && data.orders.length > 0) {
        log(`Sample order: ${JSON.stringify(data.orders[0], null, 2)}`, 'blue');
      }
      return data.orders;
    } else {
      log(`✗ Failed: ${data.error || 'Unknown error'}`, 'red');
      return [];
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return [];
  }
}

// Test 2: Fetch orders with filters
async function testFetchOrdersWithFilters() {
  log('\n--- Test 2: Fetch Orders with Filters ---', 'cyan');
  
  const testCases = [
    { status: 'pending', description: 'Pending orders' },
    { status: 'confirmed', description: 'Confirmed orders' },
    { status: 'delivered', description: 'Delivered orders' },
    { limit: '5', description: 'Limited to 5 orders' }
  ];

  for (const testCase of testCases) {
    try {
      const params = new URLSearchParams(testCase);
      const response = await fetch(`${API_BASE_URL}/api/orders/list?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        log(`✓ ${testCase.description}: ${data.orders?.length || 0} orders`, 'green');
      } else {
        log(`✗ ${testCase.description}: ${data.error}`, 'red');
      }
    } catch (error) {
      log(`✗ ${testCase.description}: ${error.message}`, 'red');
    }
  }
}

// Test 3: Fetch a specific order by ID
async function testFetchOrderById(orders) {
  log('\n--- Test 3: Fetch Specific Order by ID ---', 'cyan');
  
  if (!orders || orders.length === 0) {
    log('⚠ No orders available to test', 'yellow');
    return;
  }

  const testOrderId = orders[0].id || orders[0].order_reference;
  log(`Testing with order ID: ${testOrderId}`, 'blue');

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/list?search=${testOrderId}`);
    const data = await response.json();
    
    if (response.ok && data.orders && data.orders.length > 0) {
      log(`✓ Success: Found order`, 'green');
      log(`Order details: ${JSON.stringify(data.orders[0], null, 2)}`, 'blue');
    } else {
      log(`✗ Failed: Order not found`, 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
  }
}

// Test 4: Test order structure validation
async function testOrderStructure(orders) {
  log('\n--- Test 4: Validate Order Structure ---', 'cyan');
  
  if (!orders || orders.length === 0) {
    log('⚠ No orders available to test', 'yellow');
    return;
  }

  const sampleOrder = orders[0];
  const requiredFields = [
    'id',
    'customer_name',
    'customer_email',
    'customer_phone',
    'delivery_method',
    'payment_method',
    'status',
    'total_amount',
    'items'
  ];

  log('Checking required fields...', 'blue');
  let allFieldsPresent = true;

  for (const field of requiredFields) {
    if (sampleOrder.hasOwnProperty(field) || 
        sampleOrder.hasOwnProperty(field.replace(/_/g, ''))) {
      log(`✓ ${field}: present`, 'green');
    } else {
      log(`✗ ${field}: missing`, 'red');
      allFieldsPresent = false;
    }
  }

  if (allFieldsPresent) {
    log('\n✓ All required fields present!', 'green');
  } else {
    log('\n✗ Some required fields are missing', 'red');
  }

  // Check items array
  if (sampleOrder.items && Array.isArray(sampleOrder.items)) {
    log(`✓ Items array: ${sampleOrder.items.length} items`, 'green');
    if (sampleOrder.items.length > 0) {
      log(`Sample item: ${JSON.stringify(sampleOrder.items[0], null, 2)}`, 'blue');
    }
  } else {
    log('✗ Items array: missing or invalid', 'red');
  }
}

// Test 5: Test recent orders (last 24 hours)
async function testRecentOrders() {
  log('\n--- Test 5: Recent Orders (Last 24 Hours) ---', 'cyan');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/list?limit=100`);
    const data = await response.json();
    
    if (response.ok && data.orders) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentOrders = data.orders.filter(order => {
        const orderDate = new Date(order.created_at || order.date);
        return orderDate >= yesterday;
      });
      
      log(`✓ Found ${recentOrders.length} orders in last 24 hours`, 'green');
      
      if (recentOrders.length > 0) {
        log('\nRecent order summary:', 'blue');
        recentOrders.slice(0, 5).forEach((order, idx) => {
          log(`  ${idx + 1}. ${order.order_reference || order.id} - ${order.status} - KES ${order.total_amount}`, 'blue');
        });
      }
    } else {
      log(`✗ Failed to fetch orders`, 'red');
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
  }
}

// Test 6: Test order status distribution
async function testOrderStatusDistribution(orders) {
  log('\n--- Test 6: Order Status Distribution ---', 'cyan');
  
  if (!orders || orders.length === 0) {
    log('⚠ No orders available to test', 'yellow');
    return;
  }

  const statusCounts = {};
  orders.forEach(order => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  log('Status distribution:', 'blue');
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = ((count / orders.length) * 100).toFixed(1);
    log(`  ${status}: ${count} (${percentage}%)`, 'green');
  });
}

// Main test runner
async function runAllTests() {
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║         ORDER API TEST SUITE                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  log(`\nTesting API at: ${API_BASE_URL}`, 'yellow');
  log(`Start time: ${new Date().toLocaleString()}`, 'yellow');

  try {
    // Run all tests
    const orders = await testFetchAllOrders();
    await testFetchOrdersWithFilters();
    await testFetchOrderById(orders);
    await testOrderStructure(orders);
    await testRecentOrders();
    await testOrderStatusDistribution(orders);

    log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
    log('║         TEST SUITE COMPLETED                          ║', 'cyan');
    log('╚════════════════════════════════════════════════════════╝', 'cyan');
    log(`End time: ${new Date().toLocaleString()}`, 'yellow');
  } catch (error) {
    log(`\n✗ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
