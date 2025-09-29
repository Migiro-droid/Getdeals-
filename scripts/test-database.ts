import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function testPrismaConnection() {
  console.log('🧪 Testing Prisma database connection...\n');
  
  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully!\n');
    
    // Test 2: Count products
    console.log('2️⃣ Counting products...');
    const productCount = await prisma.product.count();
    console.log(`✅ Found ${productCount} products in database\n`);
    
    // Test 3: Get sample products
    console.log('3️⃣ Fetching sample products...');
    const sampleProducts = await prisma.product.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        price: true,
        category: true
      }
    });
    
    console.log('✅ Sample products:');
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - KSh ${product.price} (${product.category})`);
    });
    console.log('');
    
    // Test 4: Count users
    console.log('4️⃣ Checking users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database\n`);
    
    // Test 5: Count categories
    console.log('5️⃣ Checking categories...');
    const categoryCount = await prisma.category.count();
    console.log(`✅ Found ${categoryCount} categories in database\n`);
    
    console.log('🎉 All database tests passed!');
    console.log('� Summary:');
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Categories: ${categoryCount}`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check your .env file has correct database URLs');
    console.log('2. Verify Supabase project is accessible');
    console.log('3. Run: npx prisma db push --force-reset');
    console.log('4. Run: npx prisma db seed');
  } finally {
    await prisma.$disconnect();
  }
}

async function testSupabaseAPI() {
  console.log('\n🔗 Testing Supabase API connection...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Missing Supabase environment variables');
    return;
  }
  
  try {
    // Test direct API call
    const response = await fetch(`${supabaseUrl}/rest/v1/Product?select=*&limit=1`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Supabase API is accessible');
      console.log(`✅ Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`❌ Supabase API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Failed to connect to Supabase API:', error);
  }
}

if (require.main === module) {
  Promise.resolve()
    .then(testPrismaConnection)
    .then(testSupabaseAPI)
    .catch(console.error);
}
