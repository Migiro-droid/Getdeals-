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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // First, create the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@getdeals.co.ke',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        full_name: 'Admin User'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return;
    }

    console.log('Auth user created:', authData.user?.id);

    // Then create/update the user profile to make them admin
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
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
        console.error('Profile update error:', profileError);
        return;
      }

      console.log('Admin user created successfully!');
      console.log('Email: admin@getdeals.co.ke');
      console.log('Password: admin123456');
      console.log('Role: admin');
      console.log('Profile:', profileData);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
