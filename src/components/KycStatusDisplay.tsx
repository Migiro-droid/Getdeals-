import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react';
import { WalletKycData } from '../types/wallet-kyc';

interface KycStatusDisplayProps {
  kycData: WalletKycData | null;
  loading: boolean;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

// Helper function to safely format dates
const formatDate = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return 'Not available';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return 'Invalid date';
  }
};

const formatTime = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return 'Not available';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    return date.toLocaleTimeString();
  } catch (error) {
    return 'Invalid time';
  }
};

const formatDateTime = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return 'Not available';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  } catch (error) {
    return 'Invalid date';
  }
};

export function KycStatusDisplay({ kycData, loading, onRetry, onContactSupport }: KycStatusDisplayProps) {
  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking your KYC status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!kycData) {
    return null; // No KYC data means user hasn't submitted yet
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          title: 'KYC Verified ✅',
          message: 'Your identity has been successfully verified. Your wallet is now fully activated!',
          description: 'You can now enjoy all wallet features including deposits and premium benefits.',
          actionButton: null
        };
      
      case 'pending_verification':
        return {
          icon: Clock,
          iconColor: 'text-yellow-600',
          badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          title: 'KYC Under Review ⏳',
          message: 'Thank you for submitting your KYC information. Our team is currently reviewing your documents.',
          description: 'Verification typically takes 24-48 hours. We\'ll notify you via email and SMS once completed.',
          actionButton: (
            <div className="flex gap-2">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
              )}
              {onContactSupport && (
                <Button variant="outline" size="sm" onClick={onContactSupport}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              )}
            </div>
          )
        };
      
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          title: 'KYC Requires Attention ❌',
          message: 'We were unable to verify your KYC information. Please review the details below and resubmit.',
          description: kycData.rejectionReason || 'Please ensure all information matches your official documents and try again.',
          actionButton: (
            <div className="flex gap-2">
              <Button size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Resubmit KYC
              </Button>
              {onContactSupport && (
                <Button variant="outline" size="sm" onClick={onContactSupport}>
                  <Phone className="h-4 w-4 mr-2" />
                  Get Help
                </Button>
              )}
            </div>
          )
        };
      
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-gray-600',
          badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
          title: 'KYC Status Unknown',
          message: 'We are unable to determine your current KYC status.',
          description: 'Please contact our support team for assistance.',
          actionButton: onContactSupport ? (
            <Button variant="outline" size="sm" onClick={onContactSupport}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          ) : null
        };
    }
  };

  const config = getStatusConfig(kycData.status);
  const IconComponent = config.icon;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Wallet KYC Status
          </CardTitle>
          <Badge className={config.badgeColor}>
            <IconComponent className={`h-3 w-3 mr-1 ${config.iconColor}`} />
            {kycData.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <IconComponent className={`h-12 w-12 mx-auto ${config.iconColor}`} />
          <h3 className="text-lg font-semibold">{config.title}</h3>
          <p className="text-muted-foreground">{config.message}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Submitted:</strong> {formatDateTime(kycData.createdAt)}</p>
            {kycData.verifiedAt && (
              <p><strong>Verified:</strong> {formatDateTime(kycData.verifiedAt)}</p>
            )}
            {kycData.rejectedAt && (
              <p><strong>Rejected:</strong> {formatDateTime(kycData.rejectedAt)}</p>
            )}
          </div>
        </div>

        {config.actionButton && (
          <div className="pt-2">
            {config.actionButton}
          </div>
        )}

        {kycData.verificationNotes && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Verification Notes:
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {kycData.verificationNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}