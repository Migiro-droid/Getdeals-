import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle } from "lucide-react";
import { WalletKycService } from "../services/wallet-kyc";
import { WalletVerificationModal, defaultVerificationSteps } from "./WalletVerificationModal";

interface WalletActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Callback for successful verification
}

interface KYCFormData {
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  kraPin: string;
  idType: 'national_id' | 'passport';
}

export function WalletActivationModal({ open, onOpenChange, onSuccess }: WalletActivationModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState(defaultVerificationSteps);
  const [currentStep, setCurrentStep] = useState('');
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const [formData, setFormData] = useState<KYCFormData>({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    kraPin: '',
    idType: 'national_id'
  });
  const [errors, setErrors] = useState<Partial<KYCFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<KYCFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = formData.idType === 'national_id' ? 'National ID number is required' : 'Passport number is required';
    } else if (formData.idType === 'national_id' && !/^\d{8}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'National ID must be 8 digits';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid Kenyan phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.kraPin.trim()) {
      newErrors.kraPin = 'KRA PIN is required';
    } else if (!/^A\d{9}[A-Z]$/.test(formData.kraPin.toUpperCase())) {
      newErrors.kraPin = 'Please enter a valid personal KRA PIN (format: AxxxxxxxxxX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateVerificationStep = (stepId: string, status: 'pending' | 'loading' | 'completed' | 'error') => {
    setVerificationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setShowVerification(true);
    setIsVerificationComplete(false);

    // Close the KYC form modal
    onOpenChange(false);

    try {
      // Step 1: Identity Verification
      setCurrentStep('identity');
      updateVerificationStep('identity', 'loading');
      
      // Simulate a brief delay for identity verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateVerificationStep('identity', 'completed');

      // Step 2: Rukisha Registration
      setCurrentStep('rukisha');
      updateVerificationStep('rukisha', 'loading');

      // Submit KYC data using the service
      const result = await WalletKycService.submitKyc({
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        kraPin: formData.kraPin,
        idType: formData.idType
      });

      if (!result.success) {
        updateVerificationStep('rukisha', 'error');
        setShowVerification(false);
        
        toast({
          title: "Verification Failed",
          description: result.error || "There was an error verifying your details. Please try again.",
          variant: "destructive",
        });
        return;
      }

      updateVerificationStep('rukisha', 'completed');

      // Step 3: Wallet Activation
      setCurrentStep('wallet');
      updateVerificationStep('wallet', 'loading');
      
      // Brief delay for wallet activation
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateVerificationStep('wallet', 'completed');

      // Mark verification as complete
      setIsVerificationComplete(true);

      // Show success toast
      toast({
        title: "Wallet Activated Successfully!",
        description: "Your identity has been verified and wallet activated. You now have full access to all wallet features.",
      });

      // Reset form
      setFormData({
        fullName: '',
        idNumber: '',
        phoneNumber: '',
        email: '',
        kraPin: '',
        idType: 'national_id'
      });
      setErrors({});

    } catch (error) {
      console.error('KYC submission error:', error);
      
      // Mark current step as failed
      if (currentStep) {
        updateVerificationStep(currentStep, 'error');
      }
      
      setShowVerification(false);
      
      toast({
        title: "Verification Failed",
        description: "There was an error during verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    setIsVerificationComplete(false);
    setVerificationSteps(defaultVerificationSteps);
    setCurrentStep('');
    
    // Trigger the success callback to refresh wallet state
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleInputChange = (field: keyof KYCFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[75vh] overflow-y-auto mt-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Required KYC for Wallet Setup & Activation
            </DialogTitle>
            <DialogDescription>
              Personal / Individual Wallet - Complete your details below to activate your GetDeals wallet.
              All information is encrypted and secure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (as per ID) *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name as it appears on your ID"
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idType">ID Type *</Label>
            <Select
              value={formData.idType}
              onValueChange={(value: 'national_id' | 'passport') => handleInputChange('idType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="passport">Passport (for foreigners)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">
              {formData.idType === 'national_id' ? 'National ID Number' : 'Passport Number'} *
            </Label>
            <Input
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => handleInputChange('idNumber', e.target.value)}
              placeholder={formData.idType === 'national_id' ? '12345678' : 'A1234567'}
              className={errors.idNumber ? 'border-red-500' : ''}
            />
            {errors.idNumber && (
              <p className="text-sm text-red-500">{errors.idNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Valid Phone Number (registered to MPESA or preferred payment channel) *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+254712345678 or 0712345678"
              className={errors.phoneNumber ? 'border-red-500' : ''}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="kraPin">KRA PIN (Kenya Revenue Authority) *</Label>
            <Input
              id="kraPin"
              value={formData.kraPin}
              onChange={(e) => handleInputChange('kraPin', e.target.value.toUpperCase())}
              placeholder="A051234567B"
              className={errors.kraPin ? 'border-red-500' : ''}
            />
            {errors.kraPin && (
              <p className="text-sm text-red-500">{errors.kraPin}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: A followed by 9 digits and a letter (e.g., A051234567B)
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">What happens next?</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Your details will be verified within 24 hours</li>
                  <li>• You'll receive an SMS and email confirmation</li>
                  <li>• Wallet activation is subject to successful verification</li>
                  <li>• All data is encrypted and stored securely</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit KYC & Activate Wallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <WalletVerificationModal
      open={showVerification}
      onOpenChange={setShowVerification}
      steps={verificationSteps}
      currentStep={currentStep}
      isCompleted={isVerificationComplete}
      onComplete={handleVerificationComplete}
    />
  </>
  );
}
