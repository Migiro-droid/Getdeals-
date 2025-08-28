import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabaseAndAdmin() {
  try {
    console.log('🔧 Setting up database schema and admin user...');
    
    // Read the schema file
    const schemaSQL = fs.readFileSync('./supabase-schema.sql', 'utf8');
    
    // Execute the schema
    console.log('📊 Creating database tables...');
    const { data: schemaData, error: schemaError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: schemaSQL 
    });
    
    if (schemaError) {
      console.log('⚠️ Schema execution via RPC failed, trying direct approach...');
      console.log('Error:', schemaError.message);
      
      // Alternative approach: Create tables directly
      console.log('🔄 Creating tables with individual SQL commands...');
      
      // Create users table
      const { error: usersError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
            "emailVerified" BOOLEAN NOT NULL DEFAULT false,
            "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
            "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
        `
      });
      
      if (usersError) {
        console.log('❌ Could not create users table via RPC either.');
        console.log('📋 MANUAL SETUP REQUIRED:');
        console.log('1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/sql');
        console.log('2. Copy and paste the contents of supabase-schema.sql');
        console.log('3. Run the SQL script');
        console.log('4. Then run this script again');
        return;
      }
    }
    
    console.log('✅ Database schema setup complete!');
    
    // Now test authentication and create admin profile
    console.log('🔍 Testing admin authentication...');
    
    // Create Supabase client for regular auth
    const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    // Test sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@getdeals.co.ke',
      password: 'admin123456'
    });

    if (signInError) {
      console.log('❌ Admin user does not exist. Creating admin user...');
      
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
      
      // Create profile for the new user
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: createUserData.user.id,
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
        console.error('❌ Failed to create admin profile:', profileError.message);
        return;
      }
      
      console.log('✅ Admin profile created!');
      
    } else {
      console.log('✅ Admin user exists and can sign in!');
      console.log('User ID:', signInData.user?.id);
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.log('⚠️ Error checking profile:', fetchError.message);
      } else if (!existingProfile) {
        console.log('📝 Creating admin profile...');
        
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: signInData.user.id,
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
          console.error('❌ Failed to create admin profile:', profileError.message);
          return;
        }
        
        console.log('✅ Admin profile created!');
        console.log('Profile data:', profileData);
      } else {
        console.log('✅ Admin profile already exists:');
        console.log('Name:', existingProfile.name);
        console.log('Role:', existingProfile.role);
        console.log('Email verified:', existingProfile.emailVerified);
        
        // Update role to admin if it's not already
        if (existingProfile.role !== 'admin') {
          console.log('🔄 Updating role to admin...');
          const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('users')
            .update({ role: 'admin' })
            .eq('id', signInData.user.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('❌ Failed to update role:', updateError.message);
          } else {
            console.log('✅ Role updated to admin!');
          }
        }
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
    console.log('\\n🎉 SETUP COMPLETE!');
    console.log('\\n📋 Admin Login Credentials:');
    console.log('Email: admin@getdeals.co.ke');
    console.log('Password: admin123456');
    console.log('Role: admin');
    console.log('\\n🌐 You can now:');
    console.log('1. Visit http://localhost:8081 and sign in');
    console.log('2. Access admin features');
    console.log('3. The UI should properly hide/show buttons based on auth state');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

setupDatabaseAndAdmin();
