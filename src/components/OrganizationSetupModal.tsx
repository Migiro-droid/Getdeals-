import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { validateOrganizationName, validateOrganizationNumber } from "@/utils/organizationValidation";

interface OrganizationSetupModalProps {
  open: boolean;
  onComplete: () => void;
  userEmail: string;
}

export function OrganizationSetupModal({ open, onComplete, userEmail }: OrganizationSetupModalProps) {
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; id?: string }>({});
  const { updateProfile } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { name?: string; id?: string } = {};
    
    // Validate organization name (required)
    const nameValidation = validateOrganizationName(organizationName);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }
    
    // Validate organization ID (optional, but if provided, must be valid)
    if (organizationId.trim()) {
      const idValidation = validateOrganizationNumber(organizationId);
      if (!idValidation.isValid) {
        newErrors.id = idValidation.error;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Update user profile with organization details
      await updateProfile({
        organization: organizationName.trim(),
        organizationNumber: organizationId.trim() || null
      });

      // Send welcome email for OAuth users who just completed setup
      try {
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'welcome',
            recipientEmail: userEmail,
            data: {
              name: userEmail.split('@')[0], // Use email prefix as name fallback
              email: userEmail,
              organization: organizationName.trim()
            }
          })
        });

        // Add contact to Brevo mailing list
        await fetch('/api/email/add-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            firstName: userEmail.split('@')[0],
            lastName: '',
            attributes: {
              ORGANIZATION: organizationName.trim(),
              ORGANIZATION_NUMBER: organizationId.trim() || '',
              SIGNUP_DATE: new Date().toISOString(),
              SIGNUP_METHOD: 'oauth'
            }
          })
        });

        console.log('📧 Welcome email sent for OAuth user');
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
        // Don't fail the setup because of email issues
      }

      toast({
        title: "Organization details saved! ✅",
        description: "Your organization information has been added to your profile. Welcome email sent!",
      });

      onComplete();
    } catch (error) {
      console.error('Error updating organization details:', error);
      toast({
        title: "Error saving organization details",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Update profile to mark organization setup as attempted (empty values)
    updateProfile({
      organization: null,
      organizationNumber: null
    }).then(() => {
      onComplete();
    }).catch((error) => {
      console.error('Error skipping organization setup:', error);
      onComplete(); // Still complete even if update fails
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organization Setup
          </DialogTitle>
          <DialogDescription>
            Welcome! Please provide your organization details to personalize your GetDeals experience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-sm font-medium">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-name"
                type="text"
                placeholder="Your company or organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-id" className="text-sm font-medium">
              Organization ID (Optional)
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-id"
                type="text"
                placeholder="Registration number, KRA PIN, etc."
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            {errors.id && (
              <p className="text-sm text-red-600">{errors.id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format examples: REG123456789, KRA123456789, or numeric ID
            </p>
          </div>

          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
            <p><strong>Signed in as:</strong> {userEmail}</p>
            <p className="mt-1">This information will be saved to your profile and can be updated later in your account settings.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={loading || !organizationName.trim()}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}