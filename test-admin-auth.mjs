import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthenticationAndCreateProfile() {
  try {
    console.log('🔍 Testing admin authentication...');
    
    // Test sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@getdeals.co.ke',
      password: 'admin123456'
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user?.id);
    console.log('Email:', signInData.user?.email);
    
    if (signInData.user) {
      console.log('\\n📝 Checking/creating user profile...');
      
      // First, check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.log('⚠️ Error checking profile:', fetchError.message);
        
        // Try to create the user profile with admin privileges
        console.log('🔧 Attempting to create profile with admin access...');
        
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: signInData.user.id,
            email: signInData.user.email,
            name: 'Admin User',
            phone: null,
            role: 'admin',
            emailVerified: true,
            phoneVerified: false,
            twoFactorEnabled: false
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Profile creation error:', createError.message);
          console.log('\\n🔧 Checking if users table exists...');
          
          // Try to check table structure
          const { data: tableCheck, error: tableError } = await supabaseAdmin
            .from('users')
            .select('*')
            .limit(0);
          
          if (tableError) {
            console.log('❌ Users table does not exist or is not accessible:', tableError.message);
            console.log('\\n📋 Next steps:');
            console.log('1. Set up the database schema by running the SQL files in Supabase SQL Editor');
            console.log('2. Or use the Supabase migration system');
          } else {
            console.log('✅ Users table exists but profile creation failed');
          }
        } else {
          console.log('✅ Profile created successfully!');
          console.log('Profile data:', newProfile);
        }
      } else if (existingProfile) {
        console.log('✅ User profile already exists:');
        console.log('Name:', existingProfile.name);
        console.log('Role:', existingProfile.role);
        console.log('Email verified:', existingProfile.emailVerified);
      } else {
        console.log('⚠️ No profile found, but no error either');
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\\n🔓 Signed out successfully');
    
    console.log('\\n🎉 Authentication test complete!');
    console.log('\\n📋 Admin Login Credentials:');
    console.log('Email: admin@getdeals.co.ke');
    console.log('Password: admin123456');
    console.log('Role: admin (if profile was created)');
    
  } catch (error) {
    console.error('❌ Error during authentication test:', error);
  }
}

testAuthenticationAndCreateProfile();
