/**
 * Quick Seed Script for Supabase Products
 * Run this to populate the database with products
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'] });

// Product data
const products = [
  // Essential Baskets
  {
    id: "essential-basket",
    name: "Essential Basket",
    price: 3000,
    original_price: 3500,
    image: "/essential-basket.jpg",
    category: "essential",
    description: "Perfect for small families with daily essentials"
  },
  {
    id: "mini-essential",
    name: "Mini Essential Basket",
    price: 1800,
    original_price: 2200,
    image: "https://tse1.mm.bing.net/th/id/OIP.JxE6LFyxhq7mmJIFfVMD_wHaE8",
    category: "essential",
    description: "Compact essentials for singles or couples"
  },
  {
    id: "premium-basket",
    name: "Premium Basket",
    price: 4500,
    original_price: 5200,
    image: "/premium-basket.jpg",
    category: "premium",
    description: "Complete food basket for families"
  },
  {
    id: "grains-basket",
    name: "Grains & Cereals Basket",
    price: 2500,
    original_price: 3000,
    image: "/grains-basket.jpg",
    category: "grains",
    description: "Healthy grains and cereals collection"
  },
  {
    id: "beverages-bundle",
    name: "Beverages Bundle",
    price: 1200,
    original_price: 1500,
    image: "/beverages-bundle.jpg",
    category: "beverages",
    description: "Tea, coffee and other beverages"
  },
  {
    id: "snacks-variety",
    name: "Snacks Variety Pack",
    price: 800,
    original_price: 1000,
    image: "/snacks-variety.jpg",
    category: "snacks",
    description: "Assorted snacks for the whole family"
  },
  {
    id: "spices-blend",
    name: "Spices & Seasonings Blend",
    price: 600,
    original_price: 800,
    image: "/spices-blend.jpg",
    category: "spices",
    description: "Premium spices for authentic cooking"
  },
  {
    id: "cooking-oils",
    name: "Cooking Oils Selection",
    price: 950,
    original_price: 1200,
    image: "/cooking-oils.jpg",
    category: "oils",
    description: "Variety of quality cooking oils"
  },
];

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedProducts() {
  console.log('🌱 Starting to seed products to Supabase...');
  console.log(`📝 Found ${products.length} products to seed`);

  try {
    // First check if products table exists and has data
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error accessing products table:', checkError.message);
      console.error('Please ensure the products table exists in Supabase');
      process.exit(1);
    }

    console.log(`✅ Products table accessible`);
    
    // Insert products
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const product of products) {
      try {
        const productData = {
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.originalPrice || null,
          image: product.image,
          category: product.category,
          description: product.description || null,
          items: product.items || [],
          items_detail: product.itemsDetail || null,
          discount: product.discount || null,
          featured: product.featured || false,
          is_hot_deal: product.isHotDeal || false,
          is_new_arrival: product.isNewArrival || false,
          is_special_deal: product.isSpecialDeal || false,
          is_top_basket: product.isTopBasket || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('products')
          .upsert([productData], { onConflict: 'id' })
          .select();

        if (error) {
          console.error(`   ❌ ${product.name}: ${error.message}`);
          errorCount++;
        } else if (data && data.length > 0) {
          console.log(`   ✅ ${product.name}`);
          successCount++;
        } else {
          console.log(`   ⊘ ${product.name} (skipped)`);
          skipCount++;
        }
      } catch (err) {
        console.error(`   ❌ Exception for ${product.name}:`, err);
        errorCount++;
      }
    }

    console.log(`\n📊 Seeding Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⊘ Skipped: ${skipCount}`);

    // Verify seeding
    const { data: allProducts, error: countError } = await supabase
      .from('products')
      .select('id');

    if (!countError) {
      console.log(`\n🎉 Total products in database: ${allProducts?.length || 0}`);
    }

    if (successCount > 0) {
      console.log('✅ Seeding completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️ No products were seeded');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedProducts();
