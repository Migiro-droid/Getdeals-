// Role-Based Access Control Hook
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type Permission =
  | 'all'
  | 'viewDashboard'
  | 'manageOrders'
  | 'manageCustomers'
  | 'manageInventory'
  | 'manageProducts'
  | 'manageUsers'
  | 'manageSettings'
  | 'manageReports'
  | 'manageWallet';

export type AdminRole = 'admin' | 'manager' | 'staff' | 'customer';

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  admin: ['all'], // Full system access
  manager: [
    'viewDashboard',
    'manageOrders',
    'manageCustomers',
    'manageInventory',
    'manageProducts',
    'manageReports',
  ], // Orders, customers, inventory
  staff: ['viewDashboard', 'manageOrders'], // Order management only
  customer: [], // No admin permissions
};

export function useRolePermission() {
  const { user, isAuthenticated } = useAuth();

  const role = useMemo((): AdminRole => {
    if (!isAuthenticated || !user) return 'customer';
    const userRole = user.role?.toLowerCase() as AdminRole;
    return ['admin', 'manager', 'staff'].includes(userRole) ? userRole : 'customer';
  }, [isAuthenticated, user]);

  const permissions = useMemo((): Permission[] => {
    return ROLE_PERMISSIONS[role] || [];
  }, [role]);

  const hasPermission = (permission: Permission): boolean => {
    // All permission grants everything
    if (permissions.includes('all')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (permissions.includes('all')) return true;
    return requiredPermissions.some((perm) => permissions.includes(perm));
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (permissions.includes('all')) return true;
    return requiredPermissions.every((perm) => permissions.includes(perm));
  };

  const canAccessRoute = (route: string): boolean => {
    const routePermissions: Record<string, Permission> = {
      '/admin': 'viewDashboard',
      '/admin/orders': 'manageOrders',
      '/admin/users': 'manageUsers',
      '/admin/settings': 'manageSettings',
      '/admin/products': 'manageProducts',
      '/admin/inventory': 'manageInventory',
      '/admin/inventory/out-of-stock': 'manageInventory',
    };

    const requiredPermission = routePermissions[route];
    if (!requiredPermission) return false;

    return hasPermission(requiredPermission);
  };

  return {
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isStaff: role === 'staff',
  };
}
