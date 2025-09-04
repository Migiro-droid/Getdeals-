import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickSeed() {
  console.log('🚀 Quick seeding with corrected data...');
  
  const products = [
    {
      name: "Essential Family Basket",
      price: 2500,
      image: "/essential-basket.jpg",
      category: "baskets",
      description: "Complete family basket with essential items for a week",
      items: ["Rice 2kg", "Maize flour 2kg", "Cooking oil 1L", "Sugar 1kg"]
    },
    {
      name: "Premium Family Basket", 
      price: 4500,
      image: "/family-basket.jpg",
      category: "baskets",
      description: "Premium family basket with high-quality items",
      items: ["Rice 5kg", "Wheat flour 2kg", "Cooking oil 2L", "Sugar 2kg"]
    }
  ];

  for (const product of products) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Failed to insert ${product.name}:`, error.message);
      } else {
        console.log(`✅ Successfully added: ${product.name} (ID: ${data.id})`);
      }
    } catch (error) {
      console.error(`❌ Exception inserting ${product.name}:`, error);
    }
  }

  // Check results
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) {
    console.error('❌ Could not verify products:', error);
  } else {
    console.log(`\n🎉 Total products in database: ${allProducts.length}`);
    allProducts.forEach(p => console.log(`  - ${p.name} (${p.id})`));
  }
}

if (require.main === module) {
  quickSeed().catch(console.error);
}

export { quickSeed };
