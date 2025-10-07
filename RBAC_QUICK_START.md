# 🚀 Quick Start: Implementing RBAC in GetDeals Admin

## 5-Minute Setup Guide

### Step 1: Copy this into AdminUsers.tsx (after imports)

```tsx
import { useRolePermission } from '@/hooks/use-role-permission';
import { UnauthorizedDialog } from '@/components/UnauthorizedDialog';

// Add to component state (around line 100)
const { hasPermission, role } = useRolePermission();
const [showUnauthorized, setShowUnauthorized] = useState(false);
const [unauthorizedMessage, setUnauthorizedMessage] = useState("");
```

### Step 2: Add Tab Protection (replace the Tabs onValueChange)

```tsx
const handleTabChange = (value: string) => {
  // Check permissions before switching tabs
  if (value === 'admin' && !hasPermission('manageUsers')) {
    setUnauthorizedMessage("You do not have permission to manage admin users. This section requires Admin access.");
    setShowUnauthorized(true);
    return; // Don't change tab
  }
  
  if (value === 'customers' && !hasPermission('manageCustomers')) {
    setUnauthorizedMessage("You do not have permission to manage customers. This section requires Manager or Admin access.");
    setShowUnauthorized(true);
    return;
  }
  
  setActiveTab(value);
};

// Update the Tabs component
<Tabs value={activeTab} onValueChange={handleTabChange}>
```

### Step 3: Hide/Show Admin Tab Based on Permission

```tsx
<TabsList>
  <TabsTrigger value="customers">
    <Users className="h-4 w-4 mr-2" />
    Customers
  </TabsTrigger>
  <TabsTrigger value="getdeals">
    <Hash className="h-4 w-4 mr-2" />
    GetDeals Numbers
  </TabsTrigger>
  {/* Only show admin tab if user has permission */}
  {hasPermission('manageUsers') && (
    <TabsTrigger value="admin">
      <Shield className="h-4 w-4 mr-2" />
      Admin Users
    </TabsTrigger>
  )}
</TabsList>
```

### Step 4: Add Unauthorized Dialog (before final closing div)

```tsx
{/* Unauthorized Access Dialog */}
<UnauthorizedDialog
  open={showUnauthorized}
  onOpenChange={setShowUnauthorized}
  message={unauthorizedMessage}
  requiredRole={
    role === 'staff' ? 'Manager or Admin' : 
    role === 'manager' ? 'Admin' : 
    'Higher privileges'
  }
/>
```

---

## Testing Instructions

### Test as Admin (Full Access)
1. Login with admin account
2. Navigate to /admin/users
3. ✅ Should see all 3 tabs (Customers, GetDeals Numbers, Admin Users)
4. ✅ Can click all tabs without restriction

### Test as Manager (Limited Access)
1. Login with manager account  
2. Navigate to /admin/users
3. ✅ Should see 2 tabs (Customers, GetDeals Numbers)
4. ❌ Should NOT see Admin Users tab
5. ✅ Can access Customers and GetDeals Numbers

### Test as Staff (Order Management Only)
1. Login with staff account
2. Navigate to /admin/users  
3. ❌ Should see error message or redirect
4. Or show Customers tab but clicking should show unauthorized dialog

---

## Role Permission Matrix

| Feature | Admin | Manager | Staff |
|---------|-------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ❌ |
| Products | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| **Admin Users** | ✅ | ❌ | ❌ |
| **Settings** | ✅ | ❌ | ❌ |

---

## Complete Code Example

```tsx
// src/pages/admin/AdminUsers.tsx

import { useRolePermission } from '@/hooks/use-role-permission';
import { UnauthorizedDialog } from '@/components/UnauthorizedDialog';

export default function AdminUsers() {
  // ... existing code ...
  
  // ADD THESE
  const { hasPermission, role } = useRolePermission();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState("");

  // ADD THIS FUNCTION
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage customers and admin users
        </p>
      </div>

      {/* MODIFY THIS */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="getdeals">
            <Hash className="h-4 w-4 mr-2" />
            GetDeals Numbers
          </TabsTrigger>
          
          {/* CONDITIONALLY SHOW ADMIN TAB */}
          {hasPermission('manageUsers') && (
            <TabsTrigger value="admin">
              <Shield className="h-4 w-4 mr-2" />
              Admin Users
            </TabsTrigger>
          )}
        </TabsList>

        {/* ... existing tab content ... */}
      </Tabs>

      {/* ADD THIS AT THE END */}
      <UnauthorizedDialog
        open={showUnauthorized}
        onOpenChange={setShowUnauthorized}
        message={unauthorizedMessage}
        requiredRole={
          role === 'staff' ? 'Manager or Admin' : 
          role === 'manager' ? 'Admin' : 
          'Higher privileges'
        }
      />
    </div>
  );
}
```

---

## Protecting Other Admin Pages

### Example: AdminSettings.tsx

```tsx
import { useRolePermission } from '@/hooks/use-role-permission';

export default function AdminSettings() {
  const { hasPermission } = useRolePermission();
  const navigate = useNavigate();

  // Check permission on component mount
  useEffect(() => {
    if (!hasPermission('manageSettings')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access settings.",
        variant: "destructive",
      });
      navigate('/admin');
    }
  }, [hasPermission, navigate]);

  if (!hasPermission('manageSettings')) {
    return <div>Loading...</div>;
  }

  return (
    // ... settings page content ...
  );
}
```

---

## Troubleshooting

### Issue: Permission check always returns false
**Solution**: Check that user role is set correctly in AuthContext
```tsx
// In browser console:
console.log(user.role); // Should be 'admin', 'manager', or 'staff'
```

### Issue: Dialog doesn't appear
**Solution**: Check that useState is properly initialized
```tsx
const [showUnauthorized, setShowUnauthorized] = useState(false);
// Make sure this is inside the component, not outside
```

### Issue: Tab still switches even though unauthorized
**Solution**: Make sure to `return` after setting unauthorized state
```tsx
if (!hasPermission('manageUsers')) {
  setShowUnauthorized(true);
  return; // IMPORTANT: Don't forget this!
}
```

---

## Next: Password Creation

After RBAC is working, implement password creation:

1. Add password generation function
2. Create Supabase admin user
3. Send email with credentials
4. Test full flow

See `RBAC_IMPLEMENTATION_GUIDE.md` Section "Step 2" for details.

---

**Estimated Implementation Time**: 15-30 minutes
**Difficulty**: Easy (copy-paste with minor adjustments)
**Files to Modify**: 1 (AdminUsers.tsx)
**Dependencies**: Already created (hook + dialog component)

**Ready to implement? Start with Step 1!** 🚀
