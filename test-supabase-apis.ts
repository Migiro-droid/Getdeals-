import { productAPI, categoryAPI } from './lib/supabase';

async function testSupabaseAPIs() {
  console.log('🧪 Testing Supabase APIs with admin keys...');

  // Test 1: Product API
  console.log('\n1️⃣ Testing Product API...');
  try {
    const { data: products, error: productError } = await productAPI.getAll();
    
    if (productError) {
      console.log('❌ Product API failed:', productError.message);
    } else {
      console.log('✅ Product API successful! Found', products?.length, 'products');
      if (products && products.length > 0) {
        console.log('   Sample:', products[0].name);
      }
    }
  } catch (error) {
    console.log('❌ Product API error:', error);
  }

  // Test 2: Category API
  console.log('\n2️⃣ Testing Category API...');
  try {
    const { data: categories, error: categoryError } = await categoryAPI.getAll();
    
    if (categoryError) {
      console.log('❌ Category API failed:', categoryError.message);
    } else {
      console.log('✅ Category API successful! Found', categories?.length, 'categories');
      if (categories && categories.length > 0) {
        console.log('   Sample categories:');
        categories.slice(0, 5).forEach(cat => {
          console.log(`     - ${cat.name} (${cat.slug})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Category API error:', error);
  }

  console.log('\n🎉 API testing completed!');
  console.log('📝 If both APIs work, the admin products page should load correctly.');
}

testSupabaseAPIs();
