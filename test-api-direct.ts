import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSupabaseAPIs() {
  console.log('🧪 Testing Supabase APIs with admin keys...');

  const supabaseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Test 1: Product API
  console.log('\n1️⃣ Testing Product API...');
  try {
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(3);
    
    if (productError) {
      console.log('❌ Product API failed:', productError.message);
    } else {
      console.log('✅ Product API successful! Found', products?.length, 'products');
      if (products && products.length > 0) {
        console.log('   Sample products:');
        products.forEach((p: any) => {
          console.log(`     - ${p.name} (${p.category}) - KSh ${p.price}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Product API error:', error);
  }

  // Test 2: Category API
  console.log('\n2️⃣ Testing Category API...');
  try {
    const { data: categories, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });
    
    if (categoryError) {
      console.log('❌ Category API failed:', categoryError.message);
    } else {
      console.log('✅ Category API successful! Found', categories?.length, 'categories');
      if (categories && categories.length > 0) {
        console.log('   Sample categories:');
        categories.slice(0, 8).forEach((cat: any) => {
          console.log(`     - ${cat.name} (${cat.slug})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Category API error:', error);
  }

  console.log('\n🎉 API testing completed!');
  console.log('📝 If both APIs work, the admin products page should load correctly.');
  console.log('🌐 Try visiting: http://localhost:8081/admin/products');
}

testSupabaseAPIs();
