#!/usr/bin/env node

/**
 * Test the complete auth flow to see where organization data gets lost
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

async function testCompleteAuthFlow() {
  console.log('🔍 Testing complete auth flow for organization data...\n');
  
  try {
    // Step 1: Test signup with organization data
    console.log('1️⃣ Testing signup with organization data...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testOrganization = 'Test Company Ltd';
    const testOrgNumber = `TEST${Date.now()}`;
    
    console.log('📝 Test data:');
    console.log('- Email:', testEmail);
    console.log('- Organization:', testOrganization);
    console.log('- Org Number:', testOrgNumber);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          phone: '+254700000000',
          full_name: 'Test User',
          organization: testOrganization,
          organization_number: testOrgNumber
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Signup failed:', signUpError.message);
      return;
    }
    
    console.log('✅ Signup successful');
    console.log('📊 User data:', {
      id: signUpData.user?.id,
      email: signUpData.user?.email,
      user_metadata: signUpData.user?.user_metadata
    });
    
    // Step 2: Check if profile was created with organization data
    if (signUpData.user?.id) {
      console.log('\n2️⃣ Checking if profile was created...');
      
      // Wait a bit for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, organization_number, email')
        .eq('user_id', signUpData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profile check failed:', profileError.message);
        
        // Check if the user exists in auth but profile wasn't created
        console.log('\n🔍 Debugging profile creation...');
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('user_id, organization, organization_number')
          .limit(5);
        
        if (allError) {
          console.log('❌ Cannot access profiles table:', allError.message);
        } else {
          console.log('📊 Sample profiles:', allProfiles);
        }
      } else {
        console.log('✅ Profile found!');
        console.log('📊 Profile data:', profileData);
        
        if (profileData.organization === testOrganization && profileData.organization_number === testOrgNumber) {
          console.log('🎉 Organization data captured successfully!');
        } else {
          console.log('⚠️ Organization data missing or incorrect:');
          console.log('- Expected org:', testOrganization);
          console.log('- Got org:', profileData.organization);
          console.log('- Expected org number:', testOrgNumber);
          console.log('- Got org number:', profileData.organization_number);
        }
      }
      
      // Cleanup - delete the test user
      console.log('\n🧹 Cleaning up test data...');
      
      // Note: We can't delete auth users via client SDK, but we can delete the profile
      if (profileData?.id) {
        await supabase.from('profiles').delete().eq('id', profileData.id);
        console.log('✅ Profile deleted');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testCompleteAuthFlow();