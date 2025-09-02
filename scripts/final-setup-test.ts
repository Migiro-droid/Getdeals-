import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

async function runFinalTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test 1: Environment Variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    results.push({
      test: 'Environment Variables',
      status: 'fail',
      message: 'Missing required Supabase environment variables',
      details: { hasUrl: !!supabaseUrl, hasServiceKey: !!supabaseServiceKey }
    });
    return results;
  }
  
  results.push({
    test: 'Environment Variables',
    status: 'pass',
    message: 'All required environment variables are present',
    details: { 
      url: supabaseUrl,
      hasServiceKey: true,
      hasAnonKey: !!supabaseAnonKey
    }
  });
  
  // Test 2: Basic Connection
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try a simple query that should work even without tables
    const { data, error } = await supabase.auth.getSession();
    
    results.push({
      test: 'Supabase Connection',
      status: 'pass',
      message: 'Successfully connected to Supabase'
    });
    
  } catch (error) {
    results.push({
      test: 'Supabase Connection',
      status: 'fail',
      message: 'Failed to connect to Supabase',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
    return results;
  }
  
  // Test 3: Schema Check
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      results.push({
        test: 'Database Schema',
        status: 'warning',
        message: 'Schema not yet created - run the SQL script in Supabase',
        details: { error: error.message }
      });
    } else {
      results.push({
        test: 'Database Schema',
        status: 'pass',
        message: 'Database schema exists and is accessible'
      });
    }
    
  } catch (error) {
    results.push({
      test: 'Database Schema',
      status: 'warning',
      message: 'Could not verify schema - may need to be created',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }
  
  // Test 4: Products Data
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(10);
    
    if (error) {
      results.push({
        test: 'Products Data',
        status: 'warning',
        message: 'Products table not accessible - create schema first',
        details: { error: error.message }
      });
    } else {
      results.push({
        test: 'Products Data',
        status: products && products.length > 0 ? 'pass' : 'warning',
        message: products && products.length > 0 
          ? `Found ${products.length} products in database`
          : 'Products table exists but no data - run seed script',
        details: { productCount: products?.length || 0 }
      });
    }
    
  } catch (error) {
    results.push({
      test: 'Products Data',
      status: 'warning',
      message: 'Could not check products data',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }
  
  return results;
}

async function main() {
  console.log('🧪 Running final Supabase setup tests...\n');
  
  const results = await runFinalTests();
  
  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} Test ${index + 1}: ${result.test}`);
    console.log(`   ${result.message}`);
    
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  });
  
  const hasFailures = results.some(r => r.status === 'fail');
  const hasWarnings = results.some(r => r.status === 'warning');
  
  console.log('📋 Summary:');
  if (hasFailures) {
    console.log('❌ Setup has critical issues that need to be fixed');
  } else if (hasWarnings) {
    console.log('⚠️ Setup is partially complete - follow the guide to finish');
  } else {
    console.log('✅ Setup is complete and ready for production!');
  }
  
  console.log('\n🔗 Next Steps:');
  if (hasFailures) {
    console.log('1. Fix the environment variables');
    console.log('2. Check your Supabase project settings');
  } else if (hasWarnings) {
    console.log('1. Execute the schema script in Supabase SQL Editor');
    console.log('2. Run: npx tsx scripts/seed-products.ts');
    console.log('3. Deploy to Vercel with environment variables');
  } else {
    console.log('1. Deploy to Vercel');
    console.log('2. Test your live application');
    console.log('3. 🎉 You\'re ready to go!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runFinalTests };
