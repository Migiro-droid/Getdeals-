import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { WalletKycService } from '../../services/wallet-kyc';
import { WalletKycData } from '../../types/wallet-kyc';
import { Shield, CheckCircle, XCircle, Clock, User, Phone, Mail, CreditCard } from 'lucide-react';

export default function AdminKycPage() {
  const [pendingKyc, setPendingKyc] = useState<WalletKycData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<{ [key: string]: string }>({});
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingKyc();
  }, []);

  const fetchPendingKyc = async () => {
    setLoading(true);
    try {
      const result = await WalletKycService.getPendingKyc();
      if (result.success && result.data) {
        setPendingKyc(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch pending KYC submissions",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching KYC data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKyc = async (kycId: string, status: 'verified' | 'rejected') => {
    setProcessingId(kycId);
    
    try {
      const notes = verificationNotes[kycId] || '';
      const reason = status === 'rejected' ? rejectionReason[kycId] : undefined;
      
      if (status === 'rejected' && !reason?.trim()) {
        toast({
          title: "Rejection Reason Required",
          description: "Please provide a reason for rejection",
          variant: "destructive"
        });
        return;
      }
      
      const result = await WalletKycService.verifyKyc(kycId, status, notes, reason);
      
      if (result.success) {
        toast({
          title: `KYC ${status === 'verified' ? 'Verified' : 'Rejected'}`,
          description: `KYC has been ${status} successfully`,
        });
        
        // Remove from pending list
        setPendingKyc(prev => prev.filter(kyc => kyc.id !== kycId));
        
        // Clear notes
        setVerificationNotes(prev => ({ ...prev, [kycId]: '' }));
        setRejectionReason(prev => ({ ...prev, [kycId]: '' }));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update KYC status",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating KYC status",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending_verification':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending_verification':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading KYC submissions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          KYC Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and verify wallet KYC submissions
        </p>
      </div>

      {pendingKyc.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending KYC Submissions</h3>
            <p className="text-muted-foreground">All KYC submissions have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingKyc.map((kyc) => (
            <Card key={kyc.id} className="border-l-4 border-l-yellow-400">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {kyc.fullName}
                  </CardTitle>
                  <Badge className={getStatusColor(kyc.status)}>
                    {getStatusIcon(kyc.status)}
                    <span className="ml-1">{kyc.status.replace('_', ' ').toUpperCase()}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(kyc.createdAt).toLocaleDateString()} at {new Date(kyc.createdAt).toLocaleTimeString()}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">ID Type:</span>
                      <span>{kyc.idType === 'national_id' ? 'National ID' : 'Passport'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">ID Number:</span>
                      <span className="font-mono">{kyc.idNumber}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{kyc.phoneNumber}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{kyc.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">KRA PIN:</span>
                      <span className="font-mono">{kyc.kraPin}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Notes (Optional)</label>
                  <Textarea
                    value={verificationNotes[kyc.id] || ''}
                    onChange={(e) => setVerificationNotes(prev => ({ ...prev, [kyc.id]: e.target.value }))}
                    placeholder="Add any notes about the verification..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason (Required if rejecting)</label>
                  <Textarea
                    value={rejectionReason[kyc.id] || ''}
                    onChange={(e) => setRejectionReason(prev => ({ ...prev, [kyc.id]: e.target.value }))}
                    placeholder="Provide detailed reason for rejection..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleVerifyKyc(kyc.id, 'verified')}
                    disabled={processingId === kyc.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify KYC
                  </Button>
                  
                  <Button
                    onClick={() => handleVerifyKyc(kyc.id, 'rejected')}
                    disabled={processingId === kyc.id}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject KYC
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}