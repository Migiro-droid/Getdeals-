import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  fetchAdminProfiles,
  isAdminCandidate,
  normalizeAdminUser,
  AdminUserPayload,
} from '../../../server/utils/admin-users';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: SupabaseClient | null = null;
if (supabaseUrl && serviceRoleKey) {
  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
  console.warn('[admin/users] Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY.');
}

function parseNumberQuery(value: string | string[] | undefined, fallback: number, min = 1, max = 1000) {
  if (!value) {
    return fallback;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '', 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

async function collectAdminUsers(perPage: number): Promise<AdminUserPayload[]> {
  if (!supabaseClient) {
    throw new Error('Supabase client not configured');
  }

  const allUsers: any[] = [];
  let page = 1;
  let iterations = 0;

  while (iterations < 25) {
    iterations += 1;
    const { data, error } = await supabaseClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const batch = data?.users ?? [];
    allUsers.push(...batch);

    if (!data?.nextPage) {
      break;
    }

    page = data.nextPage;
    if (!page || page <= 0) {
      break;
    }
  }

  const candidates = allUsers.filter((user) => isAdminCandidate(user));
  const ids = candidates.map((user) => user.id).filter(Boolean);
  const profileMap = await fetchAdminProfiles(supabaseClient, ids);
  
  const payload = candidates
    .map((user) => normalizeAdminUser(user, profileMap.get(user.id) ?? null))
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

  return payload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseClient) {
    return res.status(500).json({ success: false, error: 'Supabase is not configured' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const perPage = parseNumberQuery(req.query.perPage, 200, 1, 1000);
    const users = await collectAdminUsers(perPage);

    const summary = users.reduce(
      (acc, user) => {
        acc.total += 1;
        acc.byRole[user.role] = (acc.byRole[user.role] ?? 0) + 1;
        acc.byStatus[user.status] = (acc.byStatus[user.status] ?? 0) + 1;
        return acc;
      },
      { total: 0, byRole: {} as Record<string, number>, byStatus: {} as Record<string, number> },
    );

    return res.status(200).json({ success: true, users, summary });
  } catch (error) {
    console.error('[admin/users] Failed to fetch admin users:', error);
    return res.status(500).json({ success: false, error: 'Failed to load admin users' });
  }
}
