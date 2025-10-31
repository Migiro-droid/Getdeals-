/**
 * Check if a specific order exists in the database
 * 
 * Usage:
 *   npx tsx scripts/check-order.ts ORD-1761846167882-SULH
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  if (!supabaseUrl) console.error('   VITE_SUPABASE_URL not set');
  if (!supabaseKey) console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY not set');
  console.error('\n💡 Make sure .env.local or .env file exists in project root');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder(orderReference: string): Promise<void> {
  console.log(`\n🔍 Searching for order: ${orderReference}\n`);

  try {
    // Search by exact order_reference
    const { data: exactMatch, error: exactError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderReference)
      .single();

    if (exactMatch && !exactError) {
      console.log('✅ FOUND - Exact Match!\n');
      console.log('Order Details:');
      console.log('─'.repeat(60));
      console.log(`Order Reference: ${exactMatch.order_reference}`);
      console.log(`Order ID: ${exactMatch.id}`);
      console.log(`Customer Name: ${exactMatch.customer_name || 'N/A'}`);
      console.log(`Customer Phone: ${exactMatch.customer_phone || 'N/A'}`);
      console.log(`Customer Email: ${exactMatch.customer_email || 'N/A'}`);
      console.log(`Total Amount: KES ${exactMatch.total_amount_kes || exactMatch.total || 0}`);
      console.log(`Status: ${exactMatch.status}`);
      console.log(`Payment Status: ${exactMatch.payment_status || 'N/A'}`);
      console.log(`Payment Method: ${exactMatch.payment_method || 'N/A'}`);
      console.log(`Created At: ${new Date(exactMatch.created_at).toLocaleString()}`);
      console.log(`Items: ${exactMatch.order_items?.length || 0} items`);
      console.log('─'.repeat(60));
      return;
    }

    // Try partial search with LIKE
    console.log('No exact match found. Trying partial search...\n');
    
    const { data: partialMatches, error: partialError } = await supabase
      .from('orders')
      .select('order_reference, customer_name, total_amount_kes, status, created_at')
      .or(`order_reference.ilike.%${orderReference}%`)
      .limit(10);

    if (partialError) {
      console.log(`❌ Search error: ${partialError.message}`);
      return;
    }

    if (!partialMatches || partialMatches.length === 0) {
      console.log('❌ NOT FOUND - No orders matching this reference.\n');
      console.log('Possible reasons:');
      console.log('  • Order doesn\'t exist in database');
      console.log('  • Order reference is spelled differently');
      console.log('  • Order was deleted or archived\n');
      
      // Show sample orders
      console.log('Sample recent orders for reference:');
      const { data: sampleOrders } = await supabase
        .from('orders')
        .select('order_reference, customer_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (sampleOrders && sampleOrders.length > 0) {
        console.log('─'.repeat(60));
        sampleOrders.forEach((order: any, idx: number) => {
          console.log(`${idx + 1}. ${order.order_reference}`);
        });
        console.log('─'.repeat(60));
      }
      return;
    }

    console.log(`✅ FOUND ${partialMatches.length} matching order(s):\n`);
    console.log('─'.repeat(80));
    partialMatches.forEach((order: any, idx: number) => {
      console.log(`${idx + 1}. Order Reference: ${order.order_reference}`);
      console.log(`   Customer: ${order.customer_name || 'N/A'}`);
      console.log(`   Amount: KES ${order.total_amount_kes || 0}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
      if (idx < partialMatches.length - 1) console.log('');
    });
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function listAllOrderReferences(): Promise<void> {
  console.log('\n📋 All Order References in Database:\n');
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_reference, customer_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.log(`Error: ${error.message}`);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('No orders found in database.');
      return;
    }

    console.log('─'.repeat(100));
    console.log('Order Reference'.padEnd(40) + ' | ' + 'Customer'.padEnd(25) + ' | Status'.padEnd(12) + ' | Created');
    console.log('─'.repeat(100));

    orders.forEach((order: any) => {
      const ref = (order.order_reference || 'N/A').substring(0, 38);
      const customer = (order.customer_name || 'N/A').substring(0, 23);
      const status = (order.status || 'N/A').substring(0, 10);
      const created = new Date(order.created_at).toLocaleDateString();
      
      console.log(
        ref.padEnd(40) + ' | ' +
        customer.padEnd(25) + ' | ' +
        status.padEnd(12) + ' | ' +
        created
      );
    });
    console.log('─'.repeat(100));
    console.log(`Total: ${orders.length} orders (showing latest 20)`);

  } catch (error) {
    console.error('Error:', error);
  }
}

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Order Database Lookup & Verification              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check the specific order
  const orderToCheck = 'ORD-1761846167882-SULH';
  await checkOrder(orderToCheck);

  // List all available orders
  await listAllOrderReferences();
}

main().catch(console.error);
