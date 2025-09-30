import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTransactionLogsTable() {
  try {
    console.log('🔄 Creating transaction_logs table...');
    
    // Create the transaction_logs table
    const createTableSQL = `
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
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    });
    
    if (createTableError) {
      console.error('❌ Error creating table:', createTableError);
    } else {
      console.log('✅ transaction_logs table created successfully');
    }
    
    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON transaction_logs(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_mpesa_receipt ON transaction_logs(mpesa_receipt_number);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_phone ON transaction_logs(phone_number);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_result_code ON transaction_logs(result_code);
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at DESC);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: indexesSQL
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    // Enable RLS
    const rlsSQL = `ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;`;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql_query: rlsSQL
    });
    
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled successfully');
    }
    
    // Add missing columns to payments table
    const paymentsSQL = `
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_date BIGINT;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS merchant_request_id TEXT;
      ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `;
    
    const { error: paymentsError } = await supabase.rpc('exec_sql', {
      sql_query: paymentsSQL
    });
    
    if (paymentsError) {
      console.error('❌ Error updating payments table:', paymentsError);
    } else {
      console.log('✅ Payments table updated successfully');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

createTransactionLogsTable();