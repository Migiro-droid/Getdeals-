import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

interface VerificationResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

async function verifySupabaseConnection(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Step 1: Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    results.push({
      step: 'Environment Variables Check',
      status: 'error',
      message: 'SUPABASE_URL is not set',
      details: { 
        required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
        current: { supabaseUrl, hasServiceRole: !!supabaseServiceRoleKey }
      }
    });
    return results;
  }

  if (!supabaseServiceRoleKey) {
    results.push({
      step: 'Environment Variables Check',
      status: 'error',
      message: 'SUPABASE_SERVICE_ROLE_KEY is not set',
      details: { 
        required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
        current: { supabaseUrl, hasServiceRole: !!supabaseServiceRoleKey }
      }
    });
    return results;
  }

  results.push({
    step: 'Environment Variables Check',
    status: 'success',
    message: 'All required environment variables are set',
    details: {
      supabaseUrl,
      hasServiceRoleKey: true,
      hasAnonKey: !!supabaseAnonKey
    }
  });

  // Step 2: Test Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Test basic connection with a simple query
    const { data, error } = await supabase.from('products').select('count').limit(1);
    
    if (error) {
      results.push({
        step: 'Database Connection Test',
        status: 'error',
        message: 'Failed to connect to Supabase database',
        details: { error: error.message, code: error.code }
      });
      return results;
    }

    results.push({
      step: 'Database Connection Test',
      status: 'success',
      message: 'Successfully connected to Supabase database'
    });

  } catch (error) {
    results.push({
      step: 'Database Connection Test',
      status: 'error',
      message: 'Connection failed with exception',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
    return results;
  }

  // Step 3: Check if tables exist
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const tablesToCheck = ['products', 'users', 'orders', 'categories'];
    const tableResults: Record<string, boolean> = {};

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        tableResults[table] = !error;
      } catch {
        tableResults[table] = false;
      }
    }

    const missingTables = Object.entries(tableResults)
      .filter(([_, exists]) => !exists)
      .map(([table]) => table);

    if (missingTables.length > 0) {
      results.push({
        step: 'Schema Verification',
        status: 'warning',
        message: `Some tables are missing: ${missingTables.join(', ')}`,
        details: { tableResults, missingTables }
      });
    } else {
      results.push({
        step: 'Schema Verification',
        status: 'success',
        message: 'All required tables exist',
        details: { tableResults }
      });
    }

  } catch (error) {
    results.push({
      step: 'Schema Verification',
      status: 'error',
      message: 'Failed to verify database schema',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  // Step 4: Test CRUD operations
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Test read operation
    const { data: products, error: readError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (readError) {
      results.push({
        step: 'CRUD Operations Test',
        status: 'error',
        message: 'Failed to read from products table',
        details: { error: readError.message }
      });
      return results;
    }

    results.push({
      step: 'CRUD Operations Test',
      status: 'success',
      message: `Successfully read ${products?.length || 0} products from database`,
      details: { productCount: products?.length || 0 }
    });

  } catch (error) {
    results.push({
      step: 'CRUD Operations Test',
      status: 'error',
      message: 'CRUD operations test failed',
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  return results;
}

async function main() {
  console.log('🔍 Verifying Supabase connection for red-umbrella project...\n');
  
  const results = await verifySupabaseConnection();
  
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
    console.log('❌ Connection verification failed. Please fix the errors above.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️ Connection verified with warnings. Consider running migrations.');
  } else {
    console.log('✅ All checks passed! Supabase connection is working correctly.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { verifySupabaseConnection };
