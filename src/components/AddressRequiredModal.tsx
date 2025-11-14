import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { AddressForm } from '@/components/AddressForm';
import { useAccount, type Address } from '@/contexts/AccountContext';
import { useToast } from '@/components/ui/use-toast';

interface AddressRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddressRequiredModal({
  open,
  onOpenChange,
}: AddressRequiredModalProps) {
  const { addAddress, addresses } = useAccount();
  const { toast } = useToast();

  const handleAddressSave = (addressData: Omit<Address, 'id'>) => {
    try {
      addAddress(addressData);
      toast({
        title: "Address Added",
        description: "Your delivery address has been saved successfully.",
      });
      // Close modal after a brief delay to show success
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // If user has no addresses, require them to add one
    if (addresses.length === 0) {
      toast({
        title: "Address Required",
        description: "Please add a delivery address to continue.",
        variant: "destructive",
      });
    } else {
      // If user already has addresses, allow them to skip
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing the modal without adding an address
      if (!newOpen) {
        handleCancel();
      }
    }}>
      <DialogContent
        className="max-w-md bg-white dark:bg-white border shadow-lg"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
          handleCancel();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key
          e.preventDefault();
          handleCancel();
        }}
      >
        <DialogHeader className="text-center pb-4 border-b">
          <div className="flex justify-center mb-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-primary text-center">
            Delivery Address
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground mt-2">
            Please confirm or update your delivery address.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AddressForm
            onSave={handleAddressSave}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
