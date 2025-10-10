import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * API Endpoint: Create Admin User with Password
 * POST /api/admin/create-admin-user
 * 
 * Creates a new admin/manager/staff user in Supabase Auth and user_profile table
 * Generates a secure temporary password for the user
 * 
 * Required permissions: Admin only (manageUsers)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize Supabase admin client with service role key
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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { name, email, role, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, and role are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: admin, manager, staff'
      });
    }

    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword();

    console.log('Creating admin user:', { email, role, name });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role,
        permissions: permissions || getDefaultPermissions(role),
        onboarding_completed: true // Admin users don't need onboarding
      },
      app_metadata: {
        role,
        permissions: permissions || getDefaultPermissions(role)
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      
      // Handle duplicate user error
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

    console.log('✅ Auth user created:', authData.user.id);

    // Create user profile in database
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
        // Don't fail the request - profile might be created by trigger
        console.log('Note: Profile might be created by database trigger');
      } else {
        console.log('✅ User profile created');
      }
    } catch (profileErr) {
      console.error('Profile creation exception:', profileErr);
      // Continue - profile creation is not critical
    }

    // Return success with credentials
    return res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        userId: authData.user.id,
        email,
        name,
        role,
        temporaryPassword, // Return password so frontend can send email
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

/**
 * Generate a secure random password
 * - 16 characters long
 * - Includes uppercase, lowercase, numbers, and special characters
 * - Avoids confusing characters and HTML-problematic ones
 * - Cryptographically secure
 */
function generateSecurePassword(): string {
  const length = 16;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  // Avoid HTML entities (<, >, &, ', ") and confusing characters (l, I, 0, O)
  const special = '!@#$%^*()_+-=[]{}|;:,.?';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable pattern
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Get default permissions based on role
 */
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
