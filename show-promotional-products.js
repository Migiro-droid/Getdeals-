/**
 * Show which products have promotional flags set
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function showPromotionalProducts() {
  console.log('🔍 Finding products with promotional flags...\n');

  // Get all products
  const { data: allProducts } = await supabase
    .from('products')
    .select('*');

  if (!allProducts || allProducts.length === 0) {
    console.log('No products found.');
    return;
  }

  console.log(`Total products: ${allProducts.length}\n`);

  // Hot Deals
  const hotDeals = allProducts.filter(p => p.isHotDeal === true);
  console.log(`🔥 HOT DEALS (${hotDeals.length}):`);
  hotDeals.forEach(p => {
    console.log(`   - ${p.name} (${p.category})`);
  });
  if (hotDeals.length === 0) console.log('   (none)');
  console.log('');

  // New Arrivals
  const newArrivals = allProducts.filter(p => p.isNewArrival === true);
  console.log(`✨ NEW ARRIVALS (${newArrivals.length}):`);
  newArrivals.forEach(p => {
    console.log(`   - ${p.name} (${p.category})`);
  });
  if (newArrivals.length === 0) console.log('   (none)');
  console.log('');

  // Special Deals
  const specialDeals = allProducts.filter(p => p.isSpecialDeal === true);
  console.log(`🎁 SPECIAL DEALS (${specialDeals.length}):`);
  specialDeals.forEach(p => {
    console.log(`   - ${p.name} (${p.category})`);
  });
  if (specialDeals.length === 0) console.log('   (none)');
  console.log('');

  // Products with multiple flags (should be ZERO if working correctly)
  const multipleFlags = allProducts.filter(p => 
    [p.isHotDeal, p.isNewArrival, p.isSpecialDeal].filter(Boolean).length > 1
  );
  
  if (multipleFlags.length > 0) {
    console.log(`⚠️  PRODUCTS WITH MULTIPLE FLAGS (${multipleFlags.length}) - THIS IS THE BUG:`);
    multipleFlags.forEach(p => {
      const flags = [];
      if (p.isHotDeal) flags.push('Hot Deal');
      if (p.isNewArrival) flags.push('New Arrival');
      if (p.isSpecialDeal) flags.push('Special Deal');
      console.log(`   - ${p.name}: ${flags.join(', ')}`);
    });
    console.log('');
    console.log('💡 These products should only have ONE promotional flag set, not multiple!');
  } else {
    console.log('✅ No products have multiple promotional flags (good!)');
  }
}

showPromotionalProducts();
