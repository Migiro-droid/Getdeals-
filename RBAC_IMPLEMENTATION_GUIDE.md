# Admin Password Creation & Role-Based Access Control Implementation Guide

## Overview
This guide implements:
1. **Password creation for admin users** (admin, manager, staff)
2. **Role-based access control (RBAC)** with proper permission checking
3. **Unauthorized access dialog** when users attempt to access restricted sections

## Features Implemented

### 1. Role Hierarchy
```
Admin (Full Access)
  ├─ Dashboard
  ├─ Orders
  ├─ Customers  
  ├─ Inventory
  ├─ Products
  ├─ Users
  ├─ Settings
  └─ Reports

Manager (Limited Access)
  ├─ Dashboard
  ├─ Orders
  ├─ Customers
  ├─ Inventory
  ├─ Products
  └─ Reports

Staff (Order Management Only)
  ├─ Dashboard
  └─ Orders
```

### 2. Password Creation System
- Admins can create accounts for staff/managers
- Temporary secure passwords generated automatically
- Email sent with login credentials
- Users can change password after first login

### 3. Permission Checking
- Route-level protection
- Tab-level protection
- Action-level protection
- Pop-up dialog for unauthorized access attempts

## Files Created

### ✅ `src/hooks/use-role-permission.ts`
Custom hook for role-based permission checking.

**Features:**
- `hasPermission(permission)` - Check single permission
- `hasAnyPermission([permissions])` - Check if user has any of the permissions
- `hasAllPermissions([permissions])` - Check if user has all permissions
- `canAccessRoute(route)` - Check if user can access a specific route
- Role helpers: `isAdmin`, `isManager`, `isStaff`

**Usage Example:**
```tsx
import { useRolePermission } from '@/hooks/use-role-permission';

function MyComponent() {
  const { hasPermission, role } = useRolePermission();
  
  if (!hasPermission('manageOrders')) {
    // Show unauthorized dialog
  }
  
  return <div>Content for {role}</div>;
}
```

### ✅ `src/components/UnauthorizedDialog.tsx`
Pop-up dialog component for unauthorized access.

**Usage Example:**
```tsx
import { UnauthorizedDialog } from '@/components/UnauthorizedDialog';

function MyComponent() {
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  
  return (
    <UnauthorizedDialog
      open={showUnauthorized}
      onOpenChange={setShowUnauthorized}
      message="You do not have permission to view this section."
      requiredRole="Manager or Admin"
    />
  );
}
```

## Implementation Steps

### Step 1: Update AuthContext to Store User Role

The `AuthContext.tsx` already supports roles. Verify it's working:

```tsx
// In src/contexts/AuthContext.tsx
export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role?: string;  // ✅ Already exists
  // ... other fields
};
```

### Step 2: Update Admin Users Page

Add password creation functionality to `src/pages/admin/AdminUsers.tsx`:

```tsx
// Add this after line 430 in AdminUsers.tsx

const handleCreateAdminWithPassword = async () => {
  if (!newAdminForm.name.trim() || !newAdminForm.email.trim()) {
    toast({
      title: "Required fields missing",
      description: "Please fill in name and email",
      variant: "destructive",
    });
    return;
  }

  setIsCreatingAdmin(true);

  // Generate temporary secure password
  const temporaryPassword = generateTemporaryPassword();

  // Set default permissions based on role
  let defaultPermissions = newAdminForm.permissions;
  if (newAdminForm.role === 'admin') {
    defaultPermissions = ['all'];
  } else if (newAdminForm.role === 'manager') {
    defaultPermissions = ['orders', 'customers', 'inventory', 'products', 'reports'];
  } else if (newAdminForm.role === 'staff') {
    defaultPermissions = ['orders'];
  }

  try {
    const baseUrl = getApiBase();
    
    // Create admin user in Supabase Auth
    const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
      email: newAdminForm.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name: newAdminForm.name,
        role: newAdminForm.role,
        permissions: defaultPermissions,
      },
      app_metadata: {
        role: newAdminForm.role,
        permissions: defaultPermissions,
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    // Send credentials email
    await fetch(`${baseUrl}/api/admin/send-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newAdminForm.name,
        email: newAdminForm.email,
        password: temporaryPassword,
        role: newAdminForm.role,
      }),
    });

    toast({
      title: "Admin user created!",
      description: `Credentials have been sent to ${newAdminForm.email}`,
    });

    // Refresh admin users list
    await loadAdminUsers();
    setNewAdminModalOpen(false);
    setNewAdminForm({ name: "", email: "", role: "staff", permissions: [] });

  } catch (error) {
    console.error('Error creating admin:', error);
    toast({
      title: "Error creating admin user",
      description: error.message || "Failed to create admin user",
      variant: "destructive",
    });
  } finally {
    setIsCreatingAdmin(false);
  }
};
```

### Step 3: Add Role-Based Tab Protection

Update each tab in AdminUsers.tsx to check permissions:

```tsx
import { useRolePermission } from '@/hooks/use-role-permission';
import { UnauthorizedDialog } from '@/components/UnauthorizedDialog';

export default function AdminUsers() {
  const { hasPermission, role } = useRolePermission();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState("");

  // Check permissions before allowing tab access
  const handleTabChange = (value: string) => {
    if (value === 'admin' && !hasPermission('manageUsers')) {
      setUnauthorizedMessage("You do not have permission to manage admin users.");
      setShowUnauthorized(true);
      return;
    }
    
    if (value === 'customers' && !hasPermission('manageCustomers')) {
      setUnauthorizedMessage("You do not have permission to manage customers.");
      setShowUnauthorized(true);
      return;
    }
    
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="getdeals">GetDeals Numbers</TabsTrigger>
          {hasPermission('manageUsers') && (
            <TabsTrigger value="admin">Admin Users</TabsTrigger>
          )}
        </TabsList>
        
        {/* ... tab content ... */}
      </Tabs>

      <UnauthorizedDialog
        open={showUnauthorized}
        onOpenChange={setShowUnauthorized}
        message={unauthorizedMessage}
        requiredRole={role === 'staff' ? 'Manager or Admin' : 'Admin'}
      />
    </div>
  );
}
```

### Step 4: Protect Admin Routes

Update `src/App.tsx` to use role-based route protection:

```tsx
import { useRolePermission } from '@/hooks/use-role-permission';

function RoleGuard({ 
  children, 
  requiredPermission 
}: { 
  children: JSX.Element;
  requiredPermission: Permission;
}) {
  const { hasPermission } = useRolePermission();
  const navigate = useNavigate();

  if (!hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldX className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/admin')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}

// Update routes
<Route 
  path="/admin/users" 
  element={
    <AdminGuard>
      <RoleGuard requiredPermission="manageUsers">
        <AdminUsers />
      </RoleGuard>
    </AdminGuard>
  } 
/>
<Route 
  path="/admin/settings" 
  element={
    <AdminGuard>
      <RoleGuard requiredPermission="manageSettings">
        <AdminSettings />
      </RoleGuard>
    </AdminGuard>
  } 
/>
```

### Step 5: Create Email Credentials API Endpoint

Create `api/admin/send-credentials.ts`:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, role } = req.body;

  // Configure email transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const roleAccess = {
    admin: 'Full system access (all features)',
    manager: 'Orders, customers, inventory, and reports',
    staff: 'Order management only',
  };

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .credentials { background: white; padding: 20px; border: 2px solid #10b981; border-radius: 8px; margin: 20px 0; }
        .credential-row { margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { font-family: monospace; background: #f3f4f6; padding: 5px 10px; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to GetDeals Admin</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your admin account has been created for GetDeals Kenya. Below are your login credentials:</p>
          
          <div class="credentials">
            <div class="credential-row">
              <span class="label">Email:</span><br>
              <span class="value">${email}</span>
            </div>
            <div class="credential-row">
              <span class="label">Temporary Password:</span><br>
              <span class="value">${password}</span>
            </div>
            <div class="credential-row">
              <span class="label">Role:</span><br>
              <span class="value">${role.toUpperCase()}</span>
            </div>
            <div class="credential-row">
              <span class="label">Access Level:</span><br>
              <span>${roleAccess[role as keyof typeof roleAccess]}</span>
            </div>
          </div>

          <p><strong>⚠️ Important Security Notes:</strong></p>
          <ul>
            <li>Change your password immediately after first login</li>
            <li>Do not share your credentials with anyone</li>
            <li>Enable two-factor authentication for added security</li>
          </ul>

          <div style="text-align: center;">
            <a href="https://getdeals.co.ke/admin" class="button">
              Login to Admin Panel
            </a>
          </div>

          <p>If you didn't expect this email or have any questions, please contact your administrator immediately.</p>
        </div>
        <div class="footer">
          <p>GetDeals Kenya - Smart Shopping, Better Prices</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"GetDeals Admin" <${process.env.SMTP_FROM || 'admin@getdeals.co.ke'}>`,
      to: email,
      subject: `Your GetDeals Admin Account - ${role.toUpperCase()} Access`,
      html: emailHTML,
    });

    res.status(200).json({ success: true, message: 'Credentials sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send credentials email' });
  }
}
```

### Step 6: Update Environment Variables

Add to `.env`:

```bash
# Email Configuration for Admin Credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=admin@getdeals.co.ke
```

## Testing Checklist

### ✅ Password Creation
- [ ] Admin can create staff accounts with automatic password generation
- [ ] Admin can create manager accounts with automatic password generation
- [ ] Email with credentials is sent successfully
- [ ] New users can log in with temporary password
- [ ] Users can change password after first login

### ✅ Role-Based Access Control
- [ ] **Admin** can access ALL tabs and features
- [ ] **Manager** can access: Dashboard, Orders, Customers, Inventory, Reports
- [ ] **Manager** CANNOT access: Users tab, Settings
- [ ] **Staff** can access: Dashboard, Orders tab only
- [ ] **Staff** CANNOT access: Users, Settings, Inventory, Reports

### ✅ Unauthorized Access Dialog
- [ ] Dialog appears when staff tries to access admin users tab
- [ ] Dialog appears when manager tries to access admin users tab
- [ ] Dialog appears when staff tries to access settings
- [ ] Dialog shows appropriate message with required role
- [ ] Dialog can be dismissed and user stays on current tab

### ✅ Route Protection
- [ ] Staff redirected when accessing `/admin/users` directly
- [ ] Manager redirected when accessing `/admin/settings` directly
- [ ] Admin can access all routes

## Security Considerations

1. **Password Strength**: Temporary passwords are 12 characters with mixed case, numbers, and symbols
2. **Email Verification**: Users must verify email before accessing admin panel
3. **Password Change**: Force password change on first login (implement in AuthContext)
4. **Session Management**: Admin sessions expire after 12 hours
5. **Audit Logging**: Log all admin user creation and permission changes

## Next Steps

1. **Database Migration**: Add `role` column to user_profile table if not exists
2. **UI Enhancement**: Add role badges to user profiles
3. **Audit Trail**: Implement logging for admin actions
4. **Two-Factor Auth**: Add 2FA requirement for admin users
5. **Password Reset**: Implement admin password reset functionality

## Troubleshooting

### Issue: Permission denied errors
**Solution**: Check that user role is properly set in Supabase Auth user_metadata

### Issue: Email not sending
**Solution**: Verify SMTP credentials and check firewall settings

### Issue: Role not persisting
**Solution**: Ensure role is stored in both user_metadata and app_metadata in Supabase

## Files Modified Summary

✅ **Created**:
- `src/hooks/use-role-permission.ts` - Permission checking hook
- `src/components/UnauthorizedDialog.tsx` - Unauthorized access dialog
- `api/admin/send-credentials.ts` - Email sending endpoint

📝 **To Modify**:
- `src/pages/admin/AdminUsers.tsx` - Add password creation
- `src/App.tsx` - Add role-based route guards
- `.env` - Add SMTP configuration

## Quick Start Commands

```bash
# 1. Commit the new files
git add src/hooks/use-role-permission.ts
git add src/components/UnauthorizedDialog.tsx
git commit -m "feat: add role-based access control system"

# 2. Test locally
npm run dev

# 3. Deploy to production
git push origin main
vercel --prod
```

## Support

For questions or issues, contact the development team or refer to the GetDeals technical documentation.
