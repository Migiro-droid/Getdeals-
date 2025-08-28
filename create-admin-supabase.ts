import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Creating admin user with Supabase Auth...');

  const adminEmail = 'admin@getdeals.co.ke';
  const adminPassword = 'admin123456';

  try {
    // First, try to create the user in Supabase Auth
    console.log('🔐 Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: 'GetDeals Admin',
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.code === 'email_exists') {
        console.log('⚠️ Admin user already exists in auth, getting user data...');
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;
        
        const existingUser = userData.users.find(u => u.email === adminEmail);
        if (!existingUser) throw new Error('Could not find existing admin user');
        
        console.log('✅ Found existing admin user:', existingUser.id);
        
        // Create/update the profile in our database
        await prisma.user.upsert({
          where: { email: adminEmail },
          update: {
            role: 'admin',
            emailVerified: true,
          },
          create: {
            id: existingUser.id,
            name: 'GetDeals Admin',
            email: adminEmail,
            role: 'admin',
            emailVerified: true,
            phone: '+254700000000'
          },
        });
        
        console.log('✅ Admin profile updated in database');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created:', authData.user.id);
      
      // Create the user profile in our database
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          role: 'admin',
          emailVerified: true,
        },
        create: {
          id: authData.user.id,
          name: 'GetDeals Admin',
          email: adminEmail,
          role: 'admin',
          emailVerified: true,
          phone: '+254700000000'
        },
      });
      
      console.log('✅ Admin profile created in database');
    }

    console.log('🎉 Admin user setup completed!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Admin setup completed successfully!');
  })
  .catch(async (e) => {
    console.error('❌ Admin setup failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
