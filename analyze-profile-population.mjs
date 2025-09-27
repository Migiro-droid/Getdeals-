#!/usr/bin/env node

/**
 * Analyze how the profile table gets populated
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

async function analyzeProfilePopulation() {
  console.log('🔍 Analyzing how the profile table gets populated...\n');
  
  try {
    // 1. Check profile table structure
    console.log('1️⃣ Profile Table Structure Analysis:');
    console.log('=====================================');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Cannot access profiles table:', profilesError.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('📊 Profile table columns:', Object.keys(profiles[0]));
      console.log('📊 Sample profile data:', profiles[0]);
    } else {
      console.log('📊 Profile table is empty');
    }
    
    // 2. Check recent profile creation patterns
    console.log('\n2️⃣ Recent Profile Creation Analysis:');
    console.log('====================================');
    
    const { data: recentProfiles, error: recentError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, organization, organization_number, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.log('❌ Cannot fetch recent profiles:', recentError.message);
    } else {
      console.log('📊 Recent profiles:');
      recentProfiles?.forEach((profile, index) => {
        console.log(`   ${index + 1}. User ID: ${profile.user_id}`);
        console.log(`      Name: ${profile.first_name} ${profile.last_name}`);
        console.log(`      Organization: ${profile.organization || 'null'}`);
        console.log(`      Org Number: ${profile.organization_number || 'null'}`);
        console.log(`      Created: ${profile.created_at}`);
        console.log('');
      });
    }
    
    // 3. Test the current population mechanism
    console.log('3️⃣ Testing Current Population Mechanism:');
    console.log('=========================================');
    
    const testEmail = `profile-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testData = {
      full_name: 'Profile Test User',
      first_name: 'Profile',
      last_name: 'Test User',
      phone: '+254700000123',
      organization: 'Test Organization Ltd',
      organization_number: `ORG${Date.now()}`
    };
    
    console.log('📝 Creating test user with data:');
    console.log('   Email:', testEmail);
    console.log('   Full Name:', testData.full_name);
    console.log('   Organization:', testData.organization);
    console.log('   Org Number:', testData.organization_number);
    
    // Record profile count before
    const { count: beforeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Profiles before signup:', beforeCount);
    
    // Create user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: testData
      }
    });
    
    if (signUpError) {
      console.log('❌ Signup failed:', signUpError.message);
      return;
    }
    
    console.log('✅ User created successfully');
    console.log('📊 User ID:', signUpData.user?.id);
    console.log('📊 User metadata:', signUpData.user?.user_metadata);
    
    // Wait for profile creation and check multiple times
    const userId = signUpData.user?.id;
    let profileCreated = false;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`\n⏳ Checking profile creation (attempt ${attempt})...`);
      
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      
      const { count: afterCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Total profiles now:', afterCount);
      
      if (userId) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (profileError) {
          console.log('❌ Error checking profile:', profileError.message);
        } else if (userProfile) {
          console.log('✅ Profile found!');
          console.log('📊 Profile data:');
          console.log('   ID:', userProfile.id);
          console.log('   User ID:', userProfile.user_id);
          console.log('   First Name:', userProfile.first_name);
          console.log('   Last Name:', userProfile.last_name);
          console.log('   Phone:', userProfile.phone);
          console.log('   Organization:', userProfile.organization);
          console.log('   Org Number:', userProfile.organization_number);
          console.log('   Created At:', userProfile.created_at);
          
          // Analyze data mapping
          console.log('\n📈 Data Mapping Analysis:');
          console.log('========================');
          console.log('Expected → Actual:');
          console.log(`First Name: "${testData.first_name}" → "${userProfile.first_name}"`);
          console.log(`Last Name: "${testData.last_name}" → "${userProfile.last_name}"`);
          console.log(`Phone: "${testData.phone}" → "${userProfile.phone}"`);
          console.log(`Organization: "${testData.organization}" → "${userProfile.organization}"`);
          console.log(`Org Number: "${testData.organization_number}" → "${userProfile.organization_number}"`);
          
          profileCreated = true;
          break;
        } else {
          console.log('⏳ Profile not created yet...');
        }
      }
    }
    
    if (!profileCreated) {
      console.log('❌ Profile was never created!');
      console.log('🔧 This indicates the database trigger is missing or broken.');
    }
    
    // 4. Check for database triggers
    console.log('\n4️⃣ Database Trigger Analysis:');
    console.log('==============================');
    
    try {
      // Try to check if triggers exist (this might not work with RLS)
      const { data: triggerCheck, error: triggerError } = await supabase
        .rpc('check_auth_triggers');
      
      if (triggerError) {
        console.log('❌ Cannot directly check triggers:', triggerError.message);
        console.log('💡 This is expected - trigger inspection requires elevated permissions');
      }
    } catch (error) {
      console.log('❌ Trigger check not available:', error.message);
    }
    
    console.log('\n🔍 Profile Population Summary:');
    console.log('==============================');
    console.log('The profile table should be populated by:');
    console.log('1. Database trigger function called "handle_new_user"');
    console.log('2. Triggered when a new user is created in auth.users table');
    console.log('3. Extracts data from user_metadata and creates profile record');
    console.log('4. Maps organization fields from signup data to profile columns');
    
    if (profileCreated) {
      console.log('\n✅ Profile population is working!');
    } else {
      console.log('\n❌ Profile population is NOT working!');
      console.log('🔧 Likely causes:');
      console.log('   - Missing database trigger function');
      console.log('   - Broken trigger function');
      console.log('   - RLS policies blocking profile creation');
      console.log('   - Migration not applied');
    }
    
  } catch (error) {
    console.error('💥 Analysis failed:', error);
  }
}

analyzeProfilePopulation();