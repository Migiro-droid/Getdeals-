import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminProfile() {
  try {
    console.log('🔧 Creating admin user profile...');
    
    // The auth user already exists, we just need to create the profile
    const adminUserId = '2e9721c1-2482-42f8-a4bc-015352d83386'; // From our earlier test
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: adminUserId,
        email: 'admin@getdeals.co.ke',
        name: 'Admin User',
        phone: null,
        role: 'admin',
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', profileError.message);
      
      // If the table doesn't exist, show instructions
      if (profileError.code === '42P01' || profileError.message.includes('does not exist')) {
        console.log('\\n📋 DATABASE SETUP REQUIRED:');
        console.log('The users table does not exist. Please follow these steps:');
        console.log('\\n1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/sql');
        console.log('2. Copy and paste the schema from: supabase-schema.sql');
        console.log('3. Run the SQL script to create the tables');
        console.log('4. Run this script again');
        console.log('\\n🔐 Your admin auth user is already created with these credentials:');
        console.log('Email: admin@getdeals.co.ke');
        console.log('Password: admin123456');
      }
      return;
    }

    console.log('✅ Admin profile created successfully!');
    console.log('Profile data:', profileData);
    
    console.log('\\n🎉 SETUP COMPLETE!');
    console.log('\\n📋 Admin Login Credentials:');
    console.log('Email: admin@getdeals.co.ke');
    console.log('Password: admin123456');
    console.log('Role: admin');
    console.log('\\n🌐 You can now:');
    console.log('1. Visit http://localhost:8080/test-auth to test authentication');
    console.log('2. Visit http://localhost:8080 and click "Sign In" to log in');
    console.log('3. Access admin features once logged in');
    
  } catch (error) {
    console.error('❌ Error creating admin profile:', error);
  }
}

createAdminProfile();
