#!/usr/bin/env node

/**
 * Diagnose profile creation issues in detail
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

async function diagnoseProfileCreation() {
  console.log('🔍 Diagnosing profile creation process...\n');
  
  try {
    // Step 1: Check current database state
    console.log('1️⃣ Checking database schema...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, organization, organization_number, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (profilesError) {
      console.log('❌ Cannot access profiles:', profilesError.message);
      return;
    }
    
    console.log('📊 Recent profiles:', profiles);
    
    // Step 2: Test signup and track profile creation
    console.log('\n2️⃣ Testing signup with detailed tracking...');
    
    const testEmail = `test-detailed-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testOrganization = 'Detailed Test Company';
    const testOrgNumber = `DETAIL${Date.now()}`;
    
    console.log('📝 Test data:');
    console.log('- Email:', testEmail);
    console.log('- Organization:', testOrganization);
    console.log('- Org Number:', testOrgNumber);
    
    // Record profile count before signup
    const { count: beforeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Profiles before signup:', beforeCount);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Detailed Test User',
          phone: '+254700000001',
          full_name: 'Detailed Test User',
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
    console.log('📊 User ID:', signUpData.user?.id);
    
    // Step 3: Wait and check profile creation multiple times
    const userId = signUpData.user?.id;
    if (!userId) {
      console.log('❌ No user ID returned');
      return;
    }
    
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`\n3️⃣.${attempt} Checking profile creation (attempt ${attempt})...`);
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive wait
      
      // Count total profiles after signup
      const { count: afterCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Total profiles now:', afterCount);
      
      // Look for our specific user's profile
      const { data: userProfiles, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (userError) {
        console.log('❌ Error checking user profile:', userError.message);
        continue;
      }
      
      console.log('📊 Profiles for user:', userProfiles?.length || 0);
      
      if (userProfiles && userProfiles.length > 0) {
        console.log('✅ Profile found!');
        console.log('📊 Profile data:', userProfiles[0]);
        
        const profile = userProfiles[0];
        if (profile.organization && profile.organization_number) {
          console.log('🎉 Organization data captured successfully!');
        } else {
          console.log('⚠️ Profile created but organization data missing:');
          console.log('- Organization:', profile.organization);
          console.log('- Org Number:', profile.organization_number);
          console.log('');
          console.log('🔧 This confirms the database trigger function needs to be updated.');
          console.log('💡 Apply the migration in Supabase SQL Editor to fix this.');
        }
        break;
      } else {
        console.log('⏳ No profile found yet, waiting...');
        
        if (attempt === 5) {
          console.log('❌ Profile was never created!');
          console.log('🔧 This suggests the trigger function may not exist or is broken.');
          console.log('💡 The migration needs to be applied to create/fix the trigger.');
        }
      }
    }
    
    // Step 4: Check if trigger function exists
    console.log('\n4️⃣ Checking trigger function status...');
    
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table')
      .eq('trigger_name', 'on_auth_user_created');
    
    if (triggerError) {
      console.log('❌ Cannot check triggers:', triggerError.message);
    } else {
      console.log('📊 Auth trigger status:', triggers?.length > 0 ? '✅ EXISTS' : '❌ MISSING');
    }
    
  } catch (error) {
    console.error('💥 Diagnosis failed:', error);
  }
}

diagnoseProfileCreation();