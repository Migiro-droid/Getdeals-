// Authentication API service - Browser Compatible Version (Supabase)
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/lib/storage';

const TOKEN_KEY = 'auth_token';

function saveToken(token?: string | null) {
  if (!token) return storage.removeItem(TOKEN_KEY);
  storage.setItem(TOKEN_KEY, token);
}

function getToken(): string | null {
  return storage.getItem(TOKEN_KEY);
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'customer' | 'admin';
  isVerified?: boolean;
  createdAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser | null;
  token?: string | null;
  message?: string;
  error?: string;
}

export const authAPI = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) return { success: false, error: error.message };

      const session = (data as any)?.session ?? null;
      const user = (data as any)?.user ?? null;

      if (session?.access_token) saveToken(session.access_token);

      if (!user) return { success: false, error: 'No user returned' };

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        role: user.user_metadata?.role,
        isVerified: !!(user.email_confirmed_at || user.confirmed_at),
        createdAt: user.created_at ? new Date(user.created_at) : undefined,
      };

      return { success: true, user: authUser, token: session?.access_token ?? null };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: (err instanceof Error && err.message) || 'Login failed' };
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const { data: resData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) return { success: false, error: error.message };

      const session = (resData as any)?.session ?? null;
      let user = (resData as any)?.user ?? null;
      if (session?.access_token) saveToken(session.access_token);

      // If user returned, update metadata with provided fields
      if (user && (data.firstName || data.lastName || data.phone)) {
        try {
          const { data: updated, error: updErr } = await supabase.auth.updateUser({ data: { firstName: data.firstName, lastName: data.lastName, phone: data.phone, role: 'customer' } });
          if (!updErr) user = (updated as any)?.user ?? user;
        } catch (e) {
          console.warn('Failed to update user metadata after signup', e);
        }
      }

      const authUser: AuthUser | undefined = user ? {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        role: user.user_metadata?.role,
        isVerified: !!(user.email_confirmed_at || user.confirmed_at),
        createdAt: user.created_at ? new Date(user.created_at) : undefined,
      } : undefined;

      return { success: true, user: authUser ?? null, token: session?.access_token ?? null };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: (err instanceof Error && err.message) || 'Registration failed' };
    }
  },

  async verifyToken(token?: string): Promise<AuthResponse> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return { success: false, error: 'No active session' };
      if (session.access_token) saveToken(session.access_token);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return { success: false, error: 'User not found' };

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        role: user.user_metadata?.role,
        isVerified: !!(user.email_confirmed_at || user.confirmed_at),
        createdAt: user.created_at ? new Date(user.created_at) : undefined,
      };

      return { success: true, user: authUser, token: session.access_token };
    } catch (err) {
      console.error('verifyToken error:', err);
      return { success: false, error: (err instanceof Error && err.message) || 'Token verification failed' };
    }
  },

  async updateProfile(updates: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    currentPassword: string;
    newPassword: string;
  }>): Promise<AuthResponse> {
    try {
      const updateOpts: any = {};
      if (updates.newPassword) updateOpts.password = updates.newPassword;
      if (updates.firstName || updates.lastName || updates.phone) {
        updateOpts.data = {
          ...(updates.firstName ? { firstName: updates.firstName } : {}),
          ...(updates.lastName ? { lastName: updates.lastName } : {}),
          ...(updates.phone ? { phone: updates.phone } : {})
        };
      }

      const { data, error } = await supabase.auth.updateUser(updateOpts);
      if (error) return { success: false, error: error.message };

      const user = data.user;
      if (!user) return { success: false, error: 'User not returned' };

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        role: user.user_metadata?.role,
        isVerified: !!(user.email_confirmed_at || user.confirmed_at),
        createdAt: user.created_at ? new Date(user.created_at) : undefined,
      };

      return { success: true, user: authUser };
    } catch (err) {
      console.error('updateProfile error:', err);
      return { success: false, error: (err instanceof Error && err.message) || 'Profile update failed' };
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: (typeof window !== 'undefined' && window.location.origin) ? `${window.location.origin}/auth/reset-password` : undefined
      });
      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Password reset email sent if account exists' };
    } catch (err) {
      console.error('Password reset error:', err);
      return { success: false, error: (err instanceof Error && err.message) || 'Password reset request failed' };
    }
  }
};

export default authAPI;
