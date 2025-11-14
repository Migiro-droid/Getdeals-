import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to manage address onboarding flow for authenticated users
 * Shows address modal every time a user logs in to confirm/update their delivery address
 */
export function useAddressOnboarding() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    // Don't check until auth is fully loaded
    if (authLoading) return;

    // Only prompt once per session
    if (hasPrompted) return;

    // Show modal whenever user is authenticated
    if (isAuthenticated && user) {
      setShowAddressModal(true);
      setHasPrompted(true);
    } else {
      // Reset when user logs out
      setShowAddressModal(false);
      setHasPrompted(false);
    }
  }, [isAuthenticated, user, authLoading, hasPrompted]);

  const closeModal = () => {
    setShowAddressModal(false);
  };

  return {
    showAddressModal,
    closeModal,
  };
}
