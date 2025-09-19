import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role?: string;
  createdAt?: string;
  twoFactorEnabled?: boolean;
  organization?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, phone: string, email: string, password: string, organization?: string) => Promise<void>;
  signOut: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  startTwoFactor: () => Promise<{ ok: boolean; qrImage?: string; error?: string }>;
  verifyTwoFactor: (code: string) => Promise<{ ok: boolean; error?: string }>;
  disableTwoFactor: () => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Development mode: disabled authentication
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>({
    id: 'dev-user-1',
    name: 'Development User',
    phone: '+254700123456',
    email: 'dev@getdeals.co.ke',
    role: 'admin'
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Skip authentication checks in development mode
  useEffect(() => {
    // Authentication disabled for development
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Authentication disabled - simulate successful login
    console.log('Authentication disabled - simulating login for:', email);
    return Promise.resolve();
  };

  const signUp = async (name: string, phone: string, email: string, password: string, organization?: string) => {
    // Authentication disabled - simulate successful signup
    console.log('Authentication disabled - simulating signup for:', email, 'organization:', organization);
    return Promise.resolve();
  };

  const signOut = () => {
    // Authentication disabled - just log the action
    console.log('Authentication disabled - simulating logout');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    // Authentication disabled - simulate success
    console.log('Authentication disabled - simulating password change');
    return Promise.resolve({ ok: true });
  };

  const startTwoFactor = async () => {
    // Authentication disabled - simulate 2FA setup
    console.log('Authentication disabled - simulating 2FA setup');
    return Promise.resolve({ ok: true, qrImage: 'data:image/png;base64,fake-qr-code' });
  };

  const verifyTwoFactor = async (code: string) => {
    // Authentication disabled - simulate 2FA verification
    console.log('Authentication disabled - simulating 2FA verification for code:', code);
    return Promise.resolve({ ok: true });
  };

  const disableTwoFactor = async () => {
    // Authentication disabled - simulate 2FA disable
    console.log('Authentication disabled - simulating 2FA disable');
    return Promise.resolve({ ok: true });
  };

  const isAuthenticated = useMemo(() => {
    // Always authenticated in development mode
    return true;
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loading,
    signIn,
    signUp,
    signOut,
    changePassword,
    startTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
