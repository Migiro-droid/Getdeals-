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
  preferences?: string;
  onboardingCompleted?: boolean;
  organization?: string;
  organizationNumber?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, phone: string, email: string, password: string, organization?: string, organizationNumber?: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  updatePasswordAfterReset: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<{ ok: boolean; error?: string }>;
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
        // Get role from user_metadata or app_metadata, default to 'customer'
        role: supabaseUser.user_metadata?.role || 
              (supabaseUser as any).app_metadata?.role || 
              'customer',
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

        if (!profile) {
          console.log('No profile found, creating new profile...');
          const newProfile = {
            id: supabaseUser.id,
            user_id: supabaseUser.id, 
            email: supabaseUser.email!,
            first_name: basicUser.name?.split(' ')[0] || supabaseUser.email!.split('@')[0],
            last_name: basicUser.name?.split(' ').slice(1).join(' ') || '',
            phone: supabaseUser.user_metadata?.phone || null,
            organization: supabaseUser.user_metadata?.organization || null,
            organization_number: supabaseUser.user_metadata?.organization_number || null,
            email_verified: !!supabaseUser.email_confirmed_at,
            customer_id: null, // Will be set by Rukisha during KYC registration
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
            organization: profile.organization || '',
            organizationNumber: profile.organization_number || '',
            createdAt: profile.createdAt,
            twoFactorEnabled: profile.twoFactorEnabled || false,
            preferences: profile.preferences,
            onboardingCompleted: profile.onboardingCompleted || false
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

  const signUp = async (name: string, phone: string, email: string, password: string, organization?: string, organizationNumber?: string) => {
    setLoading(true);
    try {
      console.log('Attempting sign up for:', email, 'with name:', name, 'organization:', organization, 'organizationNumber:', organizationNumber);
      
      // Determine the redirect URL based on environment
      const baseUrl = import.meta.env.PROD 
        ? 'https://getdeals.co.ke' 
        : window.location.origin;
      
      const { data, error } = await auth.signUp(email, password, {
        data: {
          name,
          phone,
          full_name: name,
          organization: organization || null,
          organization_number: organizationNumber || null
        },
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        throw new Error(error.message);
      }

      console.log('Sign up successful:', data);
      if (data.user) {
        // Send welcome email notification
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'welcome',
              recipientEmail: email,
              data: {
                name,
                email,
                organization: organization || 'Not specified'
              }
            })
          });

          // Add contact to Brevo mailing list
          await fetch('/api/email/add-contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              firstName: name.split(' ')[0],
              lastName: name.split(' ').slice(1).join(' '),
              attributes: {
                PHONE: phone,
                ORGANIZATION: organization || '',
                ORGANIZATION_NUMBER: organizationNumber || '',
                SIGNUP_DATE: new Date().toISOString(),
                SIGNUP_METHOD: 'website'
              }
            })
          });

          console.log('📧 Welcome email and contact addition initiated');
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError);
          // Don't fail registration because of email issues
        }

        toast({
          title: "Account Created!",
          description: data.user.email_confirmed_at 
            ? `Welcome to GetDeals Kenya, ${name}! Check your email for welcome information.`
            : "Please check your email to verify your account and for welcome information.",
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

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First, verify the current password by trying to re-authenticate
      if (!user?.email) {
        return { ok: false, error: 'No user email found' };
      }

      console.log('🔐 Verifying current password...');
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        console.error('❌ Current password verification failed:', verifyError);
        return { ok: false, error: 'Current password is incorrect' };
      }

      console.log('✅ Current password verified, updating to new password...');

      // Now update to the new password
      const { error } = await auth.updatePassword(newPassword);

      if (error) {
        console.error('❌ Password update failed:', error);
        return { ok: false, error: error.message };
      }

      console.log('✅ Password updated successfully');

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      return { ok: true };
    } catch (error) {
      console.error('❌ Password change error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      return { ok: false, error: errorMessage };
    }
  };

  const updatePasswordAfterReset = async (newPassword: string) => {
    try {
      console.log('🔐 Updating password after reset...');

      // This is used when user is already authenticated via password reset link
      // No need to verify current password
      const { error } = await auth.updatePassword(newPassword);

      if (error) {
        console.error('❌ Password update failed:', error);
        return { ok: false, error: error.message };
      }

      console.log('✅ Password updated successfully');

      toast({
        title: "Password Updated",
        description: "Your password has been reset successfully.",
      });

      return { ok: true };
    } catch (error) {
      console.error('❌ Password update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      return { ok: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔄 Starting password reset for:', email);
      
      // Determine the redirect URL based on environment
      const baseUrl = import.meta.env.PROD 
        ? 'https://getdeals.co.ke' 
        : window.location.origin;
      
      const redirectUrl = `${baseUrl}/auth/reset-password`;
      console.log('📍 Using redirect URL:', redirectUrl);
      console.log('🌍 Environment:', { 
        isProd: import.meta.env.PROD, 
        mode: import.meta.env.MODE,
        origin: window.location.origin 
      });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { ok: false, error: error.message };
      }

      console.log('✅ Password reset request successful');
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      console.error('🚨 Password reset exception:', error);
      return { ok: false, error: errorMessage };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    try {
      // Determine the redirect URL based on environment
      const baseUrl = import.meta.env.PROD 
        ? 'https://getdeals.co.ke' 
        : window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${baseUrl}/auth/callback`
        }
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth sign in failed';
      return { ok: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      if (!user?.id) {
        return { ok: false, error: 'User not authenticated' };
      }

      // Update in Supabase Auth if relevant fields
      if (updates.name || updates.organization !== undefined || updates.organizationNumber !== undefined || updates.preferences !== undefined || updates.onboardingCompleted !== undefined) {
        const authMetadata: any = {};
        if (updates.name) {
          authMetadata.name = updates.name;
          authMetadata.full_name = updates.name;
        }
        if (updates.organization !== undefined) authMetadata.organization = updates.organization;
        if (updates.organizationNumber !== undefined) authMetadata.organization_number = updates.organizationNumber;
        if (updates.preferences !== undefined) authMetadata.preferences = updates.preferences;
        if (updates.onboardingCompleted !== undefined) authMetadata.onboardingCompleted = updates.onboardingCompleted;
        
        const { error: authError } = await supabase.auth.updateUser({
          data: authMetadata
        });
        
        if (authError) {
          console.warn('Failed to update auth metadata:', authError);
          // Don't fail the whole update if auth metadata update fails
        }
      }

      // Update in database
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;
      if (updates.onboardingCompleted !== undefined) dbUpdates.onboardingCompleted = updates.onboardingCompleted;
      if (updates.organization !== undefined) dbUpdates.organization = updates.organization;
      if (updates.organizationNumber !== undefined) dbUpdates.organization_number = updates.organizationNumber;

      if (Object.keys(dbUpdates).length > 0) {
        const { data, error } = await userAPI.update(user.id, dbUpdates);
        
        if (error) {
          return { ok: false, error: error.message };
        }

        // Update local state
        if (data) {
          const stateUpdates: any = { ...dbUpdates };
          // Map database fields to AuthUser fields
          if (dbUpdates.organization_number !== undefined) {
            stateUpdates.organizationNumber = dbUpdates.organization_number;
            delete stateUpdates.organization_number;
          }
          setUser(prev => prev ? { ...prev, ...stateUpdates } : null);
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
    updatePasswordAfterReset,
    resetPassword,
    signInWithOAuth,
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
