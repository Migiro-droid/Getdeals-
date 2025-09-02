import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const supabaseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZUI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Investigating database permissions...');

  // Test 1: Check Prisma access
  console.log('\n1️⃣ Testing Prisma access...');
  try {
    const products = await prisma.product.findMany({
      take: 3,
      select: { id: true, name: true, category: true, price: true }
    });
    console.log('✅ Prisma access successful! Found', products.length, 'products:');
    products.forEach(p => {
      console.log(`   - ${p.name} (${p.category}) - KSh ${p.price}`);
    });
  } catch (error) {
    console.log('❌ Prisma access failed:', error);
  }

  // Test 2: Check Supabase access
  console.log('\n2️⃣ Testing Supabase access...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, price')
      .limit(3);
    
    if (error) {
      console.log('❌ Supabase access failed:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('✅ Supabase access successful! Found', data.length, 'products');
    }
  } catch (error) {
    console.log('❌ Supabase access error:', error);
  }

  // Test 3: Check database connection details
  console.log('\n3️⃣ Database connection info...');
  console.log('   Supabase URL:', supabaseUrl);
  console.log('   Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  // Test 4: Try to create a simple product via Prisma
  console.log('\n4️⃣ Testing product creation via Prisma...');
  try {
    const testProduct = await prisma.product.create({
      data: {
        id: 'permission-test-product',
        name: 'Permission Test Product',
        price: 1000,
        image: '/test.jpg',
        category: 'groceries',
        description: 'Testing permissions'
      }
    });
    console.log('✅ Product creation successful:', testProduct.name);
    
    // Clean up
    await prisma.product.delete({
      where: { id: 'permission-test-product' }
    });
    console.log('✅ Test product cleaned up');
    
  } catch (error) {
    console.log('❌ Product creation failed:', error);
  }

  console.log('\n📊 Summary:');
  console.log('   If Prisma works but Supabase doesn\'t, it\'s an RLS issue');
  console.log('   If both fail, it\'s a database connection issue');
  console.log('   If both work, the issue is in the frontend API calls');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Investigation completed!');
  })
  .catch(async (e) => {
    console.error('\n❌ Investigation failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
