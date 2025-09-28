import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2, Home, Building, MapPinIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Address } from '@/contexts/AccountContext';

interface AddressFormProps {
  address?: Address;
  onSave: (address: Omit<Address, 'id'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface AddressData {
  label: string;
  street_address: string;
  city: string;
  county: string;
  postal_code: string;
  phone_number: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  is_default: boolean;
  address_type: 'home' | 'work' | 'other';
}

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { toast } = useToast();
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState<AddressData>({
    label: address?.label || '',
    street_address: address?.street_address || '',
    city: address?.city || '',
    county: address?.county || '',
    postal_code: address?.postal_code || '',
    phone_number: address?.phone_number || '',
    latitude: address?.latitude,
    longitude: address?.longitude,
    formatted_address: address?.formatted_address,
    is_default: address?.is_default || false,
    address_type: address?.address_type || 'home'
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          formatted_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));

        toast({
          title: "Location Captured",
          description: `GPS coordinates saved: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
        setGettingLocation(false);
      },
      (error) => {
        let message = "Failed to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }

        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minute
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.street_address || !formData.city) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the label, street address, and city.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      ...formData,
      // Legacy support
      details: formData.formatted_address || `${formData.street_address}, ${formData.city}`,
      isDefault: formData.is_default
    });
  };

  const addressTypeIcons = {
    home: Home,
    work: Building,
    other: MapPinIcon
  };

  const AddressTypeIcon = addressTypeIcons[formData.address_type];

  return (
    <Card className="w-full mx-auto border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AddressTypeIcon className="h-5 w-5" />
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="label" className="text-sm">Address Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Home, Office"
                required
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="address_type" className="text-sm">Address Type</Label>
              <Select 
                value={formData.address_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, address_type: value as 'home' | 'work' | 'other' }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GPS Location */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">GPS Coordinates</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="flex items-center gap-1 h-8 px-2 text-xs"
            >
              {gettingLocation ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Navigation className="h-3 w-3" />
              )}
              Get Current Location
            </Button>
          </div>

          {/* Address Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="street_address" className="text-sm">Street Address *</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                placeholder="e.g., 123 Kimathi Street"
                required
                className="h-9"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city" className="text-sm">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g., Nairobi"
                  required
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="county" className="text-sm">County</Label>
                <Input
                  id="county"
                  value={formData.county}
                  onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                  placeholder="e.g., Nairobi County"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="postal_code" className="text-sm">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="e.g., 00100"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="phone_number" className="text-sm">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="e.g., +254 712 345 678"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Coordinates Display */}
          {formData.latitude && formData.longitude && (
            <div className="p-2 bg-muted rounded text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">GPS:</span>
                <span>{formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</span>
              </div>
            </div>
          )}

          {/* Default Address & Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
              <Label htmlFor="is_default" className="text-sm">Set as default address</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onCancel} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {isEditing ? 'Update' : 'Save'} Address
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};