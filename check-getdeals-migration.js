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
    
    console.log('🔄 Applying GetDeals Number System migration...');
    console.log('⚠️  Note: This migration should be run directly in Supabase SQL Editor');
    console.log('📋 SQL to execute:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    
    // Test connection to Supabase
    console.log('\n🔌 Testing Supabase connection...');
    
    // Check if user_profile table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profile');
    
    if (tableError) {
      console.error('❌ Failed to check tables:', tableError);
      return;
    }
    
    if (tables.length === 0) {
      console.log('⚠️  user_profile table not found - please run user profile migration first');
    } else {
      console.log('✓ user_profile table exists');
    }
    
    // Check if GetDeals number columns exist
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, table_name')
      .in('table_name', ['user_profile', 'wallets'])
      .eq('column_name', 'getdeals_number');
    
    if (colError) {
      console.log('ℹ️  GetDeals number columns not yet created (expected before migration)');
    } else if (columns.length > 0) {
      console.log('✅ GetDeals number system already applied!');
      console.log('📊 Found GetDeals number columns:');
      columns.forEach(col => {
        console.log(`  ✓ ${col.table_name}.${col.column_name}`);
      });
      
      // Test existing system
      console.log('\n🧪 Testing existing GetDeals number system...');
      
      const { data: sampleUsers, error: userError } = await supabase
        .from('user_profile')
        .select('id, full_name, getdeals_number')
        .limit(3);
      
      if (userError) {
        console.error('❌ Failed to fetch sample users:', userError);
      } else {
        console.log('📋 Sample users with GetDeals numbers:');
        sampleUsers.forEach(user => {
          console.log(`  • ${user.full_name || 'Unknown'}: ${user.getdeals_number || 'Not assigned'}`);
        });
      }
    }
    
    console.log('\n📝 Manual Migration Steps:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the migration SQL above');
    console.log('3. Click "Run" to execute the migration');
    console.log('4. Run: node test-getdeals-number-system.mjs');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

applyMigration();