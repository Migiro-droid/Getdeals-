import { supabase } from '../../lib/supabase';

export interface OrderNotification {
  id: string;
  order_id: string;
  order_reference: string;
  customer_name: string;
  customer_phone: string;
  total_amount_kes: number;
  status: string;
  created_at: string;
  notified: boolean;
}

export class OrderNotificationService {
  /**
   * Subscribe to new quickmart orders in real-time
   */
  static subscribeToNewOrders(
    onNewOrder: (order: OrderNotification) => void,
    onError?: (error: any) => void
  ) {
    console.log('[OrderNotifications] Subscribing to new quickmart orders...');
    
    const subscription = supabase
      .channel('quickmart_new_orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quickmart_orders'
        },
        (payload) => {
          console.log('[OrderNotifications] New order received:', payload.new);
          const order = payload.new as any;
          
          onNewOrder({
            id: order.id,
            order_id: order.id,
            order_reference: order.order_reference,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            total_amount_kes: order.total_amount_kes,
            status: order.status,
            created_at: order.created_at,
            notified: false
          });
        }
      )
      .subscribe((status) => {
        console.log('[OrderNotifications] Subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          onError?.({ message: 'Failed to subscribe to orders' });
        }
      });

    return subscription;
  }

  /**
   * Subscribe to order status updates
   */
  static subscribeToOrderUpdates(
    onOrderUpdate: (order: any) => void,
    onError?: (error: any) => void
  ) {
    console.log('[OrderNotifications] Subscribing to order updates...');
    
    const subscription = supabase
      .channel('quickmart_order_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quickmart_orders'
        },
        (payload) => {
          console.log('[OrderNotifications] Order updated:', payload.new);
          onOrderUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[OrderNotifications] Order updates subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          onError?.({ message: 'Failed to subscribe to order updates' });
        }
      });

    return subscription;
  }

  /**
   * Play a notification sound
   */
  static playNotificationSound() {
    try {
      // Use the Web Audio API to play a simple beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('[OrderNotifications] Could not play notification sound:', error);
    }
  }

  /**
   * Request browser notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[OrderNotifications] Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('[OrderNotifications] Error requesting notification permission:', error);
        return false;
      }
    }

    return false;
  }

  /**
   * Show browser notification
   */
  static showBrowserNotification(
    title: string,
    options?: NotificationOptions
  ) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/src/assets/logo.png',
          badge: '/src/assets/badge.png',
          ...options
        });
      } catch (error) {
        console.error('[OrderNotifications] Error showing notification:', error);
      }
    }
  }

  /**
   * Format order notification
   */
  static formatOrderNotification(order: OrderNotification): {
    title: string;
    message: string;
    details: string;
  } {
    return {
      title: `New Order #${order.order_reference}`,
      message: `${order.customer_name} ordered KES ${order.total_amount_kes.toLocaleString()}`,
      details: `Phone: ${order.customer_phone}`
    };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('quickmart_orders')
        .select('id', { count: 'exact', head: true })
        .eq('admin_notified', false)
        .in('status', ['pending', 'confirmed']);

      if (error) {
        console.error('[OrderNotifications] Error getting unread count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('[OrderNotifications] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark order as notified
   */
  static async markAsNotified(orderId: string): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('quickmart_orders') as any)
        .update({ admin_notified: true })
        .eq('id', orderId);

      if (error) {
        console.error('[OrderNotifications] Error marking as notified:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[OrderNotifications] Error marking as notified:', error);
      return false;
    }
  }
}

export default OrderNotificationService;
