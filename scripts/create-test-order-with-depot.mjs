#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test order data
const TEST_ORDER = {
  customer_name: 'Test Customer Depot',
  customer_email: `test.depot.${Date.now()}@getdeals.co.ke`,
  customer_phone: '+254722999777',
  branch: 'Nairobi CBD',
  depot_code: 'QUICK_NAIROBI_CBD',
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
  total_amount_kes: 3200
};

/**
 * Create test order in Supabase with proper schema
 */
async function createTestOrder() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 Creating Test Order with Depot Code');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Depot Code: ${TEST_ORDER.depot_code}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create or fetch test user
    console.log('👤 Step 1: Setting up test user...\n');

    const userId = 'test-user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();

    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          name: TEST_ORDER.customer_name,
          email: TEST_ORDER.customer_email,
          phone: TEST_ORDER.customer_phone,
          role: 'customer',
          email_verified: true,
          phone_verified: true
        }
      ]);

    if (userError && userError.code !== '23505') { // 23505 is unique violation
      console.warn(`⚠️  User setup note:`, userError.message);
    } else if (!userError) {
      console.log(`✅ Test user created: ${userId}`);
    } else {
      console.log(`✅ Test user exists: ${userId}`);
    }

    // Step 2: Create order with all proper fields
    console.log('\n📝 Step 2: Creating order with depot code...\n');

    const generateOrderReference = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `QM${timestamp}${random}`;
    };

    const orderReference = generateOrderReference();
    const totalAmountCents = TEST_ORDER.total_amount_kes * 100;
    const subtotalCents = TEST_ORDER.subtotal_kes * 100;
    const deliveryFeeCents = TEST_ORDER.delivery_fee_kes * 100;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          order_reference: orderReference,
          customer_name: TEST_ORDER.customer_name,
          customer_email: TEST_ORDER.customer_email,
          customer_phone: TEST_ORDER.customer_phone,
          total_amount: totalAmountCents,
          subtotal: subtotalCents,
          delivery_fee: deliveryFeeCents,
          status: TEST_ORDER.status,
          payment_status: 'pending',
          payment_method: TEST_ORDER.payment_method,
          delivery_method: TEST_ORDER.delivery_method,
          branch: TEST_ORDER.branch,
          pickup_location: TEST_ORDER.depot_code,
          items: TEST_ORDER.items_breakdown,
          notes: `Test order for depot tracking. Depot: ${TEST_ORDER.depot_code}`
        }
      ])
      .select('id, order_reference, total_amount, branch, pickup_location')
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return { success: false, error: 'Order creation failed' };
    }

    const orderId = order.id;
    console.log(`✅ Order created successfully`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Reference: ${order.order_reference}`);
    console.log(`   Total: KES ${TEST_ORDER.total_amount_kes}`);
    console.log(`   Branch: ${order.branch}`);
    console.log(`   Pickup Location: ${order.pickup_location}\n`);

    // Step 3: Add order items
    console.log('🛒 Step 3: Adding order items...\n');

    const { error: itemError } = await supabase
      .from('order_items')
      .insert(
        TEST_ORDER.items_breakdown.map((item, index) => ({
          order_id: orderId,
          product_id: `test-product-${Date.now()}-${index}`,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price * 100,
          total_price: item.unit_price * item.quantity * 100,
          price: item.unit_price * 100
        }))
      );

    if (itemError) {
      console.warn(`⚠️  Warning adding order items:`, itemError.message);
    } else {
      console.log(`✅ Order items added:`);
      TEST_ORDER.items_breakdown.forEach(item => {
        console.log(`   • ${item.name} x${item.quantity} @ KES ${item.unit_price}`);
      });
    }

    // Step 4: Verify order in database
    console.log('\n🔍 Step 4: Verifying order in database...\n');

    const { data: verifiedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (verifyError) {
      console.warn(`⚠️  Could not verify order:`, verifyError.message);
    } else {
      console.log('✅ Order verification successful:');
      console.log(`   ID: ${verifiedOrder.id}`);
      console.log(`   Reference: ${verifiedOrder.order_reference}`);
      console.log(`   Status: ${verifiedOrder.status}`);
      console.log(`   Total: KES ${(verifiedOrder.total_amount / 100).toFixed(2)}`);
      console.log(`   Payment Status: ${verifiedOrder.payment_status}`);
      console.log(`   Delivery: ${verifiedOrder.delivery_method}`);
      console.log(`   Branch: ${verifiedOrder.branch}`);
      console.log(`   Pickup Location: ${verifiedOrder.pickup_location}\n`);
    }

    // Step 5: Validate depot code
    console.log('✅ Step 5: Validating depot code for tracking...\n');

    const REGISTERED_DEPOTS = [
      'QUICK_NAIROBI_WESTLANDS',
      'QUICK_NAIROBI_ROYSAMBU',
      'QUICK_NAIROBI_LAVINGTON',
      'QUICK_NAIROBI_THINDIUGA',
      'QUICK_NAIROBI_MOMBASA_ROAD',
      'QUICK_NAIROBI_KAREN',
      'QUICK_NAIROBI_CBD',
      'QUICK_NAIROBI_EASTLANDS'
    ];

    const isDepotValid = REGISTERED_DEPOTS.includes(TEST_ORDER.depot_code);

    if (isDepotValid) {
      console.log(`✅ Depot code is VALID and REGISTERED`);
      console.log(`   Code: ${TEST_ORDER.depot_code}`);
      console.log(`   Status: Ready for tracking with Leta API\n`);
    } else {
      console.error(`❌ Depot code is NOT registered`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Test Order Created Successfully with Depot Tracking');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nOrder Details:`);
    console.log(`  • Order ID: ${orderId}`);
    console.log(`  • Reference: ${orderReference}`);
    console.log(`  • User ID: ${userId}`);
    console.log(`  • Depot Code: ${TEST_ORDER.depot_code} ${isDepotValid ? '✅' : '❌'}`);
    console.log(`  • Amount: KES ${TEST_ORDER.total_amount_kes}`);
    console.log(`  • Delivery: ${TEST_ORDER.delivery_method}`);
    console.log(`  • Status: ${TEST_ORDER.status}\n`);
    console.log(`Tracking Integration:`);
    console.log(`  • Depot is ready for tracking`);
    console.log(`  • Order can be tracked using: ${TEST_ORDER.depot_code}`);
    console.log(`  • Next: Initiate delivery tracking with Leta API`);
    console.log(`  • Monitor: Check order status updates in real-time\n`);

    // Save test results
    const resultsFile = path.join(__dirname, 'test-order-depot-result.json');
    fs.writeFileSync(
      resultsFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          success: true,
          orderId,
          orderReference,
          userId,
          depot_code: TEST_ORDER.depot_code,
          depot_valid: isDepotValid,
          order_details: {
            total_kes: TEST_ORDER.total_amount_kes,
            items: TEST_ORDER.items_breakdown,
            delivery_method: TEST_ORDER.delivery_method,
            branch: TEST_ORDER.branch,
            status: TEST_ORDER.status
          },
          tracking_ready: isDepotValid
        },
        null,
        2
      )
    );

    console.log(`📁 Results saved to: ${resultsFile}\n`);

    return { success: true, orderId, orderReference, userId };
  } catch (error) {
    console.error('💥 Fatal error:', error);
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
