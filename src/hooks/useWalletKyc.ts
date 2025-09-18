import { useState, useEffect } from 'react';
import { WalletKycService } from '../services/wallet-kyc';
import { WalletKycData } from '../types/wallet-kyc';

export function useWalletKyc() {
  const [kycData, setKycData] = useState<WalletKycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKycStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await WalletKycService.getKycStatus();
      
      if (result.success) {
        setKycData(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch KYC status');
      }
    } catch (err) {
      setError('An error occurred while fetching KYC status');
      console.error('KYC fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const isVerified = kycData?.status === 'verified';
  const isPending = kycData?.status === 'pending_verification';
  const isRejected = kycData?.status === 'rejected';
  const hasKycData = Boolean(kycData);

  return {
    kycData,
    loading,
    error,
    isVerified,
    isPending,
    isRejected,
    hasKycData,
    refetch: fetchKycStatus
  };
}