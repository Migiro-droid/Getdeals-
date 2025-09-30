import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPaymentsSchema() {
  try {
    console.log('🔄 Fixing payments table schema...');
    
    // First, let's check the current structure
    console.log('📋 Checking current payments table structure...');
    const { data: currentStructure, error: structureError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log('ℹ️ Payments table might not exist yet, will create it');
    } else {
      console.log('✅ Found existing payments table');
    }
    
    // Create the payments table with correct schema
    const createPaymentsTableSQL = `
      -- Drop the existing payments table if it exists to recreate with correct schema
      DROP TABLE IF EXISTS public.payments CASCADE;
      
      -- Create payments table with proper types
      CREATE TABLE IF NOT EXISTS public.payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id TEXT NOT NULL, -- Changed from UUID to TEXT to handle order references
        amount BIGINT NOT NULL, -- Store in cents for precision
        method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        transaction_id TEXT UNIQUE,
        phone_number TEXT,
        reference TEXT,
        failure_reason TEXT,
        mpesa_receipt_number TEXT,
        transaction_date BIGINT,
        merchant_request_id TEXT,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql_query: createPaymentsTableSQL
    });
    
    if (createTableError) {
      console.error('❌ Error creating payments table:', createTableError);
      throw createTableError;
    } else {
      console.log('✅ Payments table created successfully');
    }
    
    // Create the transaction_logs table
    const createTransactionLogsSQL = `
      CREATE TABLE IF NOT EXISTS public.transaction_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id TEXT UNIQUE NOT NULL,
        merchant_request_id TEXT,
        mpesa_receipt_number TEXT,
        phone_number TEXT,
        amount BIGINT,
        transaction_date BIGINT,
        result_code INTEGER,
        result_desc TEXT,
        callback_data JSONB,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: createLogsError } = await supabase.rpc('exec_sql', {
      sql_query: createTransactionLogsSQL
    });
    
    if (createLogsError) {
      console.error('❌ Error creating transaction_logs table:', createLogsError);
      throw createLogsError;
    } else {
      console.log('✅ Transaction logs table created successfully');
    }
    
    // Create indexes
    const createIndexesSQL = `
      -- Indexes for payments table
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_mpesa_receipt ON payments(mpesa_receipt_number);
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_phone_number ON payments(phone_number);
      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
      
      -- Indexes for transaction_logs table
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON transaction_logs(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_mpesa_receipt ON transaction_logs(mpesa_receipt_number);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_phone ON transaction_logs(phone_number);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_result_code ON transaction_logs(result_code);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at DESC);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: createIndexesSQL
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      throw indexError;
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    // Enable RLS
    const enableRLSSQL = `
      ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql_query: enableRLSSQL
    });
    
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      throw rlsError;
    } else {
      console.log('✅ RLS enabled successfully');
    }
    
    // Create RLS policies
    const createPoliciesSQL = `
      -- Policies for payments table
      CREATE POLICY "Service role can manage payments" ON public.payments
        FOR ALL USING (true);
      
      -- Policies for transaction_logs table  
      CREATE POLICY "Service role can manage transaction logs" ON public.transaction_logs
        FOR ALL USING (true);
    `;
    
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql_query: createPoliciesSQL
    });
    
    if (policiesError) {
      console.error('❌ Error creating policies:', policiesError);
      throw policiesError;
    } else {
      console.log('✅ RLS policies created successfully');
    }
    
    console.log('🎉 Schema migration completed successfully!');
    
    // Test both tables
    console.log('🧪 Testing tables...');
    
    const { data: paymentsTest, error: paymentsTestError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    const { data: logsTest, error: logsTestError } = await supabase
      .from('transaction_logs')
      .select('*')
      .limit(1);
    
    if (paymentsTestError) {
      console.error('❌ Error testing payments table:', paymentsTestError);
    } else {
      console.log('✅ Payments table is working correctly');
    }
    
    if (logsTestError) {
      console.error('❌ Error testing transaction_logs table:', logsTestError);
    } else {
      console.log('✅ Transaction logs table is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixPaymentsSchema();