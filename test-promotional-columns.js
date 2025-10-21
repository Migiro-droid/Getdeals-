/**
 * Test script to check if promotional columns exist in the database
 * and show current values for existing products
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPromotionalColumns() {
  console.log('🔍 Testing promotional columns in products table...\n');

  try {
    // Try to fetch products with promotional columns
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, isHotDeal, isNewArrival, isSpecialDeal')
      .limit(10);

    if (error) {
      console.error('❌ Error querying products:', error.message);
      console.error('\n💡 This likely means the promotional columns do not exist in the database.');
      console.error('📋 Please run the migration SQL in Supabase dashboard:\n');
      console.error('   File: supabase/migrations/20251020_add_promotional_flags.sql\n');
      return;
    }

    console.log(`✅ Promotional columns exist! Found ${data?.length || 0} products:\n`);

    if (data && data.length > 0) {
      // Show products with promotional flags
      const hotDeals = data.filter(p => p.isHotDeal);
      const newArrivals = data.filter(p => p.isNewArrival);
      const specialDeals = data.filter(p => p.isSpecialDeal);

      console.log('📊 Promotional Distribution:');
      console.log(`   🔥 Hot Deals: ${hotDeals.length} products`);
      console.log(`   ✨ New Arrivals: ${newArrivals.length} products`);
      console.log(`   🎁 Special Deals: ${specialDeals.length} products`);
      console.log('');

      console.log('📋 Sample Products:\n');
      data.slice(0, 5).forEach(product => {
        console.log(`   ${product.name}`);
        console.log(`      Category: ${product.category}`);
        console.log(`      Hot Deal: ${product.isHotDeal ? '✅' : '❌'}`);
        console.log(`      New Arrival: ${product.isNewArrival ? '✅' : '❌'}`);
        console.log(`      Special Deal: ${product.isSpecialDeal ? '✅' : '❌'}`);
        console.log('');
      });

      if (hotDeals.length === 0 && newArrivals.length === 0 && specialDeals.length === 0) {
        console.log('⚠️  No products have promotional flags set yet.');
        console.log('💡 Edit products in the admin panel and check the promotional sections.\n');
      }
    } else {
      console.log('⚠️  No products found in the database.\n');
    }

    // Test update capability
    console.log('🧪 Testing promotional flag update...\n');
    if (data && data.length > 0) {
      const testProduct = data[0];
      console.log(`   Testing with product: ${testProduct.name}`);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ isHotDeal: true })
        .eq('id', testProduct.id);

      if (updateError) {
        console.error('   ❌ Update failed:', updateError.message);
        console.error('   💡 This might be an RLS (Row Level Security) permission issue.\n');
      } else {
        console.log('   ✅ Update successful! Promotional flags can be saved.\n');
        
        // Revert the test change
        await supabase
          .from('products')
          .update({ isHotDeal: testProduct.isHotDeal })
          .eq('id', testProduct.id);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPromotionalColumns();
