import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook that automatically syncs preferences from localStorage to database
 * after email confirmation and login
 */
export function useSyncPendingPreferences() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const syncPreferences = async () => {
      // Only run if user is logged in
      if (!user?.id) return;

      // Check if there are pending preferences in localStorage
      const pendingPreferences = localStorage.getItem('pendingPreferences');
      if (!pendingPreferences) return;

      console.log('🔄 Found pending preferences, syncing to database...');

      try {
        const preferences = JSON.parse(pendingPreferences);
        
        // Try to save to database
        const result = await updateProfile({
          preferences: JSON.stringify(preferences),
          onboardingCompleted: true
        } as any);

        if (result.ok) {
          console.log('✅ Pending preferences synced successfully');
          // Clear from localStorage
          localStorage.removeItem('pendingPreferences');
          
          toast({
            title: "Welcome back!",
            description: "Your preferences have been saved successfully.",
          });
        } else {
          // Try direct auth metadata update as fallback
          const { error } = await supabase.auth.updateUser({
            data: {
              preferences: JSON.stringify(preferences),
              onboardingCompleted: true
            }
          });

          if (!error) {
            console.log('✅ Pending preferences synced via auth metadata');
            localStorage.removeItem('pendingPreferences');
            
            toast({
              title: "Welcome back!",
              description: "Your preferences have been saved successfully.",
            });
          } else {
            console.warn('⚠️ Could not sync preferences:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error syncing pending preferences:', error);
      }
    };

    // Run sync after a short delay to ensure user session is fully established
    const timer = setTimeout(syncPreferences, 1000);
    
    return () => clearTimeout(timer);
  }, [user?.id, updateProfile, toast]);
}
