import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Star, 
  Trash2, 
  Edit, 
  Home, 
  Building, 
  MapPinIcon,
  Navigation,
  Copy
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Address } from '@/contexts/AccountContext';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault
}) => {
  const { toast } = useToast();

  const addressTypeIcons = {
    home: Home,
    work: Building,
    other: MapPinIcon
  };

  const addressTypeLabels = {
    home: 'Home',
    work: 'Work',
    other: 'Other'
  };

  const AddressTypeIcon = addressTypeIcons[address.address_type] || MapPinIcon;

  const copyCoordinates = () => {
    if (address.latitude && address.longitude) {
      const coordinates = `${address.latitude}, ${address.longitude}`;
      navigator.clipboard.writeText(coordinates);
      toast({
        title: "Coordinates Copied",
        description: "GPS coordinates copied to clipboard.",
      });
    }
  };

  const openInMaps = () => {
    if (address.latitude && address.longitude) {
      const url = `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
      window.open(url, '_blank');
    } else if (address.formatted_address || address.details) {
      const query = encodeURIComponent(address.formatted_address || address.details || '');
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank');
    }
  };

  const formatAddress = () => {
    if (address.formatted_address) {
      return address.formatted_address;
    }
    
    // Build address from components
    const parts = [
      address.street_address,
      address.city,
      address.county
    ].filter(Boolean);
    
    return parts.join(', ') || address.details || 'Address not complete';
  };

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <AddressTypeIcon className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">{address.label}</h4>
            <Badge variant="outline" className="text-xs">
              {addressTypeLabels[address.address_type]}
            </Badge>
            {(address.is_default || address.isDefault) && (
              <Badge className="text-xs bg-primary">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(address)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {!(address.is_default || address.isDefault) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetDefault(address.id)}
                className="h-8 w-8 p-0"
                title="Set as default"
              >
                <Star className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(address.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-foreground">{formatAddress()}</p>
              {address.landmark && (
                <p className="text-muted-foreground text-xs mt-1">
                  Near: {address.landmark}
                </p>
              )}
            </div>
          </div>

          {address.phone_number && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{address.phone_number}</span>
            </div>
          )}

          {address.postal_code && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Postal Code:</span>
              <span className="text-xs">{address.postal_code}</span>
            </div>
          )}

          {address.latitude && address.longitude && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>{address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCoordinates}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={openInMaps}
            className="flex-1"
          >
            <Navigation className="h-3 w-3 mr-1" />
            Open in Maps
          </Button>
          {!(address.is_default || address.isDefault) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(address.id)}
              className="flex-1"
            >
              <Star className="h-3 w-3 mr-1" />
              Set Default
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};