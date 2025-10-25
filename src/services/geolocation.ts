/**
 * Geolocation Service
 * Handles user location detection and address lookup
 */

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * Get user's current location using browser Geolocation API
 */
export async function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Get formatted address from coordinates using reverse geocoding
 * Uses OpenStreetMap Nominatim API (free, no key required)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    
    // Build address from components
    const address =
      data.address?.road ||
      data.address?.residential ||
      data.address?.neighbourhood ||
      data.address?.suburb ||
      data.address?.city ||
      `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    return address;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Fallback to coordinates if geocoding fails
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

/**
 * Forward geocoding - get coordinates from address string
 * Uses OpenStreetMap Nominatim API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1&countrycodes=ke`, // Limit to Kenya
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      address: result.display_name || address,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Get user location with formatted address
 */
export async function getUserLocationWithAddress(): Promise<UserLocation & { address: string }> {
  const location = await getUserLocation();
  const address = await reverseGeocode(location.latitude, location.longitude);

  return {
    ...location,
    address,
  };
}

/**
 * Format location for display
 */
export function formatLocation(location: UserLocation, address?: string): string {
  if (address) {
    return address;
  }

  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}

/**
 * Calculate distance between two coordinates (in kilometers)
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}
