import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error: Missing Supabase credentials'
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { name, email, role, permissions } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, and role are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const validRoles = ['admin', 'manager', 'staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: admin, manager, staff'
      });
    }

    const temporaryPassword = generateSecurePassword();

    console.log('Creating admin user:', { email, role, name });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        permissions: permissions || getDefaultPermissions(role),
        onboarding_completed: true
      },
      app_metadata: {
        role,
        permissions: permissions || getDefaultPermissions(role)
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      
      if (authError.message?.includes('already registered')) {
        return res.status(409).json({
          success: false,
          error: 'A user with this email already exists'
        });
      }

      return res.status(500).json({
        success: false,
        error: authError.message || 'Failed to create user in authentication system'
      });
    }

    if (!authData?.user) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user: No user data returned'
      });
    }

    console.log('Auth user created:', authData.user.id);

    try {
      const { error: profileError } = await supabaseAdmin
        .from('user_profile')
        .insert([{
          id: authData.user.id,
          email,
          full_name: name,
          role,
          preferences: JSON.stringify({
            notifications: true,
            theme: 'light'
          }),
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }] as any);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        console.log('Note: Profile might be created by database trigger');
      } else {
        console.log('User profile created');
      }
    } catch (profileErr) {
      console.error('Profile creation exception:', profileErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        userId: authData.user.id,
        email,
        name,
        role,
        temporaryPassword,
        permissions: permissions || getDefaultPermissions(role)
      }
    });

  } catch (error: any) {
    console.error('Unexpected error creating admin user:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

function generateSecurePassword(): string {
  const length = 16;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^*()_+-=[]{}|;:,.?';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'admin':
      return ['all'];
    case 'manager':
      return ['viewDashboard', 'manageOrders', 'manageCustomers', 'manageInventory', 'manageProducts', 'manageReports'];
    case 'staff':
      return ['viewDashboard', 'manageOrders'];
    default:
      return ['viewDashboard'];
  }
}
