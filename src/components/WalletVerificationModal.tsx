import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, Shield, User, CreditCard, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface WalletVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: VerificationStep[];
  currentStep: string;
  isCompleted: boolean;
  onComplete?: () => void;
}

export function WalletVerificationModal({ 
  open, 
  onOpenChange, 
  steps, 
  currentStep, 
  isCompleted,
  onComplete 
}: WalletVerificationModalProps) {
  
  React.useEffect(() => {
    if (isCompleted && onComplete) {
      // Small delay to show completion before calling onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, onComplete]);

  const getStepIcon = (step: VerificationStep) => {
    const IconComponent = step.icon;
    
    switch (step.status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <IconComponent className="h-5 w-5 text-red-600" />;
      default:
        return <IconComponent className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatus = (step: VerificationStep) => {
    switch (step.status) {
      case 'loading':
        return 'Verifying...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isCompleted ? 'Wallet Activated Successfully!' : 'Verifying Your Details'}
          </DialogTitle>
          <DialogDescription>
            {isCompleted 
              ? 'Your wallet has been activated and is ready to use.'
              : 'Please wait while we verify your information with our secure partner.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                step.status === 'loading' && "bg-blue-50 border-blue-200",
                step.status === 'completed' && "bg-green-50 border-green-200",
                step.status === 'error' && "bg-red-50 border-red-200",
                step.status === 'pending' && "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {step.title}
                  </h4>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    step.status === 'loading' && "bg-blue-100 text-blue-800",
                    step.status === 'completed' && "bg-green-100 text-green-800",
                    step.status === 'error' && "bg-red-100 text-red-800",
                    step.status === 'pending' && "bg-gray-100 text-gray-600"
                  )}>
                    {getStepStatus(step)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  Verification Complete!
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Your wallet is now active and ready for deposits and payments.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isCompleted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Please wait</p>
                <p className="mt-1 text-xs">
                  This process usually takes 30-60 seconds. Do not close this window.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Default verification steps for KYC
export const defaultVerificationSteps: VerificationStep[] = [
  {
    id: 'identity',
    title: 'Identity Verification',
    description: 'Verifying your ID number and personal details',
    icon: User,
    status: 'pending'
  },
  {
    id: 'rukisha',
    title: 'Rukisha Registration',
    description: 'Creating your secure wallet account with our partner',
    icon: Shield,
    status: 'pending'
  },
  {
    id: 'wallet',
    title: 'Wallet Activation',
    description: 'Activating your wallet and enabling all features',
    icon: CreditCard,
    status: 'pending'
  }
];