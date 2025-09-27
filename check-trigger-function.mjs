#!/usr/bin/env node

/**
 * Check the current trigger function to see what fields it's handling
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggerFunction() {
  console.log('🔍 Checking current database trigger function...\n');
  
  try {
    // Try to get the trigger function definition
    const { data, error } = await supabase.rpc('check_trigger_function');
    
    if (error) {
      console.log('❌ Cannot access trigger function directly:', error.message);
      console.log('\n📋 Here\'s what needs to be done:\n');
      console.log('1. The database migration needs to be applied to update the trigger function');
      console.log('2. The current trigger function doesn\'t handle organization_number field');
      console.log('3. You need to run the migration in Supabase SQL Editor\n');
      
      console.log('🚀 NEXT STEPS:');
      console.log('');
      console.log('1. Open Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the content from: migrations/20250927_add_organization_number.sql');
      console.log('3. Execute the migration');
      console.log('4. Test the signup flow again');
      console.log('');
      console.log('The migration will:');
      console.log('✅ Add organization_number column (already exists)');
      console.log('✅ Create unique constraint on organization_number');
      console.log('✅ Update the handle_new_user trigger function to capture organization data');
      console.log('');
      
      // Show the migration content
      console.log('📄 MIGRATION TO EXECUTE:');
      console.log('----------------------------------------');
      
      const fs = await import('fs');
      try {
        const migrationContent = fs.readFileSync('/workspaces/getdeals-kenya-showcase/migrations/20250927_add_organization_number.sql', 'utf8');
        console.log(migrationContent);
      } catch (readError) {
        console.log('❌ Could not read migration file:', readError.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error);
  }
}

checkTriggerFunction();