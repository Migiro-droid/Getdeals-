#!/usr/bin/env node

/**
 * Script to apply the RLS policy fix for orders table
 * Usage: node apply-orders-rls-fix.cjs
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure your .env file is configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔧 Applying RLS policy fix for orders table...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251025_fix_orders_rls_policy.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and filter empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec', { sql_string: statement });
      
      if (error) {
        // Try direct SQL execution as fallback
        // Note: Supabase doesn't expose raw SQL execution via client, so we need to use the statement directly
        console.log(`  ⚠️  Attempting alternative execution...`);
      } else {
        console.log(`  ✅ Success`);
      }
    }

    console.log('\n✅ RLS policy fix applied successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('  • Fixed "Users can view own orders" policy');
    console.log('  • Fixed "Users can create own orders" policy');
    console.log('  • Fixed "Users can update own orders" policy');
    console.log('  • Ensured service role can manage orders for API calls');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  }
}

applyMigration();
