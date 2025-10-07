import type { User } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'staff' | 'manager';
export type AdminStatus = 'active' | 'inactive' | 'blocked';

export interface AdminProfileRow {
  user_id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
  getdeals_number?: string | null;
  metadata?: { [key: string]: any } | null;
  status?: string | null;
  account_status?: string | null;
  last_login_at?: string | null;
  last_sign_in_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
}

export interface AdminUserPayload {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLogin: string | null;
  permissions: string[];
  createdDate: string;
  phone?: string | null;
  organization?: string | null;
  getdealsNumber?: string | null;
  notes?: string | null;
}

const ROLE_ALIASES: Record<string, AdminRole> = {
  admin: 'admin',
  'super_admin': 'admin',
  'superadmin': 'admin',
  'super-admin': 'admin',
  owner: 'admin',
  director: 'admin',
  founder: 'admin',
  cofounder: 'admin',
  manager: 'manager',
  'operations_manager': 'manager',
  operations: 'manager',
  ops: 'manager',
  lead: 'manager',
  supervisor: 'manager',
  staff: 'staff',
  support: 'staff',
  agent: 'staff',
  'customer_support': 'staff',
  cs: 'staff',
  analyst: 'staff',
};

const ADMIN_ROLE_CANDIDATES = new Set<string>([
  ...Object.keys(ROLE_ALIASES),
  'admin',
  'manager',
  'staff',
  'support',
  'team_lead',
  'operations',
  'ops',
  'finance',
  'supervisor',
  'leader',
  'director',
  'owner',
  'founder',
  'cofounder',
]);

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  admin: ['all'],
  manager: ['orders', 'customers', 'inventory', 'reports'],
  staff: ['orders'],
};

export const ADMIN_EMAIL_FALLBACK = new Set(
  (process.env.ADMIN_EMAIL_WHITELIST || 'admin@getdeals.co.ke')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function toLower(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return String(value).toLowerCase();
}

export function normalizeRole(role?: string | null): AdminRole {
  const normalized = toLower(role) ?? '';
  if (normalized in ROLE_ALIASES) {
    return ROLE_ALIASES[normalized];
  }
  if (normalized.includes('manager')) {
    return 'manager';
  }
  if (
    normalized.includes('staff') ||
    normalized.includes('support') ||
    normalized.includes('agent') ||
    normalized.includes('cs')
  ) {
    return 'staff';
  }
  return 'admin';
}

export function normalizeStatusInput(value: unknown): AdminStatus | null {
  const normalized = toLower(value);
  if (!normalized) {
    return null;
  }
  if (['blocked', 'disabled', 'suspended', 'banned', 'locked'].includes(normalized)) {
    return 'blocked';
  }
  if (['inactive', 'deactivated', 'pending', 'paused', 'archived', 'offboarded'].includes(normalized)) {
    return 'inactive';
  }
  return 'active';
}

function deriveStatus(metadata: Record<string, any>, profile?: AdminProfileRow): AdminStatus {
  const statusCandidates = [
    metadata.admin_status,
    metadata.status,
    metadata.account_status,
    profile?.status,
    profile?.account_status,
  ];

  const normalized = statusCandidates
    .map((candidate) => normalizeStatusInput(candidate))
    .filter(Boolean) as AdminStatus[];

  if (profile?.is_active === false) {
    normalized.push('inactive');
  }

  if (normalized.includes('blocked')) {
    return 'blocked';
  }
  if (normalized.includes('inactive')) {
    return 'inactive';
  }
  return 'active';
}

function determinePermissions(
  metadata: Record<string, any>,
  profile: AdminProfileRow | undefined,
  role: AdminRole,
): string[] {
  const rawPermissions =
    metadata.permissions ?? metadata.admin_permissions ?? profile?.metadata?.permissions;

  let permissions: string[] = [];

  if (Array.isArray(rawPermissions)) {
    permissions = rawPermissions.map((item) => String(item));
  } else if (typeof rawPermissions === 'string') {
    permissions = rawPermissions
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (permissions.some((permission) => permission.toLowerCase() === 'all')) {
    return ['all'];
  }

  if (!permissions.length) {
    return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  }

  return Array.from(new Set(permissions));
}

function buildAdminName(
  user: User,
  profile: AdminProfileRow | null | undefined,
  metadata: Record<string, any>,
): string {
  const explicitName =
    metadata.name ||
    metadata.full_name ||
    metadata.display_name ||
    profile?.full_name ||
    null;

  if (explicitName && typeof explicitName === 'string' && explicitName.trim().length > 0) {
    return explicitName.trim();
  }

  const first = metadata.first_name || profile?.first_name;
  const last = metadata.last_name || profile?.last_name;
  const parts = [first, last]
    .map((value) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : null))
    .filter(Boolean) as string[];

  if (parts.length) {
    return parts.join(' ');
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return 'Admin User';
}

function inferLastLogin(
  metadata: Record<string, any>,
  profile: AdminProfileRow | null | undefined,
  user: User,
): string | null {
  const candidate =
    metadata.last_login_at ||
    metadata.last_sign_in_at ||
    profile?.last_login_at ||
    profile?.last_sign_in_at ||
    user.last_sign_in_at ||
    user.updated_at;

  return candidate ?? null;
}

export function normalizeAdminUser(
  user: User,
  profile?: AdminProfileRow | null,
): AdminUserPayload {
  const metadata = (user.user_metadata ?? {}) as Record<string, any>;
  const role = normalizeRole(
    metadata.role ?? metadata.admin_role ?? profile?.metadata?.role ?? metadata.primary_role ?? null,
  );
  const normalizedProfile = profile ?? undefined;
  const status = deriveStatus(metadata, normalizedProfile);
  const permissions = determinePermissions(metadata, normalizedProfile, role);
  const name = buildAdminName(user, normalizedProfile, metadata);
  const lastLogin = inferLastLogin(metadata, normalizedProfile, user);

  const phone = metadata.phone ?? metadata.contact_phone ?? normalizedProfile?.phone ?? null;
  const organization = metadata.organization ?? normalizedProfile?.organization ?? null;
  const getdealsNumber = metadata.getdeals_number ?? normalizedProfile?.getdeals_number ?? null;
  const notes = metadata.notes ?? normalizedProfile?.metadata?.notes ?? null;

  return {
    id: user.id,
    name,
    email: user.email ?? '',
    role,
    status,
    lastLogin,
    permissions,
    createdDate: user.created_at ?? new Date().toISOString(),
    phone,
    organization,
    getdealsNumber,
    notes,
  };
}

export async function fetchAdminProfiles(
  client: any,
  ids: string[],
): Promise<Map<string, AdminProfileRow>> {
  const result = new Map<string, AdminProfileRow>();
  if (!client || ids.length === 0) {
    return result;
  }

  try {
    const { data, error } = await client
      .from('user_profile')
      .select(
        `
        user_id,
        full_name,
        first_name,
        last_name,
        email,
        phone,
        organization,
        getdeals_number,
        metadata,
        status,
        account_status,
        last_login_at,
        last_sign_in_at,
        updated_at,
        is_active
      `,
      )
      .in('user_id', ids);

    if (error) {
      console.error('[admin-users] Failed to load user_profile rows:', error);
      return result;
    }

    for (const row of (data ?? []) as AdminProfileRow[]) {
      result.set(row.user_id, row);
    }
  } catch (error) {
    console.error('[admin-users] Unexpected error loading user_profile rows:', error);
  }

  return result;
}

export function isAdminCandidate(user: User): boolean {
  const metadata = (user.user_metadata ?? {}) as Record<string, any>;

  const potentialRoles: string[] = [];
  const roleCandidates = [
    metadata.role,
    metadata.admin_role,
    metadata.user_role,
    metadata.primary_role,
  ];

  for (const candidate of roleCandidates) {
    if (!candidate) {
      continue;
    }
    if (Array.isArray(candidate)) {
      for (const value of candidate) {
        potentialRoles.push(String(value).toLowerCase());
      }
    } else {
      potentialRoles.push(String(candidate).toLowerCase());
    }
  }

  const appRoles = (user.app_metadata as any)?.roles ?? (user.app_metadata as any)?.role;
  if (appRoles) {
    if (Array.isArray(appRoles)) {
      for (const value of appRoles) {
        potentialRoles.push(String(value).toLowerCase());
      }
    } else {
      potentialRoles.push(String(appRoles).toLowerCase());
    }
  }

  if (potentialRoles.some((role) => ADMIN_ROLE_CANDIDATES.has(role))) {
    return true;
  }

  if (user.email && ADMIN_EMAIL_FALLBACK.has(user.email.toLowerCase())) {
    return true;
  }

  const flags = [metadata.is_admin, metadata.admin, metadata.staff, metadata.admin_access];
  if (flags.some((flag) => flag === true || flag === 'true')) {
    return true;
  }

  const permissions = metadata.permissions ?? metadata.admin_permissions;
  if (Array.isArray(permissions) && permissions.length > 0) {
    return true;
  }

  return false;
}

export function buildProfileStatusPatch(status: AdminStatus) {
  const timestamp = new Date().toISOString();
  switch (status) {
    case 'blocked':
      return { status: 'blocked', account_status: 'blocked', is_active: false, updated_at: timestamp };
    case 'inactive':
      return { status: 'inactive', account_status: 'inactive', is_active: false, updated_at: timestamp };
    default:
      return { status: 'active', account_status: 'active', is_active: true, updated_at: timestamp };
  }
}

export function splitName(fullName: string): { first_name: string | null; last_name: string | null } {
  const trimmed = (fullName || '').trim();
  if (!trimmed) {
    return { first_name: null, last_name: null };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: null };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' ') || null,
  };
}

export function sanitizePermissions(value: unknown, role: AdminRole): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item))));
  }
  if (typeof value === 'string') {
    const list = value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    return list.length ? Array.from(new Set(list)) : DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  }
  return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
}
