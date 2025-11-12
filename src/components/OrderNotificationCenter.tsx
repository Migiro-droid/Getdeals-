import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import OrderNotificationService, { OrderNotification } from '../services/order-notifications';

interface NotificationToast {
  id: string;
  order: OrderNotification;
  timestamp: Date;
}

export const OrderNotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Initialize notification service on mount
  useEffect(() => {
    const initializeNotifications = async () => {
      // Request browser notification permission
      const hasPermission = await OrderNotificationService.requestNotificationPermission();
      setPermissionGranted(hasPermission);

      // Get initial unread count
      const count = await OrderNotificationService.getUnreadCount();
      setUnreadCount(count);

      // Subscribe to new orders
      const subscription = OrderNotificationService.subscribeToNewOrders(
        (order) => {
          handleNewOrder(order);
        },
        (error) => {
          console.error('Notification subscription error:', error);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeNotifications();
  }, []);

  const handleNewOrder = (order: OrderNotification) => {
    const notification: NotificationToast = {
      id: `${order.order_id}-${Date.now()}`,
      order,
      timestamp: new Date()
    };

    // Add to toast list
    setNotifications(prev => [notification, ...prev].slice(0, 10));

    // Update unread count
    setUnreadCount(prev => prev + 1);

    // Play sound if enabled
    if (soundEnabled) {
      OrderNotificationService.playNotificationSound();
    }

    // Show browser notification if permission granted
    if (permissionGranted) {
      const { title, message, details } = OrderNotificationService.formatOrderNotification(order);
      OrderNotificationService.showBrowserNotification(title, {
        body: `${message}\n${details}`,
        tag: order.order_id,
        requireInteraction: true
      });
    }

    // Auto-dismiss notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAsRead = async (orderId: string) => {
    await OrderNotificationService.markAsNotified(orderId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Toast Stack */}
      <div className="space-y-2 mb-4">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="animate-in slide-in-from-right-full duration-300"
          >
            <Card className="w-80 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-sm text-gray-900">
                      New Order #{notification.order.order_reference}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{notification.order.customer_name}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: <span className="font-semibold text-blue-600">
                      KES {notification.order.total_amount_kes.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {notification.order.customer_phone}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {notification.order.status.toUpperCase()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(notification.order.order_id)}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Read
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Notification Bell Button */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          title={soundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-green-600" />
          ) : (
            <VolumeX className="h-4 w-4 text-gray-400" />
          )}
        </Button>

        {/* Main Notification Bell */}
        <div className="relative">
          <Button
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg text-white relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Panel */}
          {isOpen && (
            <Card className="absolute bottom-full right-0 mb-2 w-96 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <CardContent className="p-0">
                <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
                  <div>
                    <h2 className="font-semibold text-gray-900">Notifications</h2>
                    <p className="text-xs text-gray-600">
                      {unreadCount} unread order{unreadCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {notifications.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearAll}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-96">
                  {notifications.length > 0 ? (
                    <div className="p-3 space-y-3">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                Order #{notification.order.order_reference}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.order.customer_name}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-xs whitespace-nowrap"
                            >
                              {notification.order.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                            <span className="text-sm font-semibold text-blue-600">
                              KES {notification.order.total_amount_kes.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderNotificationCenter;
