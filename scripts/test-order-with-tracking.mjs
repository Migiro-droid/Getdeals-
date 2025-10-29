#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test order configuration
const TEST_ORDER = {
  customer_name: 'Test User',
  customer_email: 'test@getdeals.co.ke',
  customer_phone: '+254722123456',
  branch: 'Nairobi CBD',
  depot_code: 'QUICK_NAIROBI_CBD', // Using one of the registered depots
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
  delivery_address: 'Test Address, Nairobi'
};

/**
 * Create a test order
 */
async function createTestOrder() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api`;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 Creating Test Order with Depot Tracking');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`API Base URL: ${baseUrl}`);
  console.log(`Depot Code: ${TEST_ORDER.depot_code}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create the order
    console.log('📝 Step 1: Creating order...\n');
    
    const orderPayload = {
      userId: 'test-user-' + Date.now(),
      items: TEST_ORDER.items_breakdown.map(item => ({
        productId: 'test-product-' + Date.now(),
        name: item.name,
        quantity: item.quantity,
        price: item.unit_price
      })),
      subtotal: TEST_ORDER.subtotal_kes,
      deliveryFee: TEST_ORDER.delivery_fee_kes,
      total: TEST_ORDER.total_amount_kes,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: TEST_ORDER.payment_method,
      deliveryMethod: TEST_ORDER.delivery_method,
      notes: `Test order for depot: ${TEST_ORDER.depot_code}`,
      address: {
        street: TEST_ORDER.delivery_address,
        city: 'Nairobi',
        postalCode: '00100',
        country: 'Kenya'
      },
      branch: TEST_ORDER.branch,
      depotCode: TEST_ORDER.depot_code
    };

    const orderResponse = await fetch(`${apiUrl}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload),
      timeout: 30000
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('❌ Order creation failed:', orderData);
      return { success: false, error: 'Order creation failed' };
    }

    const orderId = orderData.data?.id || orderData.id || 'unknown';
    console.log(`✅ Order created successfully`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Total: KES ${TEST_ORDER.total_amount_kes}`);
    console.log(`   Delivery Method: ${TEST_ORDER.delivery_method}\n`);

    // Step 2: Attempt to initiate tracking with Leta
    console.log('📍 Step 2: Initiating tracking with Leta delivery...\n');

    const trackingPayload = {
      orderId: orderId,
      depotCode: TEST_ORDER.depot_code,
      customerPhone: TEST_ORDER.customer_phone,
      customerName: TEST_ORDER.customer_name,
      deliveryAddress: TEST_ORDER.delivery_address,
      deliveryMethod: TEST_ORDER.delivery_method
    };

    try {
      const trackingResponse = await fetch(`${apiUrl}/orders/initiate-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingPayload),
        timeout: 30000
      });

      const trackingData = await trackingResponse.json();

      if (trackingResponse.ok) {
        console.log(`✅ Tracking initiated successfully`);
        console.log(`   Tracking ID: ${trackingData.data?.trackingId || 'pending'}`);
        console.log(`   Status: ${trackingData.data?.status || 'active'}\n`);
      } else {
        console.warn(`⚠️  Tracking initiation warning:`);
        console.warn(`   Status: ${trackingResponse.status}`);
        console.warn(`   Message: ${trackingData.message || 'Unknown'}\n`);
      }
    } catch (trackingError) {
      console.warn(`⚠️  Could not initiate tracking (endpoint may not exist yet):`);
      console.warn(`   Error: ${trackingError.message}\n`);
    }

    // Step 3: Fetch order details to verify
    console.log('🔍 Step 3: Verifying order details...\n');

    const detailsResponse = await fetch(`${apiUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (detailsResponse.ok) {
      const details = await detailsResponse.json();
      const order = details.data || details;

      console.log('✅ Order details retrieved:');
      console.log(`   ID: ${order.id}`);
      console.log(`   Customer: ${order.customer_name || TEST_ORDER.customer_name}`);
      console.log(`   Phone: ${order.customer_phone || TEST_ORDER.customer_phone}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Depot Code: ${order.depot_code || TEST_ORDER.depot_code}`);
      console.log(`   Total: KES ${order.total || TEST_ORDER.total_amount_kes}\n`);
    } else {
      console.warn(`⚠️  Could not retrieve order details\n`);
    }

    // Step 4: Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Test Order Created Successfully');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nTest Order Summary:`);
    console.log(`  • Order ID: ${orderId}`);
    console.log(`  • Depot: ${TEST_ORDER.depot_code}`);
    console.log(`  • Amount: KES ${TEST_ORDER.total_amount_kes}`);
    console.log(`  • Delivery Method: ${TEST_ORDER.delivery_method}`);
    console.log(`  • Status: ${TEST_ORDER.status}`);
    console.log(`\nYou can now:`);
    console.log(`  1. Check order status at: ${baseUrl}/orders/${orderId}`);
    console.log(`  2. Monitor tracking with depot code: ${TEST_ORDER.depot_code}`);
    console.log(`  3. Verify delivery integration\n`);

    // Save test order details
    const resultsFile = path.join(__dirname, 'test-order-result.json');
    fs.writeFileSync(
      resultsFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          orderId,
          testOrder: TEST_ORDER,
          apiUrl: baseUrl,
          status: 'success'
        },
        null,
        2
      )
    );

    console.log(`📁 Test order details saved to: ${resultsFile}\n`);

    return { success: true, orderId };
  } catch (error) {
    console.error('💥 Fatal error creating test order:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
createTestOrder().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
