import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample products data
const sampleProducts = [
  {
    name: "Essential Family Basket",
    price: 2500,
    originalPrice: 3000,
    image: "/essential-basket.jpg",
    category: "baskets",
    description: "Complete family basket with essential items for a week",
    items: ["Rice 2kg", "Maize flour 2kg", "Cooking oil 1L", "Sugar 1kg", "Tea leaves 250g"]
  },
  {
    name: "Premium Family Basket",
    price: 4500,
    originalPrice: 5500,
    image: "/family-basket.jpg",
    category: "baskets",
    description: "Premium family basket with high-quality items",
    items: ["Rice 5kg", "Wheat flour 2kg", "Cooking oil 2L", "Sugar 2kg", "Tea leaves 500g", "Milk 1L"]
  },
  {
    name: "Student Essentials Pack",
    price: 1200,
    originalPrice: 1500,
    image: "/placeholder.svg",
    category: "school",
    description: "Essential items for students",
    items: ["Rice 1kg", "Maize flour 1kg", "Cooking oil 500ml", "Sugar 500g"]
  },
  {
    name: "Holiday Special Basket",
    price: 6000,
    originalPrice: 7500,
    image: "/placeholder.svg",
    category: "holiday",
    description: "Special holiday basket for celebrations",
    items: ["Rice 5kg", "Wheat flour 2kg", "Cooking oil 2L", "Sugar 2kg", "Meat 2kg", "Vegetables"]
  },
  {
    name: "Black Friday Deal - Mega Basket",
    price: 3500,
    originalPrice: 5000,
    image: "/placeholder.svg",
    category: "blackfriday",
    description: "Massive savings on our mega family basket",
    items: ["Rice 5kg", "Maize flour 5kg", "Cooking oil 2L", "Sugar 3kg", "Tea 500g", "Salt 1kg"]
  }
];

async function seedProducts() {
  console.log('🌱 Starting to seed products...');
  
  try {
    // First, check if we can connect to the database
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      console.log('💡 Make sure you have executed the schema script in Supabase SQL Editor first!');
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Clear existing products (optional)
    console.log('🧹 Clearing existing products...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.warn('⚠️ Could not clear existing products:', deleteError.message);
    }
    
    // Insert sample products
    console.log('📦 Inserting sample products...');
    
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      console.log(`   Adding product ${i + 1}/${sampleProducts.length}: ${product.name}`);
      
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) {
        console.error(`   ❌ Failed to insert ${product.name}:`, error.message);
      } else {
        console.log(`   ✅ Successfully added: ${data.name}`);
      }
    }
    
    // Verify the seeding
    const { data: allProducts, error: countError } = await supabase
      .from('products')
      .select('*');
    
    if (countError) {
      console.error('❌ Failed to verify products:', countError.message);
    } else {
      console.log(`\n🎉 Seeding completed! Total products in database: ${allProducts.length}`);
      console.log('\n📋 Products seeded:');
      allProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - KSh ${product.price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Seeding failed with exception:', error);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedProducts().catch(console.error);
}

export { seedProducts };
