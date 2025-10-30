import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle2,
  Package,
  MessageCircle,
  Loader2,
  Bike,
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
  | 'confirmed'
  | 'assigned'
  | 'in_transit'
  | 'arriving'
  | 'delivered'
  | 'failed'
  | 'cancelled';

const mapOrderStatusToTrackingStatus = (status: string): TrackingStatus => {
  const statusMap: Record<string, TrackingStatus> = {
    pending: 'pending',
    confirmed: 'confirmed',
    assigned: 'assigned',
    in_transit: 'in_transit',
    arriving: 'arriving',
    delivered: 'delivered',
    failed: 'failed',
    cancelled: 'cancelled',
    shipped: 'in_transit',
  };
  return (statusMap[status] || 'pending') as TrackingStatus;
};

const statusConfig: Record<
  TrackingStatus,
  {
    label: string;
    color: string;
    textColor: string;
    bgLight: string;
    borderColor: string;
  }
> = {
  pending: {
    label: 'Order Placed',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  assigned: {
    label: 'Rider Assigned',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  in_transit: {
    label: 'On the Way',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  arriving: {
    label: 'Arriving Soon',
    color: 'bg-pink-500',
    textColor: 'text-pink-700',
    bgLight: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  failed: {
    label: 'Delivery Failed',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-400',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-200',
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
    mapOrderStatusToTrackingStatus(deliveryStatus || 'pending')
  );

  const config = statusConfig[currentStatus];

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/${orderId}/tracking`);
        const data = await response.json();
        if (data.success && data.tracking) {
          setCurrentStatus(mapOrderStatusToTrackingStatus(data.tracking.status));
        }
      } catch (error) {
        console.error('Failed to fetch tracking info:', error);
      } finally {
        setIsLoading(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [orderId]);

  const stages: TrackingStatus[] = ['pending', 'confirmed', 'assigned', 'in_transit', 'arriving', 'delivered'];
  const currentStageIndex = Math.max(stages.indexOf(currentStatus), 0);
  const progressPercentage = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-md bg-white">
      <CardContent className="p-0">
        {/* Clean Header */}
        <div className={`${config.color} text-white p-4 sm:p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-full bg-white/20 flex-shrink-0">
              {currentStatus === 'in_transit' && <Bike className="h-5 w-5" />}
              {currentStatus === 'delivered' && <CheckCircle2 className="h-5 w-5" />}
              {currentStatus === 'pending' && <Package className="h-5 w-5" />}
              {currentStatus === 'confirmed' && <CheckCircle2 className="h-5 w-5" />}
              {currentStatus === 'assigned' && <Bike className="h-5 w-5" />}
              {currentStatus === 'arriving' && <MapPin className="h-5 w-5" />}
              {(currentStatus === 'failed' || currentStatus === 'cancelled') && <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg">{config.label}</h3>
              {isLoading && (
                <p className="text-xs text-white/70 flex items-center gap-1 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                  Updating...
                </p>
              )}
            </div>
          </div>
          {currentStatus === 'in_transit' && (
            <Badge className="bg-white/25 text-white border-white/40 text-xs font-semibold ml-2 flex-shrink-0">
              🔴 Live
            </Badge>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Simple Progress Timeline - Glovo Style */}
          <div className="space-y-3">
            {/* Progress bar */}
            <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.color} transition-all duration-700`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Status dots with scooter indicator */}
            <div className="flex justify-between px-1">
              {stages.map((stage, idx) => {
                const isActive = idx <= currentStageIndex;
                const isCurrentStage = stage === currentStatus;

                return (
                  <div key={stage} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isActive ? `${config.color} text-white` : 'bg-gray-300 text-gray-600'
                      } ${isCurrentStage ? 'ring-2 ring-offset-2 ring-current' : ''}`}
                    >
                      {isCurrentStage && riderName ? (
                        <Bike className="h-4 w-4" />
                      ) : isActive ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-current rounded-full" />
                      )}
                    </div>
                    <span className={`text-xs font-semibold text-center leading-tight w-12 ${isActive ? config.textColor : 'text-gray-400'}`}>
                      {stage === 'in_transit' ? 'Transit'
                        : stage === 'pending' ? 'Placed'
                        : stage === 'confirmed' ? 'Confirm'
                        : stage === 'assigned' ? 'Assign'
                        : stage === 'arriving' ? 'Arrive'
                        : 'Done'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details - Clean Layout */}
          <div className={`space-y-3 ${config.bgLight} rounded-lg p-4 border ${config.borderColor}`}>
            {deliveryAddress && (
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Delivery To</p>
                  <p className="text-sm font-semibold text-gray-900 break-words">{deliveryAddress}</p>
                </div>
              </div>
            )}

            {estimatedDeliveryTime && (
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Est. Arrival</p>
                  <p className="text-sm font-semibold text-gray-900">{estimatedDeliveryTime}</p>
                </div>
              </div>
            )}

            {riderName && (
              <div className="flex gap-3 items-center justify-between pt-2 border-t border-gray-300">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <Bike className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Your Rider</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{riderName}</p>
                  </div>
                </div>
                {riderPhone && (
                  <div className="flex gap-1.5 ml-2 flex-shrink-0">
                    <a
                      href={`sms:${riderPhone}`}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                      title="Send message"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                    <a
                      href={`tel:${riderPhone}`}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                      title="Call rider"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {currentStatus === 'delivered' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 text-sm">Delivered!</p>
                <p className="text-xs text-emerald-700 mt-1">Thank you for your order. Enjoy!</p>
              </div>
            </div>
          )}

          {currentStatus === 'failed' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">Delivery Issue</p>
                <p className="text-xs text-red-700 mt-1">Our team will contact you to reschedule.</p>
              </div>
            </div>
          )}

          {currentStatus === 'cancelled' && (
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Order Cancelled</p>
                <p className="text-xs text-gray-700 mt-1">Contact support if you need help.</p>
              </div>
            </div>
          )}

          {currentStatus === 'pending' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm">Order Placed</p>
                <p className="text-xs text-blue-700 mt-1">We're preparing your order.</p>
              </div>
            </div>
          )}

          {trackingUrl && currentStatus !== 'delivered' && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full p-3 ${config.bgLight} hover:opacity-80 border ${config.borderColor} rounded-lg text-center ${config.textColor} font-semibold text-sm transition-all`}
            >
              View Live Tracking →
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DeliveryProgressBar;
