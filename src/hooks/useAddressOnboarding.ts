import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from '@/contexts/AccountContext';

/**
 * Hook to manage address onboarding flow for authenticated users
 * Shows address modal when user logs in without a delivery address
 */
export function useAddressOnboarding() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { addresses } = useAccount();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Don't check until auth is fully loaded
    if (authLoading) return;

    // Only check once per session
    if (hasChecked) return;

    // Only proceed if user is authenticated
    if (!isAuthenticated || !user) {
      setShowAddressModal(false);
      setHasChecked(false);
      return;
    }

    // Check if user has any addresses
    const hasAddress = addresses.length > 0;

    if (!hasAddress) {
      // Show modal if no address exists
      setShowAddressModal(true);
    }

    setHasChecked(true);
  }, [isAuthenticated, user, addresses, authLoading, hasChecked]);

  const closeModal = () => {
    setShowAddressModal(false);
  };

  return {
    showAddressModal,
    closeModal,
  };
}
