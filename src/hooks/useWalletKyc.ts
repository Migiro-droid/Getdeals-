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
      console.log('🔍 Fetching KYC status...');
      const result = await WalletKycService.getKycStatus();
      console.log('📊 KYC Status Result:', result);
      
      if (result.success) {
        setKycData(result.data || null);
        console.log('✅ KYC Data Updated:', result.data);
      } else {
        setError(result.error || 'Failed to fetch KYC status');
        console.error('❌ KYC Fetch Error:', result.error);
      }
    } catch (err) {
      setError('An error occurred while fetching KYC status');
      console.error('💥 KYC fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Treat users as verified immediately after KYC submission for seamless wallet access
  const isVerified = Boolean(kycData); // Any KYC data means verified access
  const isPending = false; // No pending state - immediate verification
  const isRejected = kycData?.status === 'rejected';
  const hasKycData = Boolean(kycData);

  console.log('🔄 KYC Hook State:', { 
    hasKycData, 
    isVerified, 
    isPending, 
    isRejected, 
    status: kycData?.status,
    loading 
  });

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