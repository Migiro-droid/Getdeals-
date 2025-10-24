/**
 * Leta Drivers Service
 * Handles driver availability checks
 */

import { getLetaClient } from "./client";
import {
  DriverAvailabilityPayload,
  DriverAvailabilityResponse,
  DriverMetrics,
  LetaValidationError,
} from "@/types/leta.types";

class LetaDriversService {
  /**
   * Check driver availability for a delivery route
   */
  async checkAvailability(
    payload: DriverAvailabilityPayload
  ): Promise<DriverAvailabilityResponse> {
    // Validation
    this.validatePayload(payload);

    try {
      const client = getLetaClient();
      const response = await client.post<DriverAvailabilityResponse>(
        "/drivers/availability/",
        payload
      );
      return response;
    } catch (error) {
      console.error(
        "Failed to check driver availability from Leta:",
        error
      );
      throw error;
    }
  }

  /**
   * Check availability with simple coordinates
   */
  async checkAvailabilitySimple(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    searchRadiusMeters = 5000,
    orderPrepTimeSeconds = 600
  ): Promise<DriverAvailabilityResponse> {
    return this.checkAvailability({
      origin: {
        latitude: originLat,
        longitude: originLng,
      },
      destination: {
        latitude: destLat,
        longitude: destLng,
      },
      search_radius: searchRadiusMeters,
      order_preparation_time: orderPrepTimeSeconds,
    });
  }

  /**
   * Validate payload
   */
  private validatePayload(payload: DriverAvailabilityPayload): void {
    // Origin validation
    if (!payload.origin?.latitude || !payload.origin?.longitude) {
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

    // Search radius validation (optional, but should be positive if provided)
    if (
      payload.search_radius !== undefined &&
      payload.search_radius < 0
    ) {
      throw new LetaValidationError(
        "search_radius",
        "Search radius must be positive"
      );
    }

    // Order prep time validation (optional, but should be positive if provided)
    if (
      payload.order_preparation_time !== undefined &&
      payload.order_preparation_time < 0
    ) {
      throw new LetaValidationError(
        "order_preparation_time",
        "Order preparation time must be positive"
      );
    }
  }

  /**
   * Check if drivers are available
   */
  driversAvailable(response: DriverAvailabilityResponse): boolean {
    return response.data ? response.data.available_drivers > 0 : false;
  }

  /**
   * Get availability metrics
   */
  getMetrics(response: DriverAvailabilityResponse): DriverMetrics | null {
    return response.data || null;
  }

  /**
   * Format availability for display
   */
  formatAvailability(response: DriverAvailabilityResponse) {
    if (!response.data) return null;

    return {
      available: response.data.available_drivers > 0,
      drivers: response.data.available_drivers,
      waitTime: `${response.data.average_wait_time} mins`,
      closestDistance: `${response.data.closest_driver_distance.toFixed(2)} km`,
      busy: response.data.busy_drivers,
      raw: response.data,
    };
  }

  /**
   * Estimate delivery time
   */
  estimateDeliveryTime(
    availabilityMetrics: DriverMetrics,
    orderPrepTimeSeconds: number = 600
  ): { estimatedMinutes: number; estimatedTime: Date } {
    const prepMinutes = Math.ceil(orderPrepTimeSeconds / 60);
    const totalMinutes =
      availabilityMetrics.average_wait_time + prepMinutes;

    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + totalMinutes);

    return {
      estimatedMinutes: totalMinutes,
      estimatedTime,
    };
  }
}

// Export singleton
export const letaDriversService = new LetaDriversService();
