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
  | 'confirmed'
  | 'assigned'
  | 'in_transit'
  | 'arriving'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'cancelled';

// Map database order status to tracking status for display
const mapOrderStatusToTrackingStatus = (status: string): TrackingStatus => {
  const statusMap: Record<string, TrackingStatus> = {
    pending: 'pending',
    confirmed: 'confirmed',
    assigned: 'assigned',
    in_transit: 'in_transit',
    arriving: 'arriving',
    shipped: 'shipped',
    delivered: 'delivered',
    failed: 'failed',
    cancelled: 'cancelled',
    // Default mappings for any other status
    'order_placed': 'pending',
    'preparing': 'confirmed',
    'out_for_delivery': 'in_transit',
  };
  return (statusMap[status] || 'pending') as TrackingStatus;
};

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
  confirmed: {
    label: 'Order Confirmed',
    gradientFrom: 'from-cyan-400',
    gradientTo: 'to-blue-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    icon: <CheckCircle2 className="h-5 w-5" />,
    dotColor: 'bg-cyan-500',
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
  shipped: {
    label: 'Shipped',
    gradientFrom: 'from-indigo-400',
    gradientTo: 'to-purple-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    icon: <Truck className="h-5 w-5" />,
    dotColor: 'bg-indigo-500',
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
    mapOrderStatusToTrackingStatus(deliveryStatus || 'pending')
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
          setCurrentStatus(mapOrderStatusToTrackingStatus(data.tracking.status));
        }
      } catch (error) {
        console.error('Failed to fetch tracking info:', error);
      } finally {
        setIsLoading(false);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  // Progress bar stages - updated to include confirmed and shipped
  const stages: TrackingStatus[] = [
    'pending',
    'confirmed',
    'assigned',
    'in_transit',
    'arriving',
    'delivered',
  ];
  const currentStageIndex = stages.indexOf(currentStatus);
  const progressPercentage = ((currentStageIndex + 1) / stages.length) * 100;


  return (
    <Card className="overflow-hidden border-0 shadow-2xl bg-white group hover:shadow-3xl transition-all duration-500">
      <CardContent className="p-0">
        {/* Premium Animated Header with gradient background and glassmorphism */}
        <div className={`bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} p-8 text-white relative overflow-hidden`}>
          {/* Enhanced animated background with multiple layers */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse" 
              style={{ background: 'rgba(255,255,255,0.15)', animationDuration: '4s' }} 
            />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl animate-pulse" 
              style={{ background: 'rgba(255,255,255,0.1)', animationDuration: '6s', animationDelay: '1s' }} 
            />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse" 
              style={{ background: 'rgba(255,255,255,0.08)', animationDuration: '5s', animationDelay: '2s' }} 
            />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Animated icon container with glassmorphism */}
              <div className={`p-4 bg-white/15 backdrop-blur-xl rounded-2xl ring-2 ring-white/30 ${isLoading ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform duration-300`}>
                <div className="text-white text-2xl">
                  {config.icon}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-2xl leading-tight tracking-tight">{config.label}</h3>
                  {currentStatus === 'in_transit' && (
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </div>
                  )}
                </div>
                {isLoading && (
                  <p className="text-sm text-white/70 mt-2 flex items-center gap-2 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating real-time location...
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-col sm:flex-row">
              {currentStatus === 'in_transit' && (
                <Badge className="bg-white/25 text-white border-white/50 hover:bg-white/40 gap-1.5 px-3 py-1.5 backdrop-blur-sm font-semibold">
                  <Zap className="h-4 w-4 animate-pulse" />
                  Live Tracking
                </Badge>
              )}
              {currentStatus === 'delivered' && (
                <Badge className="bg-white/25 text-white border-white/50 hover:bg-white/40 px-3 py-1.5 backdrop-blur-sm font-semibold">
                  ✓ Completed
                </Badge>
              )}
              {currentStatus === 'confirmed' && (
                <Badge className="bg-white/25 text-white border-white/50 hover:bg-white/40 px-3 py-1.5 backdrop-blur-sm font-semibold">
                  Processing
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Enhanced Progress Timeline with premium design */}
          <div className="space-y-8">
            {/* Timeline visualization with enhanced styling */}
            <div className="relative px-2">
              {/* Background progress bar with blur effect */}
              <div className="absolute top-1/2 left-0 right-0 h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 -translate-y-1/2 rounded-full shadow-sm" />
              
              {/* Animated progress bar overlay with glow */}
              <div
                className={`absolute top-1/2 left-0 h-3 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} -translate-y-1/2 rounded-full transition-all duration-700 shadow-2xl`}
                style={{ 
                  width: `${progressPercentage}%`,
                  boxShadow: `0 0 20px currentColor`
                }}
              />

              {/* Stage dots with premium styling */}
              <div className="flex justify-between relative z-10">
                {stages.map((stage, idx) => {
                  const isActive = idx <= currentStageIndex;
                  const isCurrentStage = idx === currentStageIndex;
                  const stageConfig = statusConfig[stage];
                  
                  return (
                    <div
                      key={stage}
                      className="flex flex-col items-center"
                    >
                      {/* Dot with premium glassmorphism */}
                      <div
                        className={`relative w-10 h-10 rounded-full border-4 transition-all duration-500 flex items-center justify-center font-bold text-white shadow-lg transform ${
                          isActive
                            ? `${stageConfig.dotColor} border-white shadow-2xl ${isCurrentStage ? 'ring-4 ring-offset-3 ring-offset-white scale-125 animate-pulse' : 'scale-110'}`
                            : 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-300 scale-90 opacity-75'
                        }`}
                      >
                        {isActive && !isCurrentStage && (
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        )}
                        {isCurrentStage && (
                          <div className="absolute inset-0 rounded-full animate-spin" style={{
                            background: `conic-gradient(${stageConfig.dotColor.replace('bg-', '')}, transparent)`,
                            opacity: 0.3,
                          }} />
                        )}
                      </div>
                      
                      {/* Enhanced label with typography */}
                      <span className={`text-xs font-bold mt-4 text-center w-24 leading-tight transition-all duration-300 tracking-wide uppercase ${
                        isActive ? `${config.textColor} scale-100 opacity-100` : 'text-gray-400 scale-90 opacity-60'
                      }`}>
                        {stage === 'in_transit' ? 'In Transit' : 
                         stage === 'pending' ? 'Order Placed' :
                         stage === 'confirmed' ? 'Confirmed' :
                         stage === 'assigned' ? 'Driver Assigned' :
                         stage === 'arriving' ? 'Arriving Soon' :
                         stage === 'shipped' ? 'Shipped' : 'Delivered'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Delivery Details with premium card design */}
          {(riderName || deliveryAddress || estimatedDeliveryTime) && (
            <div className={`rounded-3xl p-6 border-2 ${config.borderColor} ${config.bgColor} space-y-5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
              {/* Delivery Address */}
              {deliveryAddress && (
                <div className="flex items-start gap-4 pb-4 border-b-2 border-gray-200/40">
                  <div className={`p-3 rounded-2xl ${config.bgColor} ${config.textColor} flex-shrink-0 shadow-md`}>
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">📍 Delivery Address</p>
                    <p className={`text-base font-bold ${config.textColor} leading-snug`}>{deliveryAddress}</p>
                  </div>
                </div>
              )}

              {/* Estimated Time */}
              {estimatedDeliveryTime && (
                <div className="flex items-start gap-4 pb-4 border-b-2 border-gray-200/40">
                  <div className={`p-3 rounded-2xl ${config.bgColor} ${config.textColor} flex-shrink-0 shadow-md`}>
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">⏱️ Estimated Arrival</p>
                    <p className={`text-base font-bold ${config.textColor}`}>{estimatedDeliveryTime}</p>
                  </div>
                </div>
              )}

              {/* Rider Info with premium actions */}
              {riderName && (
                <div className="flex items-center justify-between pt-2 gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-center justify-center flex-shrink-0 shadow-lg text-white`}>
                      <Truck className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">👤 Your Rider</p>
                      <p className={`text-lg font-bold mt-1.5 ${config.textColor}`}>{riderName}</p>
                    </div>
                  </div>
                  {riderPhone && (
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <button
                        onClick={() => setShowContactOptions(!showContactOptions)}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95`}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                      <a
                        href={`tel:${riderPhone}`}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 text-white rounded-xl hover:from-emerald-600 hover:via-green-700 hover:to-emerald-800 transition-all font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95`}
                      >
                        <Phone className="h-5 w-5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Tracking Button - Premium CTA */}
          {trackingUrl && currentStatus !== 'delivered' && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white rounded-2xl hover:shadow-2xl transition-all font-bold text-lg group shadow-xl transform hover:scale-105 active:scale-95 overflow-hidden relative`}
            >
              <span className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <Navigation className="h-6 w-6 transform -rotate-45 group-hover:rotate-0 transition-transform duration-300 relative z-10" />
              <span className="relative z-10">View Real-Time Tracking</span>
              <ChevronRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
            </a>
          )}

          {/* Status Messages - Premium Design */}
          {currentStatus === 'delivered' && (
            <div className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex-shrink-0 shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-black text-emerald-900 text-base">
                  🎉 Delivered Successfully!
                </p>
                <p className="text-emerald-700 text-sm mt-2 leading-relaxed font-medium">
                  Your order has arrived! We hope you enjoy your purchase. Don't forget to leave a review to help other shoppers make great choices.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'failed' && (
            <div className="p-6 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-2 border-red-200 rounded-2xl flex items-start gap-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="p-3 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex-shrink-0 shadow-sm">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="font-black text-red-900 text-base">
                  ⚠️ Delivery Issue
                </p>
                <p className="text-red-700 text-sm mt-2 leading-relaxed font-medium">
                  There was an issue with your delivery. Our support team will contact you shortly to reschedule. Contact support if you need immediate assistance.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'cancelled' && (
            <div className="p-6 bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 border-2 border-gray-300 rounded-2xl flex items-start gap-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="p-3 bg-gradient-to-br from-gray-100 to-slate-100 rounded-xl flex-shrink-0 shadow-sm">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-base">
                  ❌ Order Cancelled
                </p>
                <p className="text-gray-700 text-sm mt-2 leading-relaxed font-medium">
                  Your delivery has been cancelled. If you'd like to place a new order, we're just a few clicks away. Contact support if you have questions.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'confirmed' && (
            <div className="p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 border-2 border-blue-200 rounded-2xl flex items-start gap-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex-shrink-0 shadow-sm animate-pulse">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-black text-blue-900 text-base">
                  ✓ Order Confirmed
                </p>
                <p className="text-blue-700 text-sm mt-2 leading-relaxed font-medium">
                  Your order has been confirmed and is being prepared for delivery. You'll receive an update once it ships.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}