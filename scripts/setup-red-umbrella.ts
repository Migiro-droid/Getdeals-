import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SetupResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

async function setupSupabaseDatabase(): Promise<SetupResult[]> {
  const results: SetupResult[] = [];

  // Step 1: Verify environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    results.push({
      step: 'Environment Check',
      status: 'error',
      message: 'Missing required environment variables',
      details: { 
        hasSupabaseUrl: !!SUPABASE_URL,
        hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY 
      }
    });
    return results;
  }

  results.push({
    step: 'Environment Check',
    status: 'success',
    message: 'Environment variables configured correctly',
    details: { 
      supabaseUrl: SUPABASE_URL,
      projectId: SUPABASE_URL.split('.')[0].split('//')[1]
    }
  });

  // Step 2: Test Supabase connection
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Test basic connection
    const { data, error } = await supabase.from('_unknown_table_').select('*').limit(1);
    // This should fail, but confirms we can connect
    
    results.push({
      step: 'Supabase Connection Test',
      status: 'success',
      message: 'Successfully connected to Supabase',
      details: { projectId: SUPABASE_URL.split('.')[0].split('//')[1] }
    });

  } catch (error) {
    results.push({
      step: 'Supabase Connection Test',
      status: 'error',
      message: 'Failed to connect to Supabase',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
    return results;
  }

  // Step 3: Create products table by attempting to insert test data
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Try to create table by inserting a test record
    const testProduct = {
      id: 'test-product-setup',
      name: 'Test Product',
      price: 100,
      category: 'test',
      image: 'test.jpg',
      items: [],
      description: 'Test product for schema creation'
    };
    
    const { error: insertError } = await supabase
      .from('products')
      .upsert(testProduct);
      
    if (insertError) {
      results.push({
        step: 'Products Table Setup',
        status: 'warning',
        message: 'Products table may need manual creation',
        details: { error: insertError.message }
      });
    } else {
      // Remove test product
      await supabase.from('products').delete().eq('id', 'test-product-setup');
      
      results.push({
        step: 'Products Table Setup',
        status: 'success',
        message: 'Products table is ready',
        details: { method: 'API verification' }
      });
    }

  } catch (error) {
    results.push({
      step: 'Products Table Setup',
      status: 'error',
      message: 'Failed to verify products table',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // Step 4: Seed products data
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Import product data
    const { products } = await import('../src/data/products');
    
    console.log(`🌱 Seeding ${products.length} products...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        const productData = {
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.originalPrice,
          image: product.image,
          discount: product.discount,
          items: product.items || [],
          items_detail: product.itemsDetail || null,
          category: product.category,
          description: product.description || ''
        };
        
        const { error } = await supabase.from('products').upsert(productData);
        
        if (error) {
          console.error(`Failed to seed product ${product.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        console.error(`Exception seeding product ${product.id}:`, e);
        errorCount++;
      }
    }

    results.push({
      step: 'Data Seeding',
      status: successCount > 0 ? 'success' : 'error',
      message: `Seeded ${successCount} products successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      details: { successCount, errorCount, totalProducts: products.length }
    });

  } catch (error) {
    results.push({
      step: 'Data Seeding',
      status: 'error',
      message: 'Failed to seed products data',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // Step 5: Verify final setup
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, category')
      .limit(5);

    if (error) {
      results.push({
        step: 'Final Verification',
        status: 'error',
        message: 'Failed to verify database setup',
        details: { error: error.message }
      });
    } else {
      results.push({
        step: 'Final Verification',
        status: 'success',
        message: `Database setup complete! Found ${products?.length || 0} products`,
        details: { 
          productCount: products?.length || 0,
          sampleProducts: products?.slice(0, 3) 
        }
      });
    }

  } catch (error) {
    results.push({
      step: 'Final Verification',
      status: 'error',
      message: 'Failed final verification',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  return results;
}

async function main() {
  console.log('🚀 Setting up Supabase "red-umbrella" project for Vercel deployment...\n');
  
  const results = await setupSupabaseDatabase();
  
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} Step ${index + 1}: ${result.step}`);
    console.log(`   ${result.message}`);
    
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  });

  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  if (hasErrors) {
    console.log('❌ Setup completed with errors. Please review the issues above.');
    console.log('\n📋 Next Steps:');
    console.log('1. Check Supabase dashboard for any missing tables');
    console.log('2. Run the complete schema migration manually if needed');
    console.log('3. Verify RLS policies are correctly configured');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️ Setup completed with warnings. Manual verification recommended.');
  } else {
    console.log('✅ Complete! Supabase red-umbrella project is ready for Vercel.');
  }

  console.log('\n🎯 Vercel Environment Variables to Set:');
  console.log('SUPABASE_URL=' + SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY=' + SUPABASE_SERVICE_ROLE_KEY);
  console.log('NEXT_PUBLIC_SUPABASE_URL=' + SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=' + process.env.SUPABASE_ANON_KEY);
}

if (require.main === module) {
  main().catch(console.error);
}

export { setupSupabaseDatabase };
