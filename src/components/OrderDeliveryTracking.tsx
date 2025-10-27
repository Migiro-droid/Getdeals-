/**
 * Order Delivery Tracking Component
 * Displays real-time delivery tracking for Orders with Leta integration
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  Package,
} from 'lucide-react';

interface OrderDeliveryTrackingProps {
  orderId: string;
  letaOrderId?: string;
  trackingUrl?: string;
  deliveryStatus?: string;
  riderName?: string;
  riderPhone?: string;
  deliveryAddress?: string;
  estimatedDeliveryTime?: string;
}

type TrackingStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'arriving'
  | 'delivered'
  | 'failed'
  | 'cancelled';

const statusConfig: Record<
  TrackingStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800',
    icon: <Package className="h-4 w-4" />,
  },
  assigned: {
    label: 'Rider Assigned',
    color: 'bg-blue-100 text-blue-800',
    icon: <Truck className="h-4 w-4" />,
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-orange-100 text-orange-800',
    icon: <Truck className="h-4 w-4" />,
  },
  arriving: {
    label: 'Arriving Soon',
    color: 'bg-purple-100 text-purple-800',
    icon: <Clock className="h-4 w-4" />,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  failed: {
    label: 'Delivery Failed',
    color: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-200 text-gray-800',
    icon: <AlertCircle className="h-4 w-4" />,
  },
};

export function OrderDeliveryTracking({
  orderId,
  letaOrderId,
  trackingUrl,
  deliveryStatus = 'pending',
  riderName,
  riderPhone,
  deliveryAddress,
  estimatedDeliveryTime,
}: OrderDeliveryTrackingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TrackingStatus>(
    (deliveryStatus as TrackingStatus) || 'pending'
  );
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const config = statusConfig[currentStatus];

  // Fetch tracking with retry logic
  const fetchTrackingWithRetry = async (attempt = 0): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      
      if (response.status === 404 && attempt < maxRetries) {
        // Order might not be fully synced yet, retry with exponential backoff
        const delayMs = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
        console.warn(`⚠️ Order not found (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms...`);
        setRetryCount(attempt + 1);
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return fetchTrackingWithRetry(attempt + 1);
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Failed to fetch tracking (status: ${response.status}):`, data);
        return false;
      }

      if (data.success && data.tracking) {
        setCurrentStatus(data.tracking.status);
        setRetryCount(0); // Reset retry count on success
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to fetch tracking info:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh tracking data every 30 seconds
  useEffect(() => {
    // Fetch immediately on mount
    fetchTrackingWithRetry();

    const interval = setInterval(() => {
      fetchTrackingWithRetry();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  if (!letaOrderId) {
    return null; // Don't show tracking for pickup orders
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge className={`${config.color} flex items-center gap-2`}>
          {config.icon}
          {config.label}
        </Badge>
        {isLoading && <span className="text-sm text-gray-500">Updating...</span>}
      </div>

      {/* Main Tracking Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delivery Address */}
          {deliveryAddress && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Delivery Address
              </label>
              <p className="text-gray-900">{deliveryAddress}</p>
            </div>
          )}

          {/* Rider Information */}
          {riderName && (
            <div className="border-t pt-4 space-y-3">
              <label className="text-sm font-medium text-gray-600">
                Your Rider
              </label>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {riderName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{riderName}</p>
                  {riderPhone && (
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Phone className="h-4 w-4" />
                      <a
                        href={`tel:${riderPhone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {riderPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estimated Delivery Time */}
          {estimatedDeliveryTime && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimated Delivery
              </label>
              <p className="text-gray-900 mt-1">{estimatedDeliveryTime}</p>
            </div>
          )}

          {/* Tracking URL */}
          {trackingUrl && (
            <div className="border-t pt-4">
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MapPin className="h-4 w-4 mr-2" />
                View Live Tracking
              </a>
            </div>
          )}

          {/* Status Timeline */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-600 mb-3 block">
              Delivery Progress
            </label>
            <div className="space-y-3">
              {(['pending', 'assigned', 'in_transit', 'arriving', 'delivered'] as const).map((status, idx, arr) => {
                const currentIdx = arr.indexOf(currentStatus === 'failed' || currentStatus === 'cancelled' ? 'pending' : (currentStatus as any));
                const isActive = currentIdx >= idx;
                const isCompleted = currentIdx > idx;

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isCompleted
                          ? 'bg-green-600'
                          : isActive
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isActive ? 'font-medium text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {statusConfig[status].label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error/Alert Messages */}
      {currentStatus === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There was an issue with your delivery. Please contact support or try again.
          </AlertDescription>
        </Alert>
      )}

      {currentStatus === 'cancelled' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your delivery order has been cancelled. Please contact support for assistance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default OrderDeliveryTracking;
