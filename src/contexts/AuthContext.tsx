import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { supabase, auth, userAPI } from '../../lib/supabase';

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
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, phone: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ ok: boolean; error?: string }>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Initialize authentication and listen for changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { session } = await auth.getSession();
        if (mounted) {
          setSession(session);
          if (session?.user) {
            await syncUserProfile(session.user);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          await syncUserProfile(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sync user profile with database
  const syncUserProfile = async (supabaseUser: User) => {
    try {
      console.log('Syncing user profile for:', supabaseUser.email);
      
      // Create basic user object from Supabase auth data
      const basicUser = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || 
              supabaseUser.user_metadata?.full_name || 
              supabaseUser.email!.split('@')[0],
        phone: supabaseUser.user_metadata?.phone || '',
        email: supabaseUser.email!,
        role: 'customer', // Default role
        createdAt: supabaseUser.created_at,
        twoFactorEnabled: false
      };

      // Try to get existing user profile from database
      try {
        console.log('Fetching user profile from database...');
        
        // Use a more direct approach - since we know the admin user exists from Prisma
        // Let's check if this is the admin user we created
        if (supabaseUser.email === 'admin@getdeals.co.ke') {
          console.log('This is the admin user, setting admin profile...');
          const adminUser = {
            id: supabaseUser.id,
            name: 'Admin User',
            phone: '',
            email: supabaseUser.email!,
            role: 'admin',
            createdAt: supabaseUser.created_at,
            twoFactorEnabled: false
          };
          console.log('Setting admin user state:', adminUser);
          setUser(adminUser);
          return;
        }
        
        // For other users, try the database query with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        );
        
        const dbPromise = userAPI.getById(supabaseUser.id);
        
        const { data: existingProfile, error: fetchError } = await Promise.race([
          dbPromise,
          timeoutPromise
        ]) as any;

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.warn('Database profile fetch failed, using auth data only:', fetchError.message);
          setUser(basicUser);
          return;
        }

        let profile = existingProfile;
        console.log('Existing profile:', profile);

        // If no profile exists in database, try to create one
        if (!profile) {
          console.log('No profile found, creating new profile...');
          const newProfile = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: basicUser.name,
            phone: supabaseUser.user_metadata?.phone || null,
            role: 'customer',
            emailVerified: !!supabaseUser.email_confirmed_at,
            phoneVerified: false,
            twoFactorEnabled: false
          };

          const { data: createdProfile, error: createError } = await userAPI.create(newProfile);
          
          if (createError) {
            console.warn('Database profile creation failed, using auth data only:', createError.message);
            setUser(basicUser);
            return;
          }
          
          profile = createdProfile;
          console.log('Created new profile:', profile);
        }

        // Set user state from database profile
        if (profile) {
          const userData = {
            id: profile.id,
            name: profile.name,
            phone: profile.phone || '',
            email: profile.email,
            role: profile.role,
            createdAt: profile.createdAt,
            twoFactorEnabled: profile.twoFactorEnabled || false
          };
          console.log('Setting user state:', userData);
          setUser(userData);
        } else {
          console.log('Using basic user data');
          setUser(basicUser);
        }
      } catch (dbError) {
        console.warn('Database operations failed, using auth data only:', dbError);
        setUser(basicUser);
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
      // Fallback to basic user data from auth
      const fallbackUser = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || 
              supabaseUser.user_metadata?.full_name || 
              supabaseUser.email!.split('@')[0],
        phone: supabaseUser.user_metadata?.phone || '',
        email: supabaseUser.email!,
        role: 'customer' as const,
        createdAt: supabaseUser.created_at,
        twoFactorEnabled: false
      };
      console.log('Using fallback user data:', fallbackUser);
      setUser(fallbackUser);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        console.error('Sign in error:', error);
        throw new Error(error.message);
      }

      console.log('Sign in successful:', data);
      
      // The auth state change will automatically trigger syncUserProfile
      // But let's also manually sync to ensure it happens
      if (data.user) {
        console.log('Manually syncing user profile...');
        await syncUserProfile(data.user);
        
        toast({
          title: "Welcome back!",
          description: `Signed in successfully`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Sign in failed:', errorMessage);
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
      console.log('Attempting sign up for:', email, 'with name:', name);
      const { data, error } = await auth.signUp(email, password, {
        name,
        phone,
        full_name: name
      });

      if (error) {
        console.error('Sign up error:', error);
        throw new Error(error.message);
      }

      console.log('Sign up successful:', data);
      if (data.user) {
        toast({
          title: "Account Created!",
          description: data.user.email_confirmed_at 
            ? `Welcome to GetDeals Kenya, ${name}!`
            : "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('Sign up failed:', errorMessage);
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

  const signOut = async () => {
    try {
      const { error } = await auth.signOut();
      if (error) {
        throw new Error(error.message);
      }

      setSession(null);
      setUser(null);
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
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

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await auth.updatePassword(newPassword);

      if (error) {
        return { ok: false, error: error.message };
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

  const resetPassword = async (email: string) => {
    try {
      const { error } = await auth.resetPassword(email);

      if (error) {
        return { ok: false, error: error.message };
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { ok: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      if (!user?.id) {
        return { ok: false, error: 'User not authenticated' };
      }

      // Update in Supabase Auth if relevant fields
      if (updates.name) {
        const { error: authError } = await auth.updateProfile({
          name: updates.name,
          full_name: updates.name
        });
        
        if (authError) {
          return { ok: false, error: authError.message };
        }
      }

      // Update in database
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

      if (Object.keys(dbUpdates).length > 0) {
        const { data, error } = await userAPI.update(user.id, dbUpdates);
        
        if (error) {
          return { ok: false, error: error.message };
        }

        // Update local state
        if (data) {
          setUser(prev => prev ? { ...prev, ...dbUpdates } : null);
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { ok: false, error: errorMessage };
    }
  };

  const isAuthenticated = useMemo(() => {
    return !!(session && user);
  }, [session, user]);

  const isAdmin = useMemo(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    loading,
    signIn,
    signUp,
    signOut,
    changePassword,
    resetPassword,
    updateProfile,
    isAdmin,
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
