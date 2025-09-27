#!/usr/bin/env node

/**
 * Quick verification test after migration is applied
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickVerificationTest() {
  console.log('🚀 Quick verification after migration...\n');
  
  const testEmail = `verify-${Date.now()}@example.com`;
  const testOrg = 'Verification Company Ltd';
  const testOrgNumber = `VERIFY${Date.now()}`;
  
  try {
    // Signup
    console.log('1️⃣ Testing signup...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Verification User',
          organization: testOrg,
          organization_number: testOrgNumber
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Signup failed:', signUpError.message);
      return;
    }
    
    console.log('✅ Signup successful');
    
    // Check profile creation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2️⃣ Checking profile creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', signUpData.user?.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile check failed:', profileError.message);
      return;
    }
    
    console.log('✅ Profile created successfully!');
    console.log('📊 Organization:', profile.organization);
    console.log('📊 Org Number:', profile.organization_number);
    
    if (profile.organization === testOrg && profile.organization_number === testOrgNumber) {
      console.log('🎉 MIGRATION SUCCESSFUL! Organization data is now being captured!');
    } else {
      console.log('⚠️ Profile created but organization data still missing');
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

quickVerificationTest();