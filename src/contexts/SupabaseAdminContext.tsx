import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AdminSettings = {
  black_friday_enabled: boolean;
  black_friday_date: string;
  maintenance_mode: boolean;
  support_phone: string;
  support_email: string;
  location: string;
};

type SupabaseAdminContextType = {
  settings: AdminSettings;
  loading: boolean;
  updateSettings: (updates: Partial<AdminSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const SupabaseAdminContext = createContext<SupabaseAdminContextType | undefined>(undefined);

export function SupabaseAdminProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>({
    black_friday_enabled: true,
    black_friday_date: '2025-11-28T00:00:00Z',
    maintenance_mode: false,
    support_phone: '+254 700 123 456',
    support_email: 'support@getdeals.co.ke',
    location: 'Karen Green, Nairobi, Kenya',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setSettings({
          black_friday_enabled: data.black_friday_enabled,
          black_friday_date: data.black_friday_date,
          maintenance_mode: data.maintenance_mode,
          support_phone: data.support_phone,
          support_email: data.support_email,
          location: data.location,
        });
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<AdminSettings>) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          id: 'default',
          ...updates
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...updates }));
      
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating admin settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  const value: SupabaseAdminContextType = {
    settings,
    loading,
    updateSettings,
    refreshSettings,
  };

  return (
    <SupabaseAdminContext.Provider value={value}>
      {children}
    </SupabaseAdminContext.Provider>
  );
}

export function useSupabaseAdmin() {
  const context = useContext(SupabaseAdminContext);
  if (context === undefined) {
    throw new Error('useSupabaseAdmin must be used within a SupabaseAdminProvider');
  }
  return context;
}