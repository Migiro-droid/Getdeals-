import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Truck, 
  Navigation, 
  Share2,
  Loader2,
  ArrowLeft,
  Package
} from 'lucide-react';
import { getOrderWithTracking } from '@/services/orderService';
import { supabase } from '@/lib/supabase';

interface RiderInfo {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  vehicle: string;
  rating: number;
}

interface OrderTracking {
  id: string;
  order_reference: string;
  status: string;
  leta_status: string;
  delivery_address: {
    name: string;
    latitude: number;
    longitude: number;
  };
  rider_info: RiderInfo | null;
  delivery_otp: string | null;
  estimated_delivery_time: string | null;
  total_amount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  customer_phone: string;
  created_at: string;
}

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: '📋', description: 'Order received' },
  { key: 'assigned', label: 'Assigned', icon: '👤', description: 'Driver assigned' },
  { key: 'picked_up', label: 'Picked Up', icon: '📦', description: 'Order picked up' },
  { key: 'in_transit', label: 'In Transit', icon: '🚗', description: 'On the way' },
  { key: 'delivered', label: 'Delivered', icon: '✅', description: 'Order completed' }
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  in_transit: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  failed: 'bg-red-100 text-red-800 border-red-300'
};

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  // State management
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch from database
        const { data, error: dbError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (dbError) throw dbError;

        if (!data) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        setOrder(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, toast]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!order?.leta_order_id || wsConnected) return;

    const connectWebSocket = () => {
      const wsUrl = `wss://sandbox.integrations.leta.ai/ws/orders/${order.leta_order_id}`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            if (data.order_status) {
              setOrder(prev => prev ? { ...prev, leta_status: data.order_status } : null);
            }

            if (data.rider) {
              setRiderLocation({
                lat: parseFloat(data.rider.latitude),
                lng: parseFloat(data.rider.longitude)
              });

              setOrder(prev => prev ? {
                ...prev,
                rider_info: {
                  id: data.rider.id,
                  name: data.rider.name,
                  phone: data.rider.phone,
                  latitude: parseFloat(data.rider.latitude),
                  longitude: parseFloat(data.rider.longitude),
                  vehicle: data.rider.vehicle || 'Motorcycle',
                  rating: data.rider.rating || 4.8
                }
              } : null);
            }

            if (data.delivery_otp) {
              setOrder(prev => prev ? { ...prev, delivery_otp: data.delivery_otp } : null);
            }
          } catch (parseError) {
            console.error('Error parsing WebSocket message:', parseError);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [order?.leta_order_id, wsConnected]);

  // Update order status via subscription
  useEffect(() => {
    if (!orderId) return;

    const subscription = supabase
      .from('orders')
      .on('*', payload => {
        if (payload.new.id === orderId) {
          setOrder(payload.new as OrderTracking);
          
          if (payload.new.leta_status === 'delivered') {
            toast({
              title: 'Order Delivered! 🎉',
              description: 'Your order has been successfully delivered.'
            });
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId, toast]);

  const getStatusIndex = () => {
    if (!order) return 0;
    const status = order.leta_status || order.status;
    return statusSteps.findIndex(step => step.key === status);
  };

  const copyTrackingLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Tracking link copied to clipboard'
    });
  };

  const openInMaps = () => {
    if (!riderLocation || !order?.delivery_address) return;
    
    const url = `https://maps.google.com/?q=${order.delivery_address.latitude},${order.delivery_address.longitude}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">Order Not Found</h2>
            </div>
            <p className="text-gray-600 mb-6">{error || 'We could not find your order.'}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusIndex = getStatusIndex();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Reference: {order.order_reference}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyTrackingLink}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Status Timeline */}
                <div className="space-y-4">
                  {statusSteps.map((step, index) => (
                    <div key={step.key} className="flex gap-4">
                      {/* Step Indicator */}
                      <div className="flex flex-col items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${
                          index <= statusIndex
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {step.icon}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div className={`h-12 w-1 ${
                            index < statusIndex
                              ? 'bg-emerald-600'
                              : 'bg-gray-200'
                          }`} />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="pb-8">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{step.label}</h3>
                          {index <= statusIndex && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {index === statusIndex && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">
                            Current Status
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rider Information */}
            {order.rider_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Your Driver
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.rider_info.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm text-gray-600">Rating: </span>
                        <span className="font-medium">{order.rider_info.rating}★</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{order.rider_info.vehicle}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.location.href = `tel:${order.rider_info?.phone}`}
                    >
                      <Phone className="h-4 w-4" />
                      Call Driver
                    </Button>
                  </div>

                  {riderLocation && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">Current Location</span>
                        <Badge variant="outline" className="bg-green-50">
                          {wsConnected ? '🟢 Live' : '🔄 Updating'}
                        </Badge>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 mb-4">
                        <div className="text-sm text-gray-700">
                          <p className="font-medium mb-2">📍 Coordinates</p>
                          <p className="font-mono text-xs">{riderLocation.lat.toFixed(6)}, {riderLocation.lng.toFixed(6)}</p>
                        </div>
                      </div>
                      <Button
                        onClick={openInMaps}
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Navigation className="h-4 w-4" />
                        View on Google Maps
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delivery OTP */}
            {order.delivery_otp && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-900">Delivery OTP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800 mb-3">
                    Share this code with your driver to verify delivery:
                  </p>
                  <div className="bg-white border-2 border-amber-300 rounded-lg p-4 mb-4">
                    <div className="text-3xl font-bold text-amber-600 text-center tracking-widest">
                      {order.delivery_otp}
                    </div>
                  </div>
                  <p className="text-xs text-amber-700">
                    This code is unique to your delivery and ensures security.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">KES {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-emerald-600">KES {order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{order.delivery_address?.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.delivery_address?.latitude.toFixed(4)}, {order.delivery_address?.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {order.customer_phone}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-mono font-semibold text-gray-900">{order.order_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={`mt-1 ${statusColors[order.leta_status || order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.leta_status || order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ordered On</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-blue-800">
                  If you have any questions about your order, contact our support team.
                </p>
                <Button
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = 'mailto:support@getdeals.co.ke'}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
