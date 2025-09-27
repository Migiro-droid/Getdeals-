#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Required environment variables:');
  console.log('  VITE_SUPABASE_URL');
  console.log('  VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📚 Reading migration file...');
    const migrationPath = './migrations/20250927_add_getdeals_number_system.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📄 Migration file loaded (${migrationSQL.length} characters)`);
    
    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔄 Applying ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error);
          console.error(`SQL: ${statement}`);
          return;
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('🎯 GetDeals Number System is now active');
    
    // Test the system
    console.log('\n🧪 Testing GetDeals number system...');
    
    // Check if columns exist
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, table_name')
      .in('table_name', ['user_profile', 'wallets'])
      .eq('column_name', 'getdeals_number');
    
    if (colError) {
      console.error('❌ Failed to check columns:', colError);
      return;
    }
    
    console.log('📊 GetDeals number columns created:');
    columns.forEach(col => {
      console.log(`  ✓ ${col.table_name}.${col.column_name}`);
    });
    
    // Check sequence
    const { data: sequences, error: seqError } = await supabase
      .from('information_schema.sequences')
      .select('sequence_name')
      .eq('sequence_name', 'getdeals_number_seq');
    
    if (seqError) {
      console.error('❌ Failed to check sequence:', seqError);
      return;
    }
    
    if (sequences.length > 0) {
      console.log('✓ GetDeals number sequence created');
    } else {
      console.log('⚠️  GetDeals number sequence not found');
    }
    
    // Test number generation function
    const { data: testNumber, error: testError } = await supabase
      .rpc('generate_getdeals_number');
    
    if (testError) {
      console.error('❌ Test number generation failed:', testError);
    } else {
      console.log(`✓ Test number generated: ${testNumber}`);
    }
    
    console.log('\n🎉 GetDeals Number System setup complete!');
    console.log('Next steps:');
    console.log('  1. Run: node test-getdeals-number-system.mjs');
    console.log('  2. Test user registration with automatic number assignment');
    console.log('  3. Run backfill for existing users if needed');
    
  } catch (err) {
    console.error('❌ Error applying migration:', err);
  }
}

applyMigration();