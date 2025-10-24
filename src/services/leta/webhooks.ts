// webhooks.ts - Handle incoming webhooks from Leta

import { Request, Response } from 'express';

export interface LetaWebhookPayload {
  order_id: string;
  order_status: 'pending' | 'assigned' | 'accepted' | 'arrived_at_store' | 'pickup' | 'arrived_at_destination' | 'delivered' | 'cancelled' | 'failed';
  tracking_url?: string;
  timestamp: string;
  rider?: {
    id: number;
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  delivery_otp?: string;
  reason?: string;
  error_message?: string;
}

export interface WebhookEvent {
  id: string;
  letaOrderId: string;
  status: string;
  timestamp: Date;
  payload: LetaWebhookPayload;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

// In-memory webhook log (in production, use database)
const webhookLogs: WebhookEvent[] = [];

/**
 * Handle incoming webhook from Leta
 * Should be called from: POST /api/leta/webhook
 */
export async function handleLetaWebhook(
  payload: LetaWebhookPayload,
  onStatusUpdate?: (orderId: string, status: string, data: LetaWebhookPayload) => Promise<void>
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📦 Received Leta webhook:', {
      orderId: payload.order_id,
      status: payload.order_status,
      timestamp: payload.timestamp,
    });

    // Log webhook event
    const event: WebhookEvent = {
      id: `webhook_${Date.now()}_${Math.random()}`,
      letaOrderId: payload.order_id,
      status: payload.order_status,
      timestamp: new Date(),
      payload,
      processed: false,
    };
    webhookLogs.push(event);

    // Call status update callback if provided
    if (onStatusUpdate) {
      await onStatusUpdate(payload.order_id, payload.order_status, payload);
      event.processed = true;
      event.processedAt = new Date();
    }

    // Log rider information if available
    if (payload.rider) {
      console.log('🚗 Driver info:', {
        name: payload.rider.name,
        phone: payload.rider.phone,
        location: `${payload.rider.latitude}, ${payload.rider.longitude}`,
      });
    }

    // Log delivery OTP if available
    if (payload.delivery_otp) {
      console.log('🔐 Delivery OTP:', payload.delivery_otp);
    }

    return {
      success: true,
      message: `Webhook processed for order ${payload.order_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error processing webhook:', errorMessage);

    // Log error
    const event: WebhookEvent = {
      id: `webhook_${Date.now()}_${Math.random()}`,
      letaOrderId: payload.order_id,
      status: payload.order_status,
      timestamp: new Date(),
      payload,
      processed: false,
      error: errorMessage,
    };
    webhookLogs.push(event);

    return {
      success: false,
      message: `Error processing webhook: ${errorMessage}`,
    };
  }
}

/**
 * Express middleware for webhook handling
 */
export function createWebhookMiddleware(
  onStatusUpdate?: (orderId: string, status: string, data: LetaWebhookPayload) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    try {
      const payload = req.body as LetaWebhookPayload;

      // Validate webhook payload
      if (!payload.order_id || !payload.order_status) {
        return res.status(400).json({
          error: 'Missing required fields: order_id and order_status',
        });
      }

      const result = await handleLetaWebhook(payload, onStatusUpdate);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: errorMessage,
      });
    }
  };
}

/**
 * Get webhook logs for debugging
 */
export function getWebhookLogs(
  limit: number = 100,
  orderId?: string
): WebhookEvent[] {
  let logs = webhookLogs;

  if (orderId) {
    logs = logs.filter(log => log.letaOrderId === orderId);
  }

  return logs.slice(-limit);
}

/**
 * Clear webhook logs (for testing)
 */
export function clearWebhookLogs(): void {
  webhookLogs.length = 0;
  console.log('✨ Webhook logs cleared');
}

/**
 * Map Leta order status to internal order status
 */
export function mapLetaStatusToInternal(letaStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'assigned': 'assigned',
    'accepted': 'confirmed',
    'arrived_at_store': 'arrived_at_pickup',
    'pickup': 'picked_up',
    'arrived_at_destination': 'arrived_at_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'failed': 'failed',
  };

  return statusMap[letaStatus] || letaStatus;
}

/**
 * Map internal order status to Leta order status
 */
export function mapInternalStatusToLeta(internalStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'assigned': 'assigned',
    'confirmed': 'accepted',
    'arrived_at_pickup': 'arrived_at_store',
    'picked_up': 'pickup',
    'arrived_at_delivery': 'arrived_at_destination',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'failed': 'failed',
  };

  return statusMap[internalStatus] || internalStatus;
}
