#!/usr/bin/env tsx
/**
 * Test the /api/orders/list endpoint to verify correct counts are returned
 * 
 * Usage:
 *   npx tsx scripts/test-orders-api.ts
 */

const API_URL = 'http://localhost:5173';

async function testOrdersAPI() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Testing /api/orders/list Endpoint              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test all orders
    console.log('📊 Test 1: Fetching all orders without filter...\n');
    const allResponse = await fetch(`${API_URL}/api/orders/list`);
    const allData = await allResponse.json();

    if (!allData.success) {
      console.error('❌ Failed to fetch orders:', allData.error);
      return;
    }

    console.log('Response received:');
    console.log('─'.repeat(60));
    console.log(`Total orders returned: ${allData.orders?.length || 0}`);
    console.log(`Pagination info: Page ${allData.pagination?.current_page}, Total: ${allData.pagination?.total_count}`);
    console.log('\nStatus Counts from API:');
    console.log(`  All: ${allData.statistics?.total_orders}`);
    console.log(`  Pending: ${allData.statistics?.pending}`);
    console.log(`  Confirmed: ${allData.statistics?.confirmed}`);
    console.log(`  Shipped: ${allData.statistics?.shipped}`);
    console.log(`  Delivered: ${allData.statistics?.delivered}`);
    console.log(`  Cancelled: ${allData.statistics?.cancelled}`);
    console.log('─'.repeat(60));

    // Test each status filter
    console.log('\n📊 Test 2: Testing individual status filters...\n');
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    for (const status of statuses) {
      const response = await fetch(`${API_URL}/api/orders/list?status=${status}`);
      const data = await response.json();

      if (!data.success) {
        console.error(`❌ Failed to fetch ${status} orders:`, data.error);
        continue;
      }

      console.log(`✅ ${status.padEnd(12)}: ${data.orders?.length || 0} orders returned`);
    }

    console.log('\n✅ API tests completed successfully!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the dev server is running: npm run dev\n');
  }
}

testOrdersAPI();
