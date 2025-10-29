/**
 * Delivery Progress Bar Component - Premium Design
 * Modern, sleek real-time delivery tracking with smooth animations
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
  ChevronRight,
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
    gradientFrom: string;
    gradientTo: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: React.ReactNode;
    dotColor: string;
  }
> = {
  pending: {
    label: 'Order Placed',
    gradientFrom: 'from-slate-400',
    gradientTo: 'to-slate-500',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: <Package className="h-5 w-5" />,
    dotColor: 'bg-slate-400',
  },
  assigned: {
    label: 'Driver Assigned',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: <Truck className="h-5 w-5" />,
    dotColor: 'bg-blue-500',
  },
  in_transit: {
    label: 'On the Way',
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: <Navigation className="h-5 w-5 transform -rotate-45" />,
    dotColor: 'bg-amber-500',
  },
  arriving: {
    label: 'Arriving Soon',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: <Clock className="h-5 w-5" />,
    dotColor: 'bg-purple-500',
  },
  delivered: {
    label: 'Delivered',
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: <CheckCircle2 className="h-5 w-5" />,
    dotColor: 'bg-emerald-500',
  },
  failed: {
    label: 'Delivery Failed',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-rose-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: <AlertCircle className="h-5 w-5" />,
    dotColor: 'bg-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    gradientFrom: 'from-gray-400',
    gradientTo: 'to-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: <AlertCircle className="h-5 w-5" />,
    dotColor: 'bg-gray-500',
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
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                {config.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{config.label}</h3>
                {isLoading && (
                  <p className="text-xs text-white/70 mt-1">Updating location...</p>
                )}
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
              Live
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Progress Timeline */}
          <div className="space-y-4">
            <div className="relative">
              {/* Background progress bar */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 to-gray-200 -translate-y-1/2" />
              
              {/* Animated progress bar */}
              <div
                className={`absolute top-1/2 left-0 h-1 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} -translate-y-1/2 transition-all duration-700`}
                style={{ width: `${progressPercentage}%` }}
              />

              {/* Stage dots and labels */}
              <div className="flex justify-between relative">
                {stages.map((stage, idx) => {
                  const isActive = idx <= currentStageIndex;
                  const isCurrentStage = idx === currentStageIndex;
                  
                  return (
                    <div
                      key={stage}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`relative w-6 h-6 rounded-full border-4 transition-all duration-500 ${
                          isActive
                            ? `${statusConfig[stage].dotColor} border-white shadow-md ${isCurrentStage ? 'ring-4 ring-offset-2 ring-offset-white scale-125' : ''}`
                            : 'bg-gray-300 border-white'
                        }`}
                      >
                        {isCurrentStage && (
                          <div className="absolute inset-0 rounded-full animate-pulse opacity-50" 
                            style={{
                              background: statusConfig[stage].dotColor.replace('bg-', ''),
                            }}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-semibold mt-3 text-center w-14 leading-tight transition-colors ${
                        isActive ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {stage === 'in_transit' ? 'Transit' : 
                         stage === 'pending' ? 'Placed' :
                         stage === 'assigned' ? 'Assigned' :
                         stage === 'arriving' ? 'Arriving' : 'Done'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Delivery Details Card */}
          {(riderName || deliveryAddress || estimatedDeliveryTime) && (
            <div className={`rounded-xl p-4 border ${config.borderColor} ${config.bgColor} space-y-4`}>
              {/* Delivery Address */}
              {deliveryAddress && (
                <div className="flex items-start gap-3 pb-3 border-b border-gray-200/50">
                  <MapPin className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.textColor}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Address</p>
                    <p className={`text-sm font-medium mt-1 ${config.textColor}`}>{deliveryAddress}</p>
                  </div>
                </div>
              )}

              {/* Estimated Time */}
              {estimatedDeliveryTime && (
                <div className="flex items-start gap-3 pb-3 border-b border-gray-200/50">
                  <Clock className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.textColor}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Est. Arrival</p>
                    <p className={`text-sm font-medium mt-1 ${config.textColor}`}>{estimatedDeliveryTime}</p>
                  </div>
                </div>
              )}

              {/* Rider Info with Call Button */}
              {riderName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Rider</p>
                      <p className={`text-sm font-bold mt-1 ${config.textColor}`}>{riderName}</p>
                    </div>
                  </div>
                  {riderPhone && (
                    <a
                      href={`tel:${riderPhone}`}
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105`}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Tracking Button */}
          {trackingUrl && currentStatus !== 'delivered' && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm group`}
            >
              <Navigation className="h-4 w-4 transform -rotate-45 group-hover:rotate-0 transition-transform" />
              Real-Time Tracking
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          )}

          {/* Status Messages */}
          {currentStatus === 'delivered' && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 text-sm">
                  Delivered Successfully! 🎉
                </p>
                <p className="text-emerald-700 text-xs mt-1">
                  Thank you for your purchase. We hope you enjoy your order!
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'failed' && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">
                  Delivery Issue
                </p>
                <p className="text-red-700 text-xs mt-1">
                  There was an issue with your delivery. Please contact support for assistance.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'cancelled' && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Order Cancelled
                </p>
                <p className="text-gray-700 text-xs mt-1">
                  Your delivery order has been cancelled. Contact support if you need help.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DeliveryProgressBar;
