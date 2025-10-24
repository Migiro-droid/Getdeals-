/**
 * Leta Shipping Rates Service
 * Handles rate calculation and pricing
 */

import { getLetaClient } from "./client";
import {
  ShippingRatePayload,
  ShippingRateResponse,
  LetaValidationError,
} from "@/types/leta.types";

class LetaRatesService {
  /**
   * Calculate shipping rate between two locations
   */
  async calculateRate(
    payload: ShippingRatePayload
  ): Promise<ShippingRateResponse> {
    // Validation
    this.validatePayload(payload);

    try {
      const client = getLetaClient();
      const response = await client.post<ShippingRateResponse>(
        "/shipping/rates/calculate/",
        payload
      );
      return response;
    } catch (error) {
      console.error("Failed to calculate shipping rate from Leta:", error);
      throw error;
    }
  }

  /**
   * Calculate rate with address strings (convenience method)
   */
  async calculateRateFromAddresses(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<ShippingRateResponse> {
    return this.calculateRate({
      origin: {
        latitude: originLat,
        longitude: originLng,
      },
      destination: {
        latitude: destLat,
        longitude: destLng,
      },
    });
  }

  /**
   * Validate rate calculation payload
   */
  private validatePayload(payload: ShippingRatePayload): void {
    // Origin validation
    if (
      !payload.origin?.latitude ||
      !payload.origin?.longitude
    ) {
      throw new LetaValidationError(
        "origin",
        "Origin coordinates (latitude, longitude) are required"
      );
    }

    // Destination validation
    if (
      !payload.destination?.latitude ||
      !payload.destination?.longitude
    ) {
      throw new LetaValidationError(
        "destination",
        "Destination coordinates (latitude, longitude) are required"
      );
    }

    // Coordinate range validation
    const isValidLat = (lat: number) => lat >= -90 && lat <= 90;
    const isValidLng = (lng: number) => lng >= -180 && lng <= 180;

    if (!isValidLat(Number(payload.origin.latitude))) {
      throw new LetaValidationError(
        "origin.latitude",
        "Latitude must be between -90 and 90"
      );
    }
    if (!isValidLng(Number(payload.origin.longitude))) {
      throw new LetaValidationError(
        "origin.longitude",
        "Longitude must be between -180 and 180"
      );
    }
    if (!isValidLat(Number(payload.destination.latitude))) {
      throw new LetaValidationError(
        "destination.latitude",
        "Latitude must be between -90 and 90"
      );
    }
    if (!isValidLng(Number(payload.destination.longitude))) {
      throw new LetaValidationError(
        "destination.longitude",
        "Longitude must be between -180 and 180"
      );
    }
  }

  /**
   * Format rate response for display
   */
  formatRate(response: ShippingRateResponse) {
    if (!response.data) return null;

    return {
      distance: `${response.data.distance.toFixed(2)} km`,
      price: `${response.data.currency} ${response.data.price.toLocaleString()}`,
      duration: `${Math.ceil(response.data.duration)} mins`,
      priceValue: response.data.price,
      distanceValue: response.data.distance,
      durationValue: response.data.duration,
    };
  }

  /**
   * Check if rate is within acceptable range
   */
  isRateAcceptable(
    response: ShippingRateResponse,
    maxPrice?: number,
    maxDistance?: number
  ): boolean {
    if (!response.data) return false;

    if (maxPrice && response.data.price > maxPrice) return false;
    if (maxDistance && response.data.distance > maxDistance) return false;

    return true;
  }
}

// Export singleton
export const letaRatesService = new LetaRatesService();
