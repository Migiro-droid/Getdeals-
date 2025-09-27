#!/usr/bin/env node

/**
 * Simple migration to add organization_number column
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addOrganizationNumberColumn() {
  try {
    console.log('🚀 Adding organization_number column to profiles table...\n');
    
    // First, let's check the current structure
    console.log('1. Checking current profiles table structure...');
    
    const { data: currentData, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error checking profiles table:', selectError.message);
      process.exit(1);
    }
    
    console.log('✅ Profiles table is accessible');
    
    // Now let's try to add the organization_number column using a simple insert test
    console.log('\n2. Testing if organization_number column exists...');
    
    const testId = `test-${Date.now()}`;
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        user_id: testId,
        first_name: 'Test',
        last_name: 'User',
        email: `test-${Date.now()}@example.com`,
        organization: 'Test Org',
        organization_number: 'TEST123456', // This will fail if column doesn't exist
        email_verified: false
      })
      .select();
    
    if (testError) {
      if (testError.message.includes('organization_number')) {
        console.log('❌ organization_number column does not exist');
        console.log('\n📝 Manual Migration Required:');
        console.log('Please execute this SQL in your Supabase SQL Editor:\n');
        
        console.log(`-- Add organization_number column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_number TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.organization_number IS 'Unique organization number for business users';

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_organization_number_unique 
ON public.profiles(organization_number) 
WHERE organization_number IS NOT NULL AND organization_number != '';

-- Create regular index
CREATE INDEX IF NOT EXISTS idx_profiles_organization_number 
ON public.profiles(organization_number);`);

        console.log('\nAfter executing the above SQL, run the test script again.');
        process.exit(1);
      } else {
        console.error('❌ Unexpected error:', testError.message);
        process.exit(1);
      }
    } else {
      console.log('✅ organization_number column already exists!');
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testId);
      console.log('✅ Test data cleaned up');
      
      console.log('\n🎉 Migration not needed - column already exists!');
    }
    
  } catch (error) {
    console.error('💥 Migration check failed:', error);
    process.exit(1);
  }
}

addOrganizationNumberColumn();