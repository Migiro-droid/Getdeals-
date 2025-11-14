import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, Check } from 'lucide-react';
import { AddressForm } from '@/components/AddressForm';
import { useAccount, type Address } from '@/contexts/AccountContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

interface AddressRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddressRequiredModal({
  open,
  onOpenChange,
}: AddressRequiredModalProps) {
  const { addAddress, addresses, setDefaultAddress } = useAccount();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find(a => a.is_default || a.isDefault)?.id || null
  );

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
        setShowAddForm(false);
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmAddress = () => {
    if (!selectedAddressId) {
      toast({
        title: "No Address Selected",
        description: "Please select an address or add a new one.",
        variant: "destructive",
      });
      return;
    }

    // Set the selected address as default
    setDefaultAddress(selectedAddressId);

    toast({
      title: "Address Confirmed",
      description: "Your delivery address has been confirmed.",
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    // All users must confirm/update their address on login
    toast({
      title: "Address Confirmation Required",
      description: "Please confirm or update your delivery address to continue.",
      variant: "destructive",
    });
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
          {showAddForm ? (
            <AddressForm
              onSave={handleAddressSave}
              onCancel={() => {
                if (addresses.length > 0) {
                  setShowAddForm(false);
                } else {
                  handleCancel();
                }
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Existing Addresses List */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Delivery Address</label>
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === address.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{address.label}</span>
                          {(address.is_default || address.isDefault) && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.street_address}
                        </p>
                        <p className="text-xs text-gray-500">{address.city}</p>
                      </div>
                      {selectedAddressId === address.id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="flex-1"
                >
                  Add New Address
                </Button>
                <Button
                  onClick={handleConfirmAddress}
                  className="flex-1"
                  disabled={!selectedAddressId}
                >
                  Confirm Address
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
