import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyOrdersSetup() {
  console.log('🔍 Verifying Orders System Setup...\n');

  try {
    // 1. Check if orders table exists
    console.log('1️⃣ Checking orders table...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.log('   ❌ Orders table error:', ordersError.message);
      if (ordersError.message.includes('does not exist')) {
        console.log('   💡 You need to create the orders table first!');
      }
    } else {
      console.log('   ✅ Orders table exists');
    }

    // 2. Check if orders_with_details view exists
    console.log('\n2️⃣ Checking orders_with_details view...');
    const { data: viewData, error: viewError } = await supabase
      .from('orders_with_details')
      .select('*')
      .limit(1);

    if (viewError) {
      console.log('   ❌ View error:', viewError.message);
      if (viewError.message.includes('does not exist')) {
        console.log('   💡 Run the SQL script in scripts/fix-orders-view.sql');
      }
    } else {
      console.log('   ✅ orders_with_details view exists');
    }

    // 3. Count existing orders
    console.log('\n3️⃣ Counting existing orders...');
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('   ❌ Count error:', countError.message);
    } else {
      console.log(`   ✅ Found ${count} order(s) in database`);
    }

    // 4. Check recent orders
    if (count && count > 0) {
      console.log('\n4️⃣ Fetching recent orders...');
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select('order_reference, customer_name, total, status, payment_status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.log('   ❌ Error fetching orders:', recentError.message);
      } else if (recentOrders && recentOrders.length > 0) {
        console.log(`   ✅ Recent orders:`);
        recentOrders.forEach((order, index) => {
          const total = order.total > 100000 ? (order.total / 100).toFixed(2) : order.total;
          console.log(`   ${index + 1}. ${order.order_reference} - ${order.customer_name || 'N/A'} - KES ${total} - ${order.status}`);
        });
      }
    }

    // 5. Check order_items table
    console.log('\n5️⃣ Checking order_items table...');
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (itemsError) {
      console.log('   ⚠️  Order_items table issue:', itemsError.message);
      console.log('   💡 This is optional - items can be stored in orders.order_items JSONB column');
    } else {
      console.log('   ✅ order_items table exists');
    }

    // 6. Test the list API endpoint
    console.log('\n6️⃣ Testing /api/orders/list endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/orders/list?limit=5');
      const data = await response.json();
      
      if (data.success) {
        console.log('   ✅ API endpoint working');
        console.log(`   📊 Orders: ${data.orders.length}, Total: ${data.pagination?.total || 0}`);
      } else {
        console.log('   ❌ API returned error:', data.error);
      }
    } catch (apiError) {
      console.log('   ⚠️  Could not test API endpoint (server may not be running)');
      console.log('   💡 Start your dev server with: npm run dev');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    
    if (!ordersError && !viewError) {
      console.log('✅ Your orders system is properly set up!');
      console.log('\n📝 Next steps:');
      console.log('   1. Place a test order through /checkout');
      console.log('   2. Check /admin/orders to see it appear');
      console.log('   3. Verify all order details display correctly');
    } else {
      console.log('⚠️  Some issues found. Please fix them:');
      if (ordersError) {
        console.log('   ❌ Create the orders table');
      }
      if (viewError) {
        console.log('   ❌ Run scripts/fix-orders-view.sql in Supabase SQL Editor');
      }
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
  }
}

verifyOrdersSetup();
