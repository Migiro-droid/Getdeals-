import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  fetchAdminProfiles,
  normalizeAdminUser,
  buildProfileStatusPatch,
  normalizeRole,
  normalizeStatusInput,
  sanitizePermissions,
  splitName,
} from '../../../server/utils/admin-users';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: SupabaseClient | null = null;
if (supabaseUrl && serviceRoleKey) {
  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
    console.warn('[admin/users/:id] Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY.');
}

type AdminUpdatePayload = {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  permissions?: string[] | string;
};

function getAdminId(req: VercelRequest): string | null {
  const value = req.query.id;
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
}

function parseBody(req: VercelRequest): AdminUpdatePayload {
  if (!req.body) {
    return {};
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      console.warn('[admin/users/:id] Failed to parse JSON body:', error);
      return {};
    }
  }
  return req.body as AdminUpdatePayload;
}

async function getAdminRecord(id: string) {
  if (!supabaseClient) {
    throw new Error('Supabase client not configured');
  }
  const { data, error } = await supabaseClient.auth.admin.getUserById(id);
  if (error) {
    throw error;
  }
  if (!data?.user) {
    const notFound = new Error('Admin user not found');
    (notFound as any).statusCode = 404;
    throw notFound;
  }
  const profileMap = await fetchAdminProfiles(supabaseClient, [id]);
  return { user: data.user, profile: profileMap.get(id) ?? null };
}

function coerceStatus(input: unknown, fallback: 'active' | 'inactive' | 'blocked'): 'active' | 'inactive' | 'blocked' {
  return normalizeStatusInput(input) ?? fallback;
}

async function updateAdminRecord(id: string, updates: AdminUpdatePayload) {
  if (!supabaseClient) {
    throw new Error('Supabase client not configured');
  }

  const { user, profile } = await getAdminRecord(id);
  const metadata = (user.user_metadata ?? {}) as Record<string, any>;

  const trimmedName = typeof updates.name === 'string' ? updates.name.trim() : undefined;
  const name = trimmedName && trimmedName.length > 0
    ? trimmedName
    : metadata.name || metadata.full_name || profile?.full_name || user.email || 'Admin User';

  const trimmedEmail = typeof updates.email === 'string' ? updates.email.trim() : undefined;
  const email = trimmedEmail && trimmedEmail.length > 0 ? trimmedEmail : user.email ?? '';

  const role = normalizeRole(updates.role ?? metadata.role ?? metadata.admin_role ?? null);
  const currentStatus = normalizeStatusInput(
    metadata.admin_status ?? metadata.status ?? metadata.account_status ?? profile?.status ?? profile?.account_status,
  ) ?? 'active';
  const status = coerceStatus(updates.status, currentStatus);
  const permissions = sanitizePermissions(
    updates.permissions ?? metadata.permissions ?? metadata.admin_permissions,
    role,
  );

  const metadataUpdates = {
    ...metadata,
    name,
    full_name: name,
    display_name: name,
    role,
    admin_role: role,
    primary_role: role,
    status,
    admin_status: status,
    account_status: status,
    permissions,
    admin_permissions: permissions,
    is_admin: role === 'admin' ? true : metadata.is_admin ?? false,
    staff: role !== 'admin' ? true : metadata.staff ?? false,
  };

  const updatePayload: any = {
    user_metadata: metadataUpdates,
  };

  if (email && email !== user.email) {
    updatePayload.email = email;
  }

  const { data: updated, error: updateError } = await supabaseClient.auth.admin.updateUserById(id, updatePayload);
  if (updateError) {
    throw updateError;
  }

  try {
    const nameParts = splitName(name);
    await supabaseClient
      .from('user_profile')
      .upsert(
        {
          user_id: id,
          full_name: name,
          email,
          ...nameParts,
          ...buildProfileStatusPatch(status),
        },
        { onConflict: 'user_id', ignoreDuplicates: false },
      );
  } catch (error) {
    console.error('[admin/users/:id] Failed to upsert user_profile row:', error);
  }

  const profileMap = await fetchAdminProfiles(supabaseClient, [id]);
  const hydratedProfile = profileMap.get(id) ?? null;
  return normalizeAdminUser(updated?.user ?? user, hydratedProfile);
}

async function deleteAdminRecord(id: string) {
  if (!supabaseClient) {
    throw new Error('Supabase client not configured');
  }

  const { error } = await supabaseClient.auth.admin.deleteUser(id);
  if (error) {
    throw error;
  }

  try {
    await supabaseClient
      .from('user_profile')
      .update({
        status: 'inactive',
        account_status: 'inactive',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', id);
  } catch (profileError) {
    console.error('[admin/users/:id] Failed to mark profile inactive:', profileError);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseClient) {
    return res.status(500).json({ success: false, error: 'Supabase is not configured' });
  }

  const adminId = getAdminId(req);
  if (!adminId) {
    return res.status(400).json({ success: false, error: 'Admin user ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { user, profile } = await getAdminRecord(adminId);
        const payload = normalizeAdminUser(user, profile);
        return res.status(200).json({ success: true, user: payload });
      }
      case 'PUT': {
        const body = parseBody(req);
        if (!body.name || !body.email) {
          return res.status(400).json({ success: false, error: 'Name and email are required' });
        }
        const updated = await updateAdminRecord(adminId, body);
        return res.status(200).json(updated);
      }
      case 'PATCH': {
        const body = parseBody(req);
        const updated = await updateAdminRecord(adminId, body);
        return res.status(200).json(updated);
      }
      case 'DELETE': {
        await deleteAdminRecord(adminId);
        return res.status(200).json({ success: true });
      }
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error: any) {
    const statusCode = error?.statusCode ?? 500;
    console.error(`[admin/users/:id] ${req.method} failed:`, error);
    const message = error?.message ?? 'Unexpected error';
    return res.status(statusCode).json({ success: false, error: message });
  }
}
