import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role?: string;
  createdAt?: string;
  twoFactorEnabled?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, phone: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  startTwoFactor: () => Promise<{ ok: boolean; qrImage?: string; error?: string }>;
  verifyTwoFactor: (code: string) => Promise<{ ok: boolean; error?: string }>;
  disableTwoFactor: () => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load profile');
        const data = await r.json();
        setUser(data.user);
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem('auth_token');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || 'Failed to sign in');
    }
    const data = await res.json();
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
  };

  const signUp = async (name: string, phone: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || 'Failed to sign up');
    }
    const data = await res.json();
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const changePassword: AuthContextType['changePassword'] = async (currentPassword, newPassword) => {
    if (!token) return { ok: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        return { ok: false, error: e.message || 'Failed to change password' };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to change password' };
    }
  };

  const startTwoFactor: AuthContextType['startTwoFactor'] = async () => {
    if (!token) return { ok: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        return { ok: false, error: e.message || 'Failed to start 2FA setup' };
      }
      const data = await res.json();
      return { ok: true, qrImage: data.qrImage };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to start 2FA setup' };
    }
  };

  const verifyTwoFactor: AuthContextType['verifyTwoFactor'] = async (code) => {
    if (!token) return { ok: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        return { ok: false, error: e.message || 'Invalid code' };
      }
      setUser((u) => (u ? { ...u, twoFactorEnabled: true } : u));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to verify 2FA' };
    }
  };

  const disableTwoFactor: AuthContextType['disableTwoFactor'] = async () => {
    if (!token) return { ok: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        return { ok: false, error: e.message || 'Failed to disable 2FA' };
      }
      setUser((u) => (u ? { ...u, twoFactorEnabled: false } : u));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to disable 2FA' };
    }
  };

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token && !!user, loading, signIn, signUp, signOut, changePassword, startTwoFactor, verifyTwoFactor, disableTwoFactor }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
