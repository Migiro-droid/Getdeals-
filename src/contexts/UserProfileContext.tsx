import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import UserProfileService from '../services/user-profile';
import type { UserProfile } from '../types/user-profile';

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isOrganizationNumberAvailable: (orgNumber: string) => Promise<boolean>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Load user profile when user changes
  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const subscription = UserProfileService.subscribeToUserProfile(
      user.id,
      (updatedProfile) => {
        setProfile(updatedProfile);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await UserProfileService.getCurrentUserProfile();
      setProfile(userProfile);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      setError(null);
      
      const updatedProfile = await UserProfileService.updateCurrentUserProfile(data);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const isOrganizationNumberAvailable = async (orgNumber: string): Promise<boolean> => {
    if (!orgNumber.trim()) return false;
    
    try {
      return await UserProfileService.isOrganizationNumberAvailable(
        orgNumber,
        user?.id
      );
    } catch (err) {
      console.error('Error checking organization number availability:', err);
      return false;
    }
  };

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
    isOrganizationNumberAvailable,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export default UserProfileProvider;