import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminWithPrisma() {
  try {
    console.log('🔧 Creating admin user using Prisma + Supabase...');
    
    // First, try to sign in to see if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@getdeals.co.ke',
      password: 'admin123456'
    });

    let userId;

    if (signInError) {
      console.log('📝 Admin user does not exist. Creating admin user...');
      
      // Create admin user in Supabase Auth
      const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@getdeals.co.ke',
        password: 'admin123456',
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('❌ Failed to create admin user:', createUserError.message);
        return;
      }
      
      console.log('✅ Admin user created in Supabase Auth!');
      userId = createUserData.user.id;
    } else {
      console.log('✅ Admin user exists and can sign in!');
      userId = signInData.user.id;
      await supabase.auth.signOut();
    }
    
    // Now create user profile using Prisma
    console.log('📝 Creating/updating admin profile using Prisma...');
    
    try {
      const user = await prisma.user.upsert({
        where: { id: userId },
        update: {
          role: 'admin',
          emailVerified: true,
        },
        create: {
          id: userId,
          email: 'admin@getdeals.co.ke',
          name: 'Admin User',
          phone: null,
          role: 'admin',
          emailVerified: true,
          phoneVerified: false,
          twoFactorEnabled: false,
        },
      });
      
      console.log('✅ Admin profile created/updated successfully using Prisma!');
      console.log('Profile data:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      });
      
    } catch (prismaError) {
      console.error('❌ Prisma operation failed:', prismaError.message);
      
      // Check if the table exists by trying a simple query
      try {
        const userCount = await prisma.user.count();
        console.log(`✅ Database connection successful. Found ${userCount} users in the database.`);
        console.log('❌ The error above suggests an issue with the user creation specifically.');
      } catch (connectionError) {
        console.log('❌ Database connection failed:', connectionError.message);
        console.log('📋 Make sure your DATABASE_URL is correct in .env file');
      }
      return;
    }
    
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
  } finally {
    await prisma.$disconnect();
  }
}

createAdminWithPrisma();
