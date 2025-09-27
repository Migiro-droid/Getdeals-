import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation,
  CheckCircle,
  Truck,
  Store,
  CreditCard,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { LocationPicker, type Address } from './LocationPicker';
import { PickupLocationService, type PickupLocation, type NearbyPickupLocation } from '../services/pickup-location';

interface DeliveryOption {
  id: string;
  type: 'delivery' | 'pickup';
  title: string;
  description: string;
  price: number;
  estimatedTime: string;
  icon: React.ReactNode;
}

interface CheckoutDeliveryProps {
  onDeliveryOptionChange: (option: DeliveryOption, details: any) => void;
  selectedOption?: DeliveryOption;
  userCoordinates?: { lat: number; lng: number };
}

export const CheckoutDelivery: React.FC<CheckoutDeliveryProps> = ({
  onDeliveryOptionChange,
  selectedOption,
  userCoordinates
}) => {
  const { toast } = useToast();
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'delivery' | 'pickup' | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<PickupLocation | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyPickupLocation[]>([]);
  const [allPickupLocations, setAllPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'home-delivery',
      type: 'delivery',
      title: 'Home Delivery',
      description: 'Get your orders delivered to your doorstep',
      price: 200,
      estimatedTime: '1-2 hours',
      icon: <Truck className="h-5 w-5" />
    },
    {
      id: 'pickup',
      type: 'pickup',
      title: 'Pickup Location',
      description: 'Collect your order from a nearby pickup point',
      price: 0,
      estimatedTime: '30 minutes',
      icon: <Store className="h-5 w-5" />
    }
  ];

  // Load pickup locations on component mount
  useEffect(() => {
    loadPickupLocations();
  }, []);

  // Load nearby locations when user coordinates are available
  useEffect(() => {
    if (userCoordinates && selectedDeliveryType === 'pickup') {
      loadNearbyLocations(userCoordinates.lat, userCoordinates.lng);
    }
  }, [userCoordinates, selectedDeliveryType]);

  const loadPickupLocations = async () => {
    try {
      const { data, error } = await PickupLocationService.getActiveLocations();
      if (error) {
        console.error('Error loading pickup locations:', error);
        return;
      }
      setAllPickupLocations(data || []);
    } catch (error) {
      console.error('Error loading pickup locations:', error);
    }
  };

  const loadNearbyLocations = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const { data, error } = await PickupLocationService.getNearbyLocations(lat, lng, 15, 10);
      if (error) {
        console.error('Error loading nearby locations:', error);
        return;
      }
      setNearbyLocations(data || []);
    } catch (error) {
      console.error('Error loading nearby locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryTypeSelect = (type: 'delivery' | 'pickup') => {
    setSelectedDeliveryType(type);
    setDeliveryAddress(null);
    setSelectedPickupLocation(null);

    const option = deliveryOptions.find(opt => opt.type === type);
    if (option) {
      onDeliveryOptionChange(option, null);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setDeliveryAddress(address);
    const deliveryOption = deliveryOptions.find(opt => opt.type === 'delivery');
    if (deliveryOption) {
      onDeliveryOptionChange(deliveryOption, {
        address: address.formatted,
        coordinates: address.coordinates,
        placeId: address.placeId
      });
    }

    toast({
      title: "Delivery Address Set",
      description: `Orders will be delivered to ${address.formatted}`,
    });
  };

  const handlePickupLocationSelect = (location: PickupLocation | NearbyPickupLocation) => {
    setSelectedPickupLocation(location as PickupLocation);
    const pickupOption = deliveryOptions.find(opt => opt.type === 'pickup');
    if (pickupOption) {
      onDeliveryOptionChange(pickupOption, {
        locationId: location.id,
        locationName: location.name,
        locationAddress: location.address,
        coordinates: { lat: location.latitude, lng: location.longitude },
        phone: location.phone,
        instructions: location.instructions
      });
    }

    toast({
      title: "Pickup Location Selected",
      description: `You can collect your order from ${location.name}`,
    });
  };

  const isLocationOpen = (location: PickupLocation) => {
    return PickupLocationService.isLocationOpen(location.operating_hours);
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Delivery Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveryOptions.map((option) => (
              <div
                key={option.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedDeliveryType === option.type
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleDeliveryTypeSelect(option.type)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {option.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {option.price === 0 ? 'Free' : `KSh ${option.price}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {option.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedDeliveryType === option.type && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedDeliveryType && (
            <div className="mt-6">
              <Separator className="mb-6" />
              
              {selectedDeliveryType === 'delivery' && (
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </h3>
                  
                  <LocationPicker
                    onLocationSelect={handleAddressSelect}
                    placeholder="Enter your delivery address..."
                    className="w-full"
                  />

                  {deliveryAddress && (
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">Delivery Address:</div>
                          <div>{deliveryAddress.formatted}</div>
                          <div className="text-xs text-muted-foreground">
                            Coordinates: {deliveryAddress.coordinates.lat.toFixed(6)}, {deliveryAddress.coordinates.lng.toFixed(6)}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {selectedDeliveryType === 'pickup' && (
                <div className="space-y-6">
                  <h3 className="font-medium flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Select Pickup Location
                  </h3>

                  {/* Nearby Locations */}
                  {nearbyLocations.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Nearby Locations ({nearbyLocations.length})
                      </h4>
                      <div className="grid gap-3">
                        {nearbyLocations.map((location) => (
                          <div
                            key={location.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedPickupLocation?.id === location.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handlePickupLocationSelect(location)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{location.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {formatDistance(location.distance_km)}
                                  </Badge>
                                  {isLocationOpen({ ...location, operating_hours: location.operating_hours || {} } as PickupLocation) ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs">Open</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">Closed</Badge>
                                  )}
                                </div>
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{location.address}</span>
                                </div>
                                {location.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{location.phone}</span>
                                  </div>
                                )}
                                {location.features && location.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {location.features.slice(0, 3).map((feature, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {selectedPickupLocation?.id === location.id && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Locations */}
                  {allPickupLocations.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        All Pickup Locations ({allPickupLocations.length})
                      </h4>
                      <div className="grid gap-3 max-h-96 overflow-y-auto">
                        {allPickupLocations
                          .filter(loc => !nearbyLocations.some(nearby => nearby.id === loc.id))
                          .map((location) => (
                          <div
                            key={location.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedPickupLocation?.id === location.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handlePickupLocationSelect(location)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{location.name}</h4>
                                  {isLocationOpen(location) ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs">Open</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">Closed</Badge>
                                  )}
                                </div>
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{location.address}</span>
                                </div>
                                {location.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{location.phone}</span>
                                  </div>
                                )}
                                {location.features && location.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {location.features.slice(0, 3).map((feature, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {selectedPickupLocation?.id === location.id && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPickupLocation && (
                    <Alert>
                      <Store className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-medium">Selected Pickup Location:</div>
                          <div>{selectedPickupLocation.name}</div>
                          <div className="text-sm">{selectedPickupLocation.address}</div>
                          {selectedPickupLocation.instructions && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Instructions:</strong> {selectedPickupLocation.instructions}
                            </div>
                          )}
                          {selectedPickupLocation.phone && (
                            <div className="text-sm">
                              <strong>Contact:</strong> {selectedPickupLocation.phone}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {selectedOption && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedOption.title}</span>
                <span className="font-medium">
                  {selectedOption.price === 0 ? 'Free' : `KSh ${selectedOption.price}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Estimated Time</span>
                <span>{selectedOption.estimatedTime}</span>
              </div>
              {selectedDeliveryType === 'delivery' && deliveryAddress && (
                <div className="pt-2 border-t">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Delivery Address:</div>
                    <div className="text-muted-foreground">{deliveryAddress.formatted}</div>
                  </div>
                </div>
              )}
              {selectedDeliveryType === 'pickup' && selectedPickupLocation && (
                <div className="pt-2 border-t">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Pickup Location:</div>
                    <div className="text-muted-foreground">{selectedPickupLocation.name}</div>
                    <div className="text-muted-foreground">{selectedPickupLocation.address}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};