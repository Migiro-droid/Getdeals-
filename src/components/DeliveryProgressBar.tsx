/**
 * Delivery Progress Bar Component
 * Displays real-time delivery tracking similar to Glovo
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  Package,
  Navigation,
} from 'lucide-react';

interface DeliveryProgressBarProps {
  orderId: string;
  deliveryStatus?: string;
  riderName?: string;
  riderPhone?: string;
  deliveryAddress?: string;
  estimatedDeliveryTime?: string;
  trackingUrl?: string;
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
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: 'Order Placed',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    icon: <Package className="h-5 w-5" />,
  },
  assigned: {
    label: 'Driver Assigned',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: <Truck className="h-5 w-5" />,
  },
  in_transit: {
    label: 'On the Way',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    icon: <Navigation className="h-5 w-5 transform -rotate-45" />,
  },
  arriving: {
    label: 'Arriving Soon',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    icon: <Clock className="h-5 w-5" />,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  failed: {
    label: 'Delivery Failed',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    icon: <AlertCircle className="h-5 w-5" />,
  },
};

export function DeliveryProgressBar({
  orderId,
  deliveryStatus = 'pending',
  riderName,
  riderPhone,
  deliveryAddress,
  estimatedDeliveryTime,
  trackingUrl,
}: DeliveryProgressBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TrackingStatus>(
    (deliveryStatus as TrackingStatus) || 'pending'
  );

  const config = statusConfig[currentStatus];

  // Auto-refresh tracking data every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/${orderId}/tracking`);
        const data = await response.json();

        if (data.success && data.tracking) {
          setCurrentStatus(data.tracking.status);
        }
      } catch (error) {
        console.error('Failed to fetch tracking info:', error);
      } finally {
        setIsLoading(false);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  // Progress bar stages
  const stages: TrackingStatus[] = [
    'pending',
    'assigned',
    'in_transit',
    'arriving',
    'delivered',
  ];
  const currentStageIndex = stages.indexOf(currentStatus);
  const progressPercentage = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <Card className={`border-l-4 ${statusConfig[currentStatus].color.replace('bg-', 'border-')}`}>
      <CardContent className="p-6">
        {/* Header with Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${config.bgColor}`}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">{config.label}</h3>
              {isLoading && (
                <p className="text-xs text-gray-500">Updating...</p>
              )}
            </div>
          </div>
          <Badge className={`${config.color} text-white`}>
            {config.label}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.color} transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 px-1">
            {stages.map((stage, idx) => (
              <div
                key={stage}
                className="flex flex-col items-center"
              >
                <div
                  className={`w-4 h-4 rounded-full transition-all ${
                    idx <= currentStageIndex
                      ? `${statusConfig[stage].color} ring-4 ring-offset-2 ring-offset-white`
                      : 'bg-gray-300'
                  }`}
                />
                <span className={`text-xs mt-2 text-center w-12 ${
                  idx <= currentStageIndex ? 'font-semibold' : 'text-gray-500'
                }`}>
                  {stage === 'in_transit' ? 'Transit' : stage.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Info */}
        {(riderName || deliveryAddress || estimatedDeliveryTime) && (
          <div className={`rounded-lg p-4 mb-4 ${config.bgColor}`}>
            <div className="space-y-3">
              {/* Delivery Address */}
              {deliveryAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className={`h-4 w-4 mt-1 flex-shrink-0 ${config.textColor}`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Delivery Address</p>
                    <p className={`text-sm ${config.textColor}`}>{deliveryAddress}</p>
                  </div>
                </div>
              )}

              {/* Estimated Time */}
              {estimatedDeliveryTime && (
                <div className="flex items-start gap-3">
                  <Clock className={`h-4 w-4 mt-1 flex-shrink-0 ${config.textColor}`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Estimated Arrival</p>
                    <p className={`text-sm ${config.textColor}`}>{estimatedDeliveryTime}</p>
                  </div>
                </div>
              )}

              {/* Rider Info */}
              {riderName && (
                <div className="flex items-start gap-3">
                  <Truck className={`h-4 w-4 mt-1 flex-shrink-0 ${config.textColor}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600">Your Rider</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm font-medium ${config.textColor}`}>
                        {riderName}
                      </p>
                      {riderPhone && (
                        <a
                          href={`tel:${riderPhone}`}
                          className={`inline-flex items-center gap-1 px-3 py-1 bg-white rounded text-xs font-semibold ${config.textColor} hover:opacity-80 transition-opacity`}
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tracking Link */}
        {trackingUrl && currentStatus !== 'delivered' && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-semibold`}
          >
            <Navigation className="h-4 w-4 transform -rotate-45" />
            Live Tracking
          </a>
        )}

        {/* Error/Alert Messages */}
        {(currentStatus === 'failed' || currentStatus === 'cancelled') && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">
                {currentStatus === 'failed'
                  ? 'Delivery Issue'
                  : 'Order Cancelled'}
              </p>
              <p className="text-red-700 text-xs mt-1">
                {currentStatus === 'failed'
                  ? 'There was an issue with your delivery. Please contact support.'
                  : 'Your delivery order has been cancelled. Please contact support for assistance.'}
              </p>
            </div>
          </div>
        )}

        {/* Delivered Success */}
        {currentStatus === 'delivered' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 text-sm">
                Delivered Successfully
              </p>
              <p className="text-green-700 text-xs mt-1">
                Thank you for your purchase. Enjoy your order!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeliveryProgressBar;
