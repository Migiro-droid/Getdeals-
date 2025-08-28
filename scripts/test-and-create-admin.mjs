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

async function testAndCreateAdmin() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic auth functionality
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth test failed:', authError);
      return;
    }
    console.log('✅ Auth system working');

    // Try to test database connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Database tables not ready:', testError.message);
      console.log('Will create admin user with auth only (no database profile)');
    } else {
      console.log('✅ Database tables accessible');
    }

    console.log('\n🔐 Creating admin user...');
    
    // Create admin user with auth
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@getdealskenya.com',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (createError) {
      if (createError.message.includes('already exists') || createError.message.includes('already registered')) {
        console.log('✅ Admin user already exists');
        console.log('Email: admin@getdealskenya.com');
        console.log('Password: admin123456');
        return;
      }
      console.error('❌ Failed to create admin user:', createError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@getdealskenya.com');
    console.log('🔑 Password: admin123456');
    console.log('👑 Role: admin (set in user_metadata)');
    
    if (authUser.user) {
      console.log('🆔 User ID:', authUser.user.id);
    }

    // Try to create database profile if tables exist
    if (!testError) {
      try {
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: authUser.user.id,
            email: 'admin@getdealskenya.com',
            name: 'Admin User',
            phone: null,
            role: 'admin',
            emailVerified: true,
            phoneVerified: false,
            twoFactorEnabled: false
          });

        if (profileError) {
          console.log('⚠️  Could not create database profile:', profileError.message);
        } else {
          console.log('✅ Database profile created');
        }
      } catch (dbError) {
        console.log('⚠️  Database profile creation skipped:', dbError);
      }
    }

    console.log('\n🚀 Ready to test! Try signing in at http://localhost:8080');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

testAndCreateAdmin();
