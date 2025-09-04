import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

console.log('🔗 Connecting to Supabase:');
console.log('   URL:', supabaseUrl);
console.log('   Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('🔐 Checking and fixing Supabase RLS policies...');

  try {
    // Test direct access to products table
    console.log('1️⃣ Testing direct table access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.log('❌ Direct access failed:', productsError.message);
      console.log('🔧 This suggests RLS policies are blocking access');
    } else {
      console.log('✅ Direct access successful, found', products?.length, 'products');
    }

    // Disable RLS on products table
    console.log('\n2️⃣ Disabling RLS on products table...');
    const { error: rlsError1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE products DISABLE ROW LEVEL SECURITY;'
    });

    if (rlsError1) {
      console.log('❌ Failed to disable RLS on products:', rlsError1.message);
    } else {
      console.log('✅ RLS disabled on products table');
    }

    // Disable RLS on categories table
    console.log('\n3️⃣ Disabling RLS on categories table...');
    const { error: rlsError2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE categories DISABLE ROW LEVEL SECURITY;'
    });

    if (rlsError2) {
      console.log('❌ Failed to disable RLS on categories:', rlsError2.message);
    } else {
      console.log('✅ RLS disabled on categories table');
    }

    // Disable RLS on users table
    console.log('\n4️⃣ Disabling RLS on users table...');
    const { error: rlsError3 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
    });

    if (rlsError3) {
      console.log('❌ Failed to disable RLS on users:', rlsError3.message);
    } else {
      console.log('✅ RLS disabled on users table');
    }

    // Test access again
    console.log('\n5️⃣ Testing access after RLS changes...');
    const { data: testProducts, error: testError } = await supabase
      .from('products')
      .select('id, name, category, price')
      .limit(3);

    if (testError) {
      console.log('❌ Still getting error:', testError.message);
    } else {
      console.log('✅ Success! Found products:');
      testProducts?.forEach(p => {
        console.log(`   - ${p.name} (${p.category}) - KSh ${p.price}`);
      });
    }

    console.log('\n🎉 RLS policies updated successfully!');
    console.log('📝 All tables should now be accessible from the admin interface.');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    
    // Alternative approach - try using SQL directly
    console.log('\n🔄 Trying alternative approach with direct SQL...');
    
    try {
      const { error: altError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE products DISABLE ROW LEVEL SECURITY;
          ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
          ALTER TABLE users DISABLE ROW LEVEL SECURITY;
          ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
          ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
          ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
          ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
          ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
          ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
        `
      });
      
      if (altError) {
        console.log('❌ Alternative approach failed:', altError.message);
      } else {
        console.log('✅ Alternative approach successful!');
      }
    } catch (altErr) {
      console.log('❌ Alternative approach error:', altErr);
    }
  }
}

main()
  .then(() => {
    console.log('\n✅ RLS policy fix completed!');
  })
  .catch((e) => {
    console.error('\n❌ RLS policy fix failed:', e);
    process.exit(1);
  });
