import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authAPI, type AuthUser as APIAuthUser } from '@/api/auth';

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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        try {
          // Verify token is still valid using local API
          const result = await authAPI.verifyToken(storedToken);
          
          if (result.success && result.user) {
            setToken(storedToken);
            setUser({
              id: result.user.id,
              name: `${result.user.firstName} ${result.user.lastName}`,
              phone: '', // Will be loaded from user profile
              email: result.user.email,
              role: result.user.role,
              createdAt: result.user.createdAt.toISOString(),
              twoFactorEnabled: false
            });
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authAPI.login({ email, password });

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      if (result.token && result.user) {
        setToken(result.token);
        const authUser: AuthUser = {
          id: result.user.id,
          name: `${result.user.firstName} ${result.user.lastName}`,
          phone: '', // Will be loaded from user profile
          email: result.user.email,
          role: result.user.role,
          createdAt: result.user.createdAt.toISOString(),
          twoFactorEnabled: false
        };
        setUser(authUser);
        
        // Store in localStorage
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(authUser));

        toast({
          title: "Welcome back!",
          description: `Signed in as ${result.user.firstName} ${result.user.lastName}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, phone: string, email: string, password: string) => {
    setLoading(true);
    try {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      console.log('Registration attempt:', { firstName, lastName, email, phone: phone || 'empty' });
      
      const result = await authAPI.register({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined
      });

      console.log('Registration result:', result);

      if (!result.success) {
        console.error('Registration failed:', result.error);
        throw new Error(result.error || 'Registration failed');
      }

      if (result.token && result.user) {
        setToken(result.token);
        const authUser: AuthUser = {
          id: result.user.id,
          name: `${result.user.firstName} ${result.user.lastName}`,
          phone: phone || '',
          email: result.user.email,
          role: result.user.role,
          createdAt: result.user.createdAt.toISOString(),
          twoFactorEnabled: false
        };
        setUser(authUser);
        
        // Store in localStorage
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(authUser));

        toast({
          title: "Account Created!",
          description: `Welcome to GetDeals Kenya, ${result.user.firstName}!`,
        });
      }
    } catch (error) {
      console.error('SignUp error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user?.id) {
        return { ok: false, error: 'User not authenticated' };
      }

      const result = await authAPI.updateProfile(user.id, {
        currentPassword,
        newPassword
      });

      if (!result.success) {
        return { ok: false, error: result.error || 'Password change failed' };
      }

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      return { ok: false, error: errorMessage };
    }
  };

  const startTwoFactor = async () => {
    try {
      // Placeholder implementation - 2FA setup not fully implemented yet
      toast({
        title: "2FA Setup",
        description: "Two-factor authentication setup is coming soon.",
      });
      return { ok: false, error: "2FA setup not yet implemented" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA setup failed';
      return { ok: false, error: errorMessage };
    }
  };

  const verifyTwoFactor = async (code: string) => {
    try {
      // Placeholder implementation - 2FA verification not fully implemented yet
      toast({
        title: "2FA Verification",
        description: "Two-factor authentication verification is coming soon.",
      });
      return { ok: false, error: "2FA verification not yet implemented" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA verification failed';
      return { ok: false, error: errorMessage };
    }
  };

  const disableTwoFactor = async () => {
    try {
      // Placeholder implementation - 2FA disable not fully implemented yet
      toast({
        title: "2FA Disable",
        description: "Two-factor authentication disable is coming soon.",
      });
      return { ok: false, error: "2FA disable not yet implemented" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA disable failed';
      return { ok: false, error: errorMessage };
    }
  };

  const isAuthenticated = useMemo(() => {
    return !!(token && user);
  }, [token, user]);

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
