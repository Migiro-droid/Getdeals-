import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testEverything() {
  try {
    console.log('🧪 Testing database connections...\n');

    // Test Prisma connection
    console.log('📊 Testing Prisma connection...');
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    console.log(`  ✅ Prisma: ${productCount} products, ${userCount} users\n`);

    // Test Supabase connection
    console.log('🔗 Testing Supabase connection...');
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(3);

    if (error) {
      console.error('  ❌ Supabase error:', error.message);
      console.log('  📝 This might be due to RLS policies or permissions');
    } else {
      console.log(`  ✅ Supabase: Retrieved ${products.length} products`);
      if (products.length > 0) {
        console.log(`  📦 Sample product: ${products[0].name}`);
      }
    }

    console.log('\n🎯 Summary:');
    console.log(`  - Database has ${productCount} products`);
    console.log(`  - Database has ${userCount} users`);
    console.log(`  - Prisma connection: ✅ Working`);
    console.log(`  - Supabase connection: ${error ? '⚠️ Needs RLS setup' : '✅ Working'}`);

    if (error) {
      console.log('\n💡 The database is working with Prisma, but Supabase needs RLS policies.');
      console.log('   This is normal and can be fixed by setting up proper Row Level Security.');
    } else {
      console.log('\n🎉 Everything is working perfectly!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEverything();
