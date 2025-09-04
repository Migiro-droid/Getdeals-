import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user and profile...');
    
    // First, try to sign in to see if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@getdeals.co.ke',
      password: 'admin123456'
    });

    let userId;

    if (signInError) {
      console.log('📝 Admin user does not exist. Creating admin user...');
      
      // Create admin user
      const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@getdeals.co.ke',
        password: 'admin123456',
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('❌ Failed to create admin user:', createUserError.message);
        return;
      }
      
      console.log('✅ Admin user created!');
      userId = createUserData.user.id;
    } else {
      console.log('✅ Admin user exists and can sign in!');
      userId = signInData.user.id;
      await supabase.auth.signOut();
    }
    
    // Create or update admin profile
    console.log('📝 Creating/updating admin profile...');
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
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
      console.error('❌ Failed to create/update admin profile:', profileError.message);
      
      if (profileError.code === '42P01' || profileError.message.includes('does not exist')) {
        console.log('\\n❌ The users table does not exist!');
        console.log('📋 Please set up the database schema first:');
        console.log('1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/sql');
        console.log('2. Copy and paste the contents of supabase-schema.sql');
        console.log('3. Run the SQL script');
        console.log('4. Then run this script again');
      }
      return;
    }
    
    console.log('✅ Admin profile created/updated successfully!');
    console.log('Profile data:', profileData);
    
    console.log('\\n🎉 ADMIN SETUP COMPLETE!');
    console.log('\\n📋 Admin Login Credentials:');
    console.log('✉️  Email: admin@getdeals.co.ke');
    console.log('🔑 Password: admin123456');
    console.log('👑 Role: admin');
    console.log('\\n🌐 Next steps:');
    console.log('1. Visit http://localhost:8081');
    console.log('2. Click "Sign In"');
    console.log('3. Use the credentials above');
    console.log('4. You should have admin access to all features');
    
  } catch (error) {
    console.error('❌ Error during admin setup:', error);
  }
}

createAdminUser();
