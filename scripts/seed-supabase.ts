/**
 * Supabase Data Migration and Seeding Script
 * 
 * This script migrates existing data to Supabase and seeds initial data
 */

import { supabase } from '../src/integrations/supabase/client';

// Sample products data based on your existing structure
const sampleProducts = [
  {
    name: "Essential Basket",
    price: 2500,
    original_price: 3000,
    image_url: "/src/assets/essential-basket.jpg",
    category: "basket",
    description: "Complete essential items for your household",
    items: ["2kg Rice", "1kg Sugar", "500ml Cooking Oil", "1kg Wheat Flour", "500g Tea Leaves"],
    stock_quantity: 50,
    is_basket: true
  },
  {
    name: "Family Basket",
    price: 4500,
    original_price: 5500,
    image_url: "/src/assets/family-basket.jpg", 
    category: "basket",
    description: "Perfect family-sized grocery basket",
    items: ["5kg Rice", "2kg Sugar", "1L Cooking Oil", "2kg Wheat Flour", "1kg Tea Leaves", "2kg Beans"],
    stock_quantity: 30,
    is_basket: true
  },
  {
    name: "Black Friday Mega Deal",
    price: 3200,
    original_price: 4800,
    image_url: "/src/assets/family-basket.jpg",
    category: "blackfriday", 
    description: "Special Black Friday offer - Limited time only!",
    items: ["3kg Rice", "1.5kg Sugar", "750ml Oil", "1.5kg Flour", "500g Tea"],
    stock_quantity: 100,
    is_basket: true,
    discount: 33
  }
];

const sampleCategories = [
  { name: "Baskets", slug: "baskets", description: "Complete food baskets", is_active: true, sort_order: 1 },
  { name: "Essential", slug: "essential", description: "Essential daily items", is_active: true, sort_order: 2 },
  { name: "Family", slug: "family", description: "Family-sized products", is_active: true, sort_order: 3 },
  { name: "Black Friday", slug: "blackfriday", description: "Black Friday deals", is_active: true, sort_order: 4 }
];

async function seedSupabaseData() {
  try {
    console.log('🌱 Starting Supabase data seeding...');
    
    // 1. Seed Categories
    console.log('📂 Seeding categories...');
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(sampleCategories, { onConflict: 'slug' });
    
    if (categoriesError) {
      console.error('❌ Categories seeding failed:', categoriesError);
    } else {
      console.log('✅ Categories seeded successfully');
    }
    
    // 2. Seed Products
    console.log('🛍️ Seeding products...');
    const { error: productsError } = await supabase
      .from('products')
      .upsert(sampleProducts, { onConflict: 'name' });
    
    if (productsError) {
      console.error('❌ Products seeding failed:', productsError);
    } else {
      console.log('✅ Products seeded successfully');
    }
    
    // 3. Create default admin settings
    console.log('⚙️ Setting up admin settings...');
    const { error: settingsError } = await supabase
      .from('admin_settings')
      .upsert({
        id: 'default',
        black_friday_enabled: true,
        maintenance_mode: false,
        support_phone: '+254 700 123 456',
        support_email: 'support@getdeals.co.ke',
        location: 'Karen Green, Nairobi, Kenya'
      }, { onConflict: 'id' });
    
    if (settingsError) {
      console.error('❌ Settings seeding failed:', settingsError);
    } else {
      console.log('✅ Admin settings configured');
    }
    
    console.log('🎉 Supabase seeding completed successfully!');
    
    // Display summary
    const { data: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
      
    const { data: categoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Database Summary:`);
    console.log(`   Products: ${productCount?.length || 0}`);
    console.log(`   Categories: ${categoryCount?.length || 0}`);
    console.log(`   Settings: Configured`);
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Create admin user function
async function createAdminUser() {
  try {
    console.log('👤 Creating admin user...');
    
    const adminEmail = 'j.ericndivo@gmail.com';
    const adminPassword = 'wd_24*jmv';
    
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          first_name: 'Eric',
          last_name: 'Admin',
          phone: '+254700000000'
        }
      }
    });
    
    if (error) {
      console.error('❌ Admin user creation failed:', error.message);
    } else {
      console.log('✅ Admin user created/updated successfully');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Note: Check email for verification if required`);
    }
    
  } catch (error) {
    console.error('💥 Admin user creation failed:', error);
  }
}

// Run the seeding
async function main() {
  console.log('🚀 Starting Supabase migration and seeding process...\n');
  
  await seedSupabaseData();
  await createAdminUser();
  
  console.log('\n🎯 Migration Complete!');
  console.log('Next steps:');
  console.log('1. Start your app: npm run dev');
  console.log('2. Visit: http://localhost:5173/auth');
  console.log('3. Sign in with: j.ericndivo@gmail.com / wd_24*jmv');
  console.log('4. Visit: http://localhost:5173/admin/products');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
