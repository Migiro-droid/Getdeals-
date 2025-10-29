/**
 * Delivery Progress Bar Component - Ultra Premium Modern Design
 * Real-time delivery tracking with stunning animations and UX
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
  Loader2,
  Zap,
  MessageCircle,
  Share2,
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
  const [showContactOptions, setShowContactOptions] = useState(false);

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
    <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white">
      <CardContent className="p-0">
        {/* Premium Header with animated gradient background */}
        <div className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} p-6 text-white relative overflow-hidden`}>
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl animate-pulse" 
              style={{ background: 'rgba(255,255,255,0.1)' }} 
            />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl animate-pulse delay-700" 
              style={{ background: 'rgba(255,255,255,0.05)' }} 
            />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-white/20 backdrop-blur-md rounded-full ring-2 ring-white/30 ${isLoading ? 'animate-spin' : ''}`}>
                {config.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{config.label}</h3>
                {isLoading && (
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating location...
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentStatus === 'in_transit' && (
                <Badge className="bg-white/30 text-white border-white/50 hover:bg-white/40 gap-1">
                  <Zap className="h-3 w-3" />
                  Live
                </Badge>
              )}
              {currentStatus === 'delivered' && (
                <Badge className="bg-white/30 text-white border-white/50 hover:bg-white/40">
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Progress Timeline with smooth animations */}
          <div className="space-y-6">
            {/* Timeline visualization */}
            <div className="relative">
              {/* Background progress bar with gradient */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-gray-100 to-gray-200 -translate-y-1/2 rounded-full" />
              
              {/* Animated progress bar overlay */}
              <div
                className={`absolute top-1/2 left-0 h-2 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} -translate-y-1/2 rounded-full transition-all duration-700 shadow-lg`}
                style={{ width: `${progressPercentage}%` }}
              />

              {/* Stage dots with improved styling */}
              <div className="flex justify-between relative">
                {stages.map((stage, idx) => {
                  const isActive = idx <= currentStageIndex;
                  const isCurrentStage = idx === currentStageIndex;
                  
                  return (
                    <div
                      key={stage}
                      className="flex flex-col items-center"
                    >
                      {/* Animated connecting line */}
                      {idx < stages.length - 1 && (
                        <div className={`absolute top-3 left-1/2 w-1/2 h-1 transition-all duration-500 ${isActive ? `bg-gradient-to-r ${statusConfig[stage].dotColor.replace('bg-', '')} opacity-100` : 'bg-gray-200 opacity-50'}`} />
                      )}

                      {/* Dot with enhanced styling */}
                      <div
                        className={`relative w-8 h-8 rounded-full border-4 transition-all duration-500 flex items-center justify-center ${
                          isActive
                            ? `${statusConfig[stage].dotColor} border-white shadow-lg ${isCurrentStage ? 'ring-4 ring-offset-2 ring-offset-white scale-125' : 'scale-110'}`
                            : 'bg-gray-300 border-gray-300 scale-90'
                        }`}
                      >
                        {isCurrentStage && (
                          <div className="absolute inset-1 rounded-full animate-pulse opacity-75" 
                            style={{
                              background: statusConfig[stage].dotColor.replace('bg-', ''),
                            }}
                          />
                        )}
                        {isActive && !isCurrentStage && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className={`text-xs font-bold mt-3 text-center w-16 leading-tight transition-all duration-300 ${
                        isActive ? `${config.textColor} scale-100` : 'text-gray-400 scale-90'
                      }`}>
                        {stage === 'in_transit' ? 'In Transit' : 
                         stage === 'pending' ? 'Placed' :
                         stage === 'assigned' ? 'Assigned' :
                         stage === 'arriving' ? 'Arriving' : 'Delivered'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Delivery Details Card with enhanced styling */}
          {(riderName || deliveryAddress || estimatedDeliveryTime) && (
            <div className={`rounded-2xl p-5 border-2 ${config.borderColor} ${config.bgColor} space-y-4 backdrop-blur-sm`}>
              {/* Delivery Address */}
              {deliveryAddress && (
                <div className="flex items-start gap-3 pb-3 border-b border-gray-200/50">
                  <div className={`p-2 rounded-lg ${config.bgColor} ${config.textColor}`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Delivery Address</p>
                    <p className={`text-sm font-semibold ${config.textColor} leading-snug`}>{deliveryAddress}</p>
                  </div>
                </div>
              )}

              {/* Estimated Time */}
              {estimatedDeliveryTime && (
                <div className="flex items-start gap-3 pb-3 border-b border-gray-200/50">
                  <div className={`p-2 rounded-lg ${config.bgColor} ${config.textColor}`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Est. Arrival</p>
                    <p className={`text-sm font-semibold ${config.textColor}`}>{estimatedDeliveryTime}</p>
                  </div>
                </div>
              )}

              {/* Rider Info with enhanced actions */}
              {riderName && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Rider</p>
                      <p className={`text-base font-bold mt-1 ${config.textColor}`}>{riderName}</p>
                    </div>
                  </div>
                  {riderPhone && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowContactOptions(!showContactOptions)}
                        className={`inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                      <a
                        href={`tel:${riderPhone}`}
                        className={`inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105`}
                      >
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Tracking Button - Enhanced CTA */}
          {trackingUrl && currentStatus !== 'delivered' && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white rounded-xl hover:shadow-xl transition-all font-bold text-base group shadow-lg transform hover:scale-[1.02]`}
            >
              <Navigation className="h-5 w-5 transform -rotate-45 group-hover:rotate-12 transition-transform" />
              View Real-Time Tracking
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          )}

          {/* Status Messages - Improved Design */}
          {currentStatus === 'delivered' && (
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-sm">
                  Delivered Successfully!
                </p>
                <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                  Thank you for your purchase. We hope you enjoy your order! Leave a review to help other shoppers.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'failed' && (
            <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-900 text-sm">
                  Delivery Issue
                </p>
                <p className="text-red-700 text-xs mt-1 leading-relaxed">
                  There was an issue with your delivery. Our support team will contact you shortly to reschedule.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'cancelled' && (
            <div className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  Order Cancelled
                </p>
                <p className="text-gray-700 text-xs mt-1 leading-relaxed">
                  Your delivery has been cancelled. Contact support if you'd like to place a new order.
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
