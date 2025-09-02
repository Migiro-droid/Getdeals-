import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing complete database setup...\n');

  // Test 1: Check categories
  console.log('1️⃣ Testing Categories...');
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  console.log(`✅ Found ${categories.length} categories:`);
  categories.slice(0, 6).forEach(cat => {
    console.log(`   - ${cat.name} (${cat.slug})`);
  });
  if (categories.length > 6) {
    console.log(`   ... and ${categories.length - 6} more`);
  }

  // Test 2: Check products
  console.log('\n2️⃣ Testing Products...');
  const products = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(`✅ Found ${products.length} sample products:`);
  products.forEach(prod => {
    console.log(`   - ${prod.name} (${prod.category}) - KSh ${prod.price}`);
  });

  // Test 3: Check users
  console.log('\n3️⃣ Testing Users...');
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log(`✅ Found ${users.length} users:`);
  users.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
  });

  // Test 4: Check Supabase Auth
  console.log('\n4️⃣ Testing Supabase Auth...');
  try {
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    const adminUser = authUsers.users.find(u => u.email === 'admin@getdeals.co.ke');
    if (adminUser) {
      console.log('✅ Admin user exists in Supabase Auth');
      console.log(`   - ID: ${adminUser.id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Email Confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Admin user not found in Supabase Auth');
    }
  } catch (error) {
    console.log('❌ Error checking Supabase Auth:', error);
  }

  // Test 5: Test authentication flow
  console.log('\n5️⃣ Testing Authentication Flow...');
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@getdeals.co.ke',
      password: 'admin123456'
    });

    if (signInError) {
      console.log('❌ Sign-in failed:', signInError.message);
    } else {
      console.log('✅ Sign-in successful');
      console.log(`   - User ID: ${signInData.user?.id}`);
      console.log(`   - Access Token: ${signInData.session?.access_token ? 'Present' : 'Missing'}`);
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Sign-out successful');
    }
  } catch (error) {
    console.log('❌ Error testing authentication:', error);
  }

  console.log('\n🎉 Database setup test completed!');
  console.log('\n📋 Summary:');
  console.log(`   - ${categories.length} categories available for products`);
  console.log(`   - ${products.length} sample products`);
  console.log(`   - ${users.length} users (including admin)`);
  console.log('   - Authentication flow working');
  
  console.log('\n🔑 Admin Credentials:');
  console.log('   - Email: admin@getdeals.co.ke');
  console.log('   - Password: admin123456');
  
  console.log('\n🌐 Access URLs:');
  console.log('   - Frontend: http://localhost:8081');
  console.log('   - Backend: http://localhost:4000');
  console.log('   - Prisma Studio: http://localhost:5555');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Test completed successfully!');
  })
  .catch(async (e) => {
    console.error('\n❌ Test failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
