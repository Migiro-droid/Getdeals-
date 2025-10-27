/**
 * Quick Debug Script: Check Why Leta Integration is Failing
 * 
 * Run this to identify the exact issue:
 * 1. Is token configured?
 * 2. Is API reachable?
 * 3. What's the actual error?
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const letaToken = process.env.LETA_API_TOKEN || process.env.VITE_LETA_TOKEN;
const letaUrl = process.env.VITE_LETA_API_URL || 'https://integrations.leta.ai';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  LETA INTEGRATION DEBUG - Quick Diagnosis             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// ============ CHECK 1: Environment Variables ============
console.log('📋 CHECK 1: Environment Variables\n');

const envStatus = {
  'SUPABASE_URL': !!supabaseUrl,
  'SUPABASE_SERVICE_KEY': !!supabaseKey,
  'LETA_API_TOKEN': !!letaToken,
  'LETA_API_URL': !!letaUrl,
};

Object.entries(envStatus).forEach(([key, exists]) => {
  const icon = exists ? '✅' : '❌';
  console.log(`${icon} ${key}: ${exists ? 'SET' : 'MISSING'}`);
});

const allSet = Object.values(envStatus).every(v => v);

if (!allSet) {
  console.log('\n⚠️ MISSING ENVIRONMENT VARIABLES!\n');
  console.log('Solution:');
  console.log('  1. Go to: https://vercel.com/dashboard');
  console.log('  2. Select: getdeals-kenya-showcase');
  console.log('  3. Settings > Environment Variables');
  console.log('  4. Add missing variables');
  console.log('  5. Redeploy');
  process.exit(1);
}

// ============ CHECK 2: Lei API Connectivity ============
console.log('\n\n📋 CHECK 2: Lei API Connectivity\n');

console.log(`Testing: ${letaUrl}/orders/add`);
console.log(`Token: ${letaToken?.substring(0, 20)}... (truncated for security)\n`);

async function testLetaAPI() {
  try {
    const testPayload = {
      reference: `GD-DEBUG-${Date.now()}`,
      customer: {
        phone_number: '254712345678',
        email: 'debug@test.com',
        name: 'Debug Test',
      },
      depot_code: 'getdeals-nairobi',
      dropoff: {
        latitude: -1.2860273,
        longitude: 36.8079678,
        name: 'Debug Location',
      },
      products: [
        {
          code: 'DEBUG-001',
          quantity: 1,
          price: 100,
        },
      ],
      payment_method: 'prepaid',
    };

    console.log('Sending test order...\n');

    const response = await fetch(`${letaUrl}/orders/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${letaToken}`,
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`Response Status: ${response.status}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ LEI API IS WORKING!\n');
      console.log('Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n✅ Lei API connection is SUCCESSFUL');
      console.log('✅ Token is VALID');
      console.log('\n⚠️ If Lei API works but orders still fail:');
      console.log('   - Check if api/orders/create.ts is calling createLetaOrder()');
      console.log('   - Check if delivery_method is "speedy"');
      console.log('   - Check Vercel logs for errors');
    } else {
      console.log('❌ LEI API REJECTED REQUEST!\n');
      console.log('Error Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\nPossible issues:');
      console.log('  - Token is WRONG');
      console.log('  - Token is EXPIRED');
      console.log('  - Payload format is WRONG');
      console.log('  - Lei API endpoint changed');
    }
  } catch (error) {
    console.log('❌ LEI API CONNECTION FAILED!\n');
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`Error: ${errorMsg}`);
    console.log('\nPossible issues:');
    console.log('  - Network/firewall blocking connection');
    console.log('  - Lei endpoint is down');
    console.log('  - DNS resolution failed');
  }
}

// ============ CHECK 3: Database Orders ============
async function checkDatabase() {
  console.log('\n\n📋 CHECK 3: Recent Orders Status\n');

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_reference, status, delivery_method, leta_order_id, created_at')
      .eq('delivery_method', 'speedy')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log(`❌ Database query failed: ${error.message}`);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No speedy delivery orders found');
      return;
    }

    console.log(`Found ${orders.length} recent speedy orders:\n`);

    orders.forEach((order: any) => {
      const hasLeta = !!order.leta_order_id;
      const icon = hasLeta ? '✅' : '❌';
      console.log(`${icon} ${order.order_reference}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Leta ID: ${order.leta_order_id || 'NULL (NOT SET!)'}`);
      console.log(`   Created: ${new Date(order.created_at).toLocaleString()}\n`);
    });

    const withLeta = orders.filter((o: any) => o.leta_order_id).length;

    if (withLeta === 0) {
      console.log('❌ PROBLEM FOUND: No orders have leta_order_id!\n');
      console.log('This means createLetaOrder() is NOT working.');
      console.log('\nDebugging steps:');
      console.log('  1. Check Vercel logs for: "INITIATING LETA DELIVERY"');
      console.log('  2. Check for: "LETA ORDER CREATION FAILED"');
      console.log('  3. Look for exact error message');
      console.log('  4. Share error with Lei support');
    } else {
      console.log(`✅ Some orders have Lei integration (${withLeta}/${orders.length})`);
    }
  } catch (dbError) {
    const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
    console.log(`❌ Database error: ${errorMsg}`);
  }
}

// ============ FINAL SUMMARY ============
async function runAllChecks() {
  await testLetaAPI();
  await checkDatabase();

  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY                                               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('Next steps:\n');
  console.log('If Lei API test PASSED:');
  console.log('  → Lei integration works');
  console.log('  → Check if new orders have leta_order_id');
  console.log('  → Check api/orders/create.ts for bugs\n');

  console.log('If Lei API test FAILED:');
  console.log('  → Token is wrong or expired');
  console.log('  → Update LETA_API_TOKEN in Vercel');
  console.log('  → Redeploy\n');

  console.log('If database shows NULL leta_order_id:');
  console.log('  → See Vercel logs for errors');
  console.log('  → Check if Lei API call is being made');
  console.log('  → Verify delivery_method = "speedy" for orders\n');
}

runAllChecks();
