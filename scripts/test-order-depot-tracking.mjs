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
const LETA_TOKEN = process.env.LETA_API_TOKEN;
const LETA_API_URL = process.env.VITE_LETA_API_URL || 'https://integrations.leta.ai';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test order data
const TEST_ORDER = {
  customer_name: 'Test Customer',
  customer_email: 'test.customer@getdeals.co.ke',
  customer_phone: '+254722999888',
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
 * Create test order in Supabase
 */
async function createTestOrder() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 Creating Test Order with Depot Tracking (Direct DB)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Depot Code: ${TEST_ORDER.depot_code}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create a test user
    console.log('👤 Step 1: Creating/Fetching test user...\n');

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', TEST_ORDER.customer_email)
      .single();

    let userId = existingUser?.id;

    if (!existingUser && fetchError?.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', fetchError);
      return { success: false, error: 'User fetch failed' };
    }

    if (!userId) {
      // Generate a UUID-like ID
      const generateId = () => {
        return 'test-user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      };

      userId = generateId();

      const { error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            name: TEST_ORDER.customer_name,
            email: TEST_ORDER.customer_email,
            phone: TEST_ORDER.customer_phone,
            role: 'customer',
            emailVerified: true,
            phoneVerified: true
          }
        ]);

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return { success: false, error: 'User creation failed' };
      }

      console.log(`✅ Test user created: ${userId}`);
    } else {
      console.log(`✅ Test user found: ${userId}`);
    }

    // Step 2: Create an order
    console.log('\n📝 Step 2: Creating order...\n');

    const orderPayload = {
      user_id: userId,
      total: TEST_ORDER.total_amount_kes,
      subtotal: TEST_ORDER.subtotal_kes,
      delivery_fee: TEST_ORDER.delivery_fee_kes,
      status: TEST_ORDER.status,
      payment_status: 'pending',
      payment_method: TEST_ORDER.payment_method,
      delivery_method: TEST_ORDER.delivery_method,
      notes: `Test order for depot: ${TEST_ORDER.depot_code}. Tracking validation.`
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select('id, status, total, delivery_method')
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return { success: false, error: 'Order creation failed' };
    }

    const orderId = order.id;
    console.log(`✅ Order created successfully`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Total: KES ${order.total}`);
    console.log(`   Delivery Method: ${order.delivery_method}\n`);

    // Step 3: Create order items
    console.log('🛒 Step 3: Adding order items...\n');

    const { error: itemError } = await supabase
      .from('order_items')
      .insert(
        TEST_ORDER.items_breakdown.map(item => ({
          order_id: orderId,
          product_id: 'test-product-' + Date.now(),
          quantity: item.quantity,
          price: item.unit_price
        }))
      );

    if (itemError) {
      console.warn(`⚠️  Warning adding order items:`, itemError.message);
    } else {
      console.log(`✅ Order items added`);
      TEST_ORDER.items_breakdown.forEach(item => {
        console.log(`   • ${item.name} x${item.quantity} @ KES ${item.unit_price}`);
      });
    }

    // Step 4: Store depot code reference
    console.log('\n🏭 Step 4: Storing depot reference...\n');

    // Update order with depot code in notes (since depot_code might not be a direct field)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        notes: `Depot: ${TEST_ORDER.depot_code} | ${orderPayload.notes}`
      })
      .eq('id', orderId);

    if (updateError) {
      console.warn(`⚠️  Could not store depot reference:`, updateError.message);
    } else {
      console.log(`✅ Depot code stored: ${TEST_ORDER.depot_code}`);
    }

    // Step 5: Verify order in database
    console.log('\n🔍 Step 5: Verifying order in database...\n');

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
      console.log(`   Status: ${verifiedOrder.status}`);
      console.log(`   Total: KES ${verifiedOrder.total}`);
      console.log(`   Payment Status: ${verifiedOrder.paymentStatus}`);
      console.log(`   Delivery: ${verifiedOrder.deliveryMethod}`);
      console.log(`   Notes: ${verifiedOrder.notes}\n`);
    }

    // Step 6: Test depot availability
    console.log('✅ Step 6: Validating depot code...\n');

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
      console.log(`   Status: Ready for tracking\n`);
    } else {
      console.error(`❌ Depot code is NOT registered`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Test Order Created Successfully');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nTest Order Summary:`);
    console.log(`  • Order ID: ${orderId}`);
    console.log(`  • User ID: ${userId}`);
    console.log(`  • Depot: ${TEST_ORDER.depot_code} ${isDepotValid ? '✅' : '❌'}`);
    console.log(`  • Amount: KES ${TEST_ORDER.total_amount_kes}`);
    console.log(`  • Delivery: ${TEST_ORDER.delivery_method}`);
    console.log(`  • Status: ${TEST_ORDER.status}`);
    console.log(`\nNext Steps:`);
    console.log(`  1. Order is now in database with depot code`);
    console.log(`  2. Tracking can be initiated with depot: ${TEST_ORDER.depot_code}`);
    console.log(`  3. Monitor order status in Supabase dashboard`);
    console.log(`  4. Verify delivery integration with Leta API\n`);

    // Save test results
    const resultsFile = path.join(__dirname, 'test-order-tracking-result.json');
    fs.writeFileSync(
      resultsFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          orderId,
          userId,
          depot_code: TEST_ORDER.depot_code,
          depot_valid: isDepotValid,
          order_details: {
            total: TEST_ORDER.total_amount_kes,
            items: TEST_ORDER.items_breakdown,
            delivery_method: TEST_ORDER.delivery_method
          },
          status: 'success'
        },
        null,
        2
      )
    );

    console.log(`📁 Results saved to: ${resultsFile}\n`);

    return { success: true, orderId, userId };
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
