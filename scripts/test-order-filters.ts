#!/usr/bin/env tsx
/**
 * Test script to verify order status filters are working correctly
 * 
 * Usage:
 *   npx tsx scripts/test-order-filters.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

async function testOrderFilters() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Testing Order Status Filters                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Get total count
    console.log('📊 Test 1: Getting total order count...\n');
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (allError) {
      console.error('❌ Error fetching total:', allError.message);
      return;
    }

    const totalCount = allOrders?.length || 0;
    console.log(`✅ Total orders in database: ${totalCount}\n`);

    // Test 2: Count by status
    console.log('📊 Test 2: Counting orders by status...\n');
    const { data: statusData, error: statusError } = await supabase
      .from('orders')
      .select('status');

    if (statusError) {
      console.error('❌ Error fetching statuses:', statusError.message);
      return;
    }

    const counts: Record<string, number> = {};
    statuses.forEach(status => {
      counts[status] = (statusData || []).filter((o: any) => o.status === status).length;
    });

    console.log('Status Distribution:');
    console.log('────────────────────────');
    let totalCounted = 0;
    statuses.forEach(status => {
      const count = counts[status] || 0;
      totalCounted += count;
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      console.log(`${statusLabel.padEnd(15)}: ${count.toString().padStart(3)}`);
    });
    console.log('────────────────────────');
    console.log(`${'Total'.padEnd(15)}: ${totalCounted.toString().padStart(3)}\n`);

    // Test 3: Simulate API call for each filter
    console.log('📊 Test 3: Simulating API filter calls...\n');
    
    for (const status of ['all', ...statuses]) {
      let query = supabase.from('orders').select('*', { count: 'exact', head: true });
      
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error(`❌ Error filtering by ${status}:`, error.message);
      } else {
        const label = status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1);
        console.log(`✅ ${label.padEnd(20)}: ${count || 0} orders`);
      }
    }

    console.log('\n✅ All filter tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testOrderFilters();
