import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { MapPin, Navigation, Search, Plus, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Location {
  lat: number;
  lng: number;
}

interface Address {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates: Location;
}

interface LocationPickerProps {
  onLocationSelect: (address: Address) => void;
  initialLocation?: Location;
  placeholder?: string;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  placeholder = "Enter address or drop a pin",
  className = ""
}) => {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Initialize map when component mounts
  useEffect(() => {
    initializeMap();
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const initializeMap = useCallback(async () => {
    // For demo purposes, we'll create a simple map placeholder
    // In production, you would integrate with Google Maps, Mapbox, or OpenStreetMap
    if (mapRef.current && !mapInstance.current) {
      // Mock map initialization
      console.log('Map would be initialized here with real map API');
      
      // Set default location to Nairobi, Kenya
      const defaultLocation = initialLocation || { lat: -1.2921, lng: 36.8219 };
      
      // Create mock map interface
      mapInstance.current = {
        center: defaultLocation,
        zoom: 13,
        setCenter: (location: Location) => {
          console.log('Map would center on:', location);
        },
        addMarker: (location: Location) => {
          console.log('Marker would be added at:', location);
          markerRef.current = location;
        },
        removeMarker: () => {
          console.log('Marker would be removed');
          markerRef.current = null;
        }
      };
    }
  }, [initialLocation]);

  // Mock geocoding service (replace with real API)
  const geocodeAddress = async (query: string): Promise<Address[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock address suggestions for Nairobi locations
    const mockSuggestions: Address[] = [
      {
        formatted: `${query}, Westlands, Nairobi, Kenya`,
        street: query,
        city: 'Nairobi',
        state: 'Nairobi County',
        country: 'Kenya',
        coordinates: { lat: -1.2634, lng: 36.8078 }
      },
      {
        formatted: `${query}, CBD, Nairobi, Kenya`,
        street: query,
        city: 'Nairobi',
        state: 'Nairobi County',
        country: 'Kenya',
        coordinates: { lat: -1.2864, lng: 36.8172 }
      },
      {
        formatted: `${query}, Karen, Nairobi, Kenya`,
        street: query,
        city: 'Nairobi',
        state: 'Nairobi County',
        country: 'Kenya',
        coordinates: { lat: -1.3197, lng: 36.7019 }
      }
    ].filter(addr => 
      addr.formatted.toLowerCase().includes(query.toLowerCase())
    );

    return mockSuggestions;
  };

  // Mock reverse geocoding (coordinates to address)
  const reverseGeocode = async (location: Location): Promise<Address> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock reverse geocoding result
    return {
      formatted: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}, Nairobi, Kenya`,
      street: `Street near ${location.lat.toFixed(4)}`,
      city: 'Nairobi',
      state: 'Nairobi County',
      country: 'Kenya',
      coordinates: location
    };
  };

  // Handle address search
  const handleAddressSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const results = await geocodeAddress(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for addresses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (address) {
        handleAddressSearch(address);
      }
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [address, handleAddressSearch]);

  // Get current location using browser geolocation
  const getCurrentLocation = useCallback(() => {
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
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          const addressData = await reverseGeocode(location);
          setSelectedLocation(addressData);
          setAddress(addressData.formatted);
          setSuggestions([]);
          setShowSuggestions(false);
          onLocationSelect(addressData);
          
          // Update map
          if (mapInstance.current) {
            mapInstance.current.setCenter(location);
            mapInstance.current.addMarker(location);
          }

          toast({
            title: "Location Found",
            description: "Your current location has been detected.",
          });
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast({
            title: "Location Error",
            description: "Failed to get address for your location.",
            variant: "destructive",
          });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = "Failed to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
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
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [toast, onLocationSelect]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: Address) => {
    setSelectedLocation(suggestion);
    setAddress(suggestion.formatted);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(suggestion);

    // Update map
    if (mapInstance.current) {
      mapInstance.current.setCenter(suggestion.coordinates);
      mapInstance.current.addMarker(suggestion.coordinates);
    }
  };

  // Handle map click (for pin dropping)
  const handleMapClick = async (location: Location) => {
    try {
      setLoading(true);
      const addressData = await reverseGeocode(location);
      setSelectedLocation(addressData);
      setAddress(addressData.formatted);
      setSuggestions([]);
      setShowSuggestions(false);
      onLocationSelect(addressData);

      // Update map marker
      if (mapInstance.current) {
        mapInstance.current.addMarker(location);
      }

      toast({
        title: "Location Selected",
        description: "Pin dropped successfully.",
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: "Location Error",
        description: "Failed to get address for selected location.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedLocation(null);
    setAddress('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    if (mapInstance.current) {
      mapInstance.current.removeMarker();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Label htmlFor="address-search">Address or Location</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="address-search"
            type="text"
            placeholder={placeholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 pr-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Address Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{suggestion.formatted}</div>
                    <div className="text-xs text-gray-500">
                      {suggestion.street && `${suggestion.street}, `}
                      {suggestion.city}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="flex items-center gap-2"
        >
          {gettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          Use Current Location
        </Button>
        
        {selectedLocation && (
          <Button
            variant="outline"
            onClick={clearSelection}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Selected Location:</div>
            <div className="text-sm">{selectedLocation.formatted}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Coordinates: {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map
            <Badge variant="secondary" className="ml-auto">
              Click to drop pin
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef}
            className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => {
              // Mock map click - in real implementation this would be handled by the map API
              const mockLocation: Location = {
                lat: -1.2921 + (Math.random() - 0.5) * 0.1,
                lng: 36.8219 + (Math.random() - 0.5) * 0.1
              };
              handleMapClick(mockLocation);
            }}
          >
            <div className="text-center">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600">
                {selectedLocation ? (
                  <div>
                    <div className="font-medium">Location Selected</div>
                    <div className="text-xs">Click to select a different location</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">Click to Drop Pin</div>
                    <div className="text-xs">Or search for an address above</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          

        </CardContent>
      </Card>
    </div>
  );
};