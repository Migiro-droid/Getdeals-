#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Production environment variables - REPLACE THESE WITH YOUR ACTUAL VALUES
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fxyifnckgllxqbggegtw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

if (SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error(' Please set your SERVICE ROLE KEY:');
  console.error('   Get it from: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/settings/api');
  console.error('   Look for: service_role key (NOT the anon key)');
  console.error('');
  console.error('Set it as environment variable:');
  console.error('   export VITE_SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"');
  console.error('');
  console.error('Or edit this script directly with your service role key.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAdminUser() {
  try {
    console.log(' Creating admin user for production...');

    // Check if admin user already exists
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error(' Error checking existing users:', checkError);
      return;
    }

    const existingAdmin = existingUsers.users.find(user => user.email === 'admin@getdeals.co.ke');

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@getdeals.co.ke');
      console.log('Password: admin123456');
      console.log('Role: admin');

      // Update the user metadata to ensure admin role
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingAdmin.id, {
        user_metadata: {
          name: 'Admin User',
          full_name: 'Admin User',
          role: 'admin'
        }
      });

      if (updateError) {
        console.error(' Could not update user metadata:', updateError);
      } else {
        console.log(' Admin role confirmed');
      }

      return;
    }

    // Create the admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@getdeals.co.ke',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (authError) {
      console.error(' Auth creation error:', authError);
      return;
    }

    console.log(' Admin user created successfully!');
    console.log(' Email: admin@getdeals.co.ke');
    console.log(' Password: admin123456');
    console.log(' Role: admin');
    console.log(' User ID:', authData.user?.id);

    // Try to create database profile
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          first_name: 'Admin',
          last_name: 'User',
          phone: null,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log('Could not create database profile:', profileError.message);
        console.log('This is normal if the profiles table doesn\'t exist yet');
      } else {
        console.log(' Database profile created');
      }
    } catch (dbError) {
      console.log('  Database profile creation skipped:', dbError.message);
    }

    console.log('\n🚀 Admin user is ready! You can now sign in with:');
    console.log(' admin@getdeals.co.ke');
    console.log(' admin123456');

  } catch (error) {
    console.error(' Error creating admin user:', error);
  }
}

createAdminUser();
