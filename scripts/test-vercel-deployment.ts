import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';

// Load environment variables
config();

async function testApiEndpoints() {
  console.log('🧪 Testing API endpoints for Vercel deployment...\n');

  // Import the main API handler
  const { default: handler } = await import('../api/index');

  // Mock Vercel request/response objects
  function createMockRequest(method: string, url: string, body?: any): VercelRequest {
    return {
      method,
      url,
      body,
      headers: {},
      query: {},
    } as VercelRequest;
  }

  function createMockResponse(): VercelResponse {
    let statusCode = 200;
    let responseData: any;
    let headers: Record<string, string> = {};

    return {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      },
      setHeader: (name: string, value: string) => {
        headers[name] = value;
        return mockRes;
      },
      end: () => mockRes,
      getStatus: () => statusCode,
      getBody: () => responseData,
      getHeaders: () => headers,
    } as any;
  }

  const mockRes = createMockResponse();

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: '/api/health',
    },
    {
      name: 'Get Products',
      method: 'GET', 
      url: '/api/products',
    },
    {
      name: 'Database Seed',
      method: 'POST',
      url: '/api/seed',
    },
    {
      name: 'M-Pesa STK Push Test',
      method: 'POST',
      url: '/api/payments/mpesa/stk-push',
      body: {
        amount: 1000,
        phoneNumber: '254700123456',
        orderReference: 'test-order-123'
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      
      const req = createMockRequest(test.method, test.url, test.body);
      const res = createMockResponse();
      
      await handler(req, res);
      
      const status = (res as any).getStatus();
      const body = (res as any).getBody();
      
      if (status >= 200 && status < 300) {
        console.log(`✅ ${test.name}: Status ${status}`);
        if (body && typeof body === 'object') {
          if (body.status) console.log(`   Status: ${body.status}`);
          if (body.message) console.log(`   Message: ${body.message}`);
          if (Array.isArray(body)) console.log(`   Data count: ${body.length}`);
        }
      } else {
        console.log(`⚠️  ${test.name}: Status ${status}`);
        if (body?.error) console.log(`   Error: ${body.error}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: Exception`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('');
  }
}

async function checkEnvironmentForDeployment() {
  console.log('⚙️  Checking environment for Vercel deployment...\n');

  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set');
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName] || '';
      console.log(`   ${varName}: ${value.substring(0, 20)}...`);
    });
  } else {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }

  console.log('\n📋 Deployment checklist:');
  console.log(`${process.env.SUPABASE_URL ? '✅' : '❌'} SUPABASE_URL configured`);
  console.log(`${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY configured`);
  console.log(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL configured`);
  console.log(`${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_ANON_KEY configured`);
}

async function verifySupabaseProject() {
  console.log('🔍 Verifying Supabase red-umbrella project...\n');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.log('❌ Missing Supabase credentials');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Test connection with a simple operation
    const { data: healthCheck, error } = await supabase
      .from('pg_stat_database')
      .select('datname')
      .limit(1);

    if (error && !error.message.includes('permission denied')) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection working');
    }

    console.log('📍 Project Details:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Project ID: ${supabaseUrl.split('//')[1]?.split('.')[0] || 'unknown'}`);
    
  } catch (error) {
    console.log('❌ Supabase verification failed:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log('🚀 Complete Vercel Deployment Verification for red-umbrella\n');
  console.log('='.repeat(60));
  
  await checkEnvironmentForDeployment();
  console.log('\n' + '='.repeat(60));
  
  await verifySupabaseProject();
  console.log('\n' + '='.repeat(60));
  
  await testApiEndpoints();
  console.log('='.repeat(60));
  
  console.log('\n📝 Manual Steps Required:');
  console.log('1. 🗃️  Create Supabase tables manually:');
  console.log('   - Go to Supabase Dashboard > SQL Editor');
  console.log('   - Run the SQL in supabase_manual_schema.sql');
  console.log('');
  console.log('2. 🚀 Deploy to Vercel:');
  console.log('   - Run: vercel --prod');
  console.log('   - Add environment variables in Vercel dashboard');
  console.log('');
  console.log('3. ✅ Environment Variables for Vercel:');
  console.log('   SUPABASE_URL');
  console.log('   SUPABASE_SERVICE_ROLE_KEY');
  console.log('   NEXT_PUBLIC_SUPABASE_URL');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('');
  console.log('🎯 Once tables are created, your API will be fully functional!');
}

if (require.main === module) {
  main().catch(console.error);
}
