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
  county?: string;
  postal_code?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  is_default: boolean;
  address_type: 'home' | 'work' | 'other';
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { toast } = useToast();
  const [gettingLocation, setGettingLocation] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState<AddressData>({
    label: address?.label || 'Home',
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

  // Geocoding function for address suggestions
  const searchPlaces = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Using Nominatim API (OpenStreetMap) for geocoding - free alternative
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)},Kenya&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'GetDeals Kenya App'
          }
        }
      );

      const data = await response.json();

      const placeSuggestions: PlaceSuggestion[] = data.map((place: any) => ({
        place_id: place.place_id,
        description: place.display_name,
        main_text: place.name || place.display_name.split(',')[0],
        secondary_text: place.display_name.split(',').slice(1).join(',').trim()
      }));

      setSuggestions(placeSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching places:', error);
    }
  };

  const handleAddressInputChange = (value: string) => {
    setAddressInput(value);
    setFormData(prev => ({ ...prev, street_address: value }));
    searchPlaces(value);
  };

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    try {
      // Get detailed place information
      const response = await fetch(
        `https://nominatim.openstreetmap.org/lookup?osm_ids=N${suggestion.place_id}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GetDeals Kenya App'
          }
        }
      );

      const data = await response.json();
      if (data && data[0]) {
        const place = data[0];
        const address = place.address || {};

        setFormData(prev => ({
          ...prev,
          street_address: suggestion.main_text,
          city: address.city || address.town || address.village || '',
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
          formatted_address: suggestion.description
        }));

        setAddressInput(suggestion.main_text);
      }

      setShowSuggestions(false);
      setSuggestions([]);
    } catch (error) {
      console.error('Error getting place details:', error);
      setFormData(prev => ({
        ...prev,
        street_address: suggestion.main_text
      }));
      setAddressInput(suggestion.main_text);
      setShowSuggestions(false);
    }
  };

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
          {/* Address Label Dropdown */}
          <div>
            <Label htmlFor="label" className="text-sm">Address Label *</Label>
            <Select
              value={formData.label}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                label: value,
                address_type: value.toLowerCase() === 'apartment' ? 'other' : value.toLowerCase() as 'home' | 'work' | 'other'
              }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select address type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Home">Home</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
              </SelectContent>
            </Select>
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
            <div className="relative">
              <Label htmlFor="street_address" className="text-sm">Street Address *</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Start typing your address..."
                required
                className="h-9"
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <div className="font-medium text-sm">{suggestion.main_text}</div>
                      <div className="text-xs text-gray-500">{suggestion.secondary_text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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