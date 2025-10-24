/**
 * Leta Orders Service
 * Handles all order-related operations
 */

import { getLetaClient } from "./client";
import {
  CreateOrderPayload,
  UpdateOrderPayload,
  CancelOrderPayload,
  OrderResponse,
  LetaValidationError,
} from "@/types/leta.types";

class LetaOrdersService {
  /**
   * Create new order in Leta
   */
  async createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
    // Validation
    this.validateCreateOrder(payload);

    try {
      const client = getLetaClient();
      const response = await client.post<OrderResponse>("/orders/add", payload);
      return response;
    } catch (error) {
      console.error("Failed to create order in Leta:", error);
      throw error;
    }
  }

  /**
   * Update existing order in Leta
   */
  async updateOrder(payload: UpdateOrderPayload): Promise<OrderResponse> {
    // Validation
    if (!payload.reference) {
      throw new LetaValidationError(
        "reference",
        "Order reference is required"
      );
    }

    try {
      const client = getLetaClient();
      const response = await client.put<OrderResponse>("/orders/update", payload);
      return response;
    } catch (error) {
      console.error("Failed to update order in Leta:", error);
      throw error;
    }
  }

  /**
   * Cancel order in Leta
   */
  async cancelOrder(reference: string): Promise<OrderResponse> {
    // Validation
    if (!reference) {
      throw new LetaValidationError(
        "reference",
        "Order reference is required"
      );
    }

    try {
      const client = getLetaClient();
      const payload: CancelOrderPayload = { reference };
      const response = await client.post<OrderResponse>("/orders/cancel", payload);
      return response;
    } catch (error) {
      console.error("Failed to cancel order in Leta:", error);
      throw error;
    }
  }

  /**
   * Get order status/details from Leta
   */
  async getOrder(reference: string): Promise<OrderResponse> {
    if (!reference) {
      throw new LetaValidationError(
        "reference",
        "Order reference is required"
      );
    }

    try {
      const client = getLetaClient();
      const response = await client.get<OrderResponse>(`/orders/${reference}`);
      return response;
    } catch (error) {
      console.error("Failed to fetch order from Leta:", error);
      throw error;
    }
  }

  /**
   * Validate create order payload
   */
  private validateCreateOrder(payload: CreateOrderPayload): void {
    // Customer validation
    if (!payload.customer?.phone_number) {
      throw new LetaValidationError(
        "customer.phone_number",
        "Customer phone number is required"
      );
    }
    if (!payload.customer?.email) {
      throw new LetaValidationError(
        "customer.email",
        "Customer email is required"
      );
    }
    if (!payload.customer?.name) {
      throw new LetaValidationError(
        "customer.name",
        "Customer name is required"
      );
    }

    // Reference validation
    if (!payload.reference) {
      throw new LetaValidationError(
        "reference",
        "Order reference is required"
      );
    }

    // Location validation
    if (!payload.dropoff?.latitude || !payload.dropoff?.longitude) {
      throw new LetaValidationError(
        "dropoff",
        "Dropoff location coordinates are required"
      );
    }

    // Pickup or depot validation
    if (
      !payload.pickup &&
      (!payload.pickup?.latitude || !payload.pickup?.longitude) &&
      !payload.depot_code
    ) {
      throw new LetaValidationError(
        "pickup|depot_code",
        "Either pickup location or depot_code is required"
      );
    }

    // Products validation
    if (!payload.products || payload.products.length === 0) {
      throw new LetaValidationError(
        "products",
        "At least one product is required"
      );
    }

    for (const product of payload.products) {
      if (!product.code) {
        throw new LetaValidationError(
          "products.code",
          "Product code is required"
        );
      }
      if (product.quantity <= 0) {
        throw new LetaValidationError(
          "products.quantity",
          "Product quantity must be greater than 0"
        );
      }
      if (product.price < 0) {
        throw new LetaValidationError(
          "products.price",
          "Product price cannot be negative"
        );
      }
    }

    // Payment method validation
    if (!["prepaid", "postpaid"].includes(payload.payment_method)) {
      throw new LetaValidationError(
        "payment_method",
        "Payment method must be 'prepaid' or 'postpaid'"
      );
    }
  }

  /**
   * Build order reference from GetDeals order ID
   */
  buildOrderReference(getdealsOrderId: string): string {
    return `GD-${getdealsOrderId}`;
  }

  /**
   * Parse GetDeals order ID from Leta reference
   */
  parseOrderReference(letaReference: string): string {
    if (letaReference.startsWith("GD-")) {
      return letaReference.substring(3);
    }
    return letaReference;
  }
}

// Export singleton
export const letaOrdersService = new LetaOrdersService();
