// Types for Wallet KYC functionality
export interface WalletKycData {
  id: string;
  userId: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  kraPin: string;
  idType: 'national_id' | 'passport';
  status: 'pending_verification' | 'verified' | 'rejected';
  verifiedAt?: string | Date | null;  // Can be string from database or Date object
  rejectedAt?: string | Date | null;   // Can be string from database or Date object
  rejectionReason?: string;
  verificationNotes?: string;
  createdAt: string | Date;            // Can be string from database or Date object
  updatedAt: string | Date;            // Can be string from database or Date object
}

export interface WalletKycSubmission {
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  kraPin: string;
  idType: 'national_id' | 'passport';
}

export interface WalletKycVerification {
  kycId: string;
  status: 'verified' | 'rejected';
  verificationNotes?: string;
  rejectionReason?: string;
}