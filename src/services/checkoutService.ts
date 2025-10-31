/**
 * Checkout Service - Handles order checkout and reimbursement operations
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export interface OrderDetails {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: string;
  status: string;
  delivery_address?: any;
  pickup_location?: string;
  items: any[];
  created_at: string;
  is_locked?: boolean;
  checked_out_at?: string;
  checked_out_by?: string;
  refunded_at?: string;
  refund_reason?: string;
}

export interface CheckoutAction {
  order_number: string;
  action: 'checkout' | 'verify';
  admin_id?: string;
  admin_name?: string;
  notes?: string;
}

export interface ReimbursementAction {
  order_number: string;
  reason: string;
  amount?: number;
  admin_id?: string;
  admin_name?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  order_id: string;
  order_reference: string;
  action: 'checkout' | 'reimbursement';
  reason?: string;
  amount?: number;
  admin_id: string;
  admin_name: string;
  notes?: string;
  created_at: string;
}

/**
 * Search for an order by order number or reference
 */
export async function searchOrder(orderNumber: string): Promise<OrderDetails | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_reference.ilike.%${orderNumber}%,id.ilike.%${orderNumber}%`)
      .single();

    if (error || !data) {
      console.error('Error searching order:', error);
      return null;
    }

    return mapOrderResponse(data);
  } catch (error) {
    console.error('Search order error:', error);
    return null;
  }
}

/**
 * Get detailed information about an order
 */
export async function getOrderDetails(orderNumber: string): Promise<OrderDetails | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', orderNumber)
      .single();

    if (error || !data) {
      console.error('Error fetching order details:', error);
      return null;
    }

    return mapOrderResponse(data);
  } catch (error) {
    console.error('Get order details error:', error);
    return null;
  }
}

/**
 * Perform checkout action on an order
 */
export async function checkoutOrder(action: CheckoutAction): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const response = await fetch('/api/quickmart/orders/checkout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || 'Failed to checkout order'
      };
    }

    return {
      success: true,
      message: 'Order checked out successfully',
      data: result.data
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to checkout order'
    };
  }
}

/**
 * Perform reimbursement action on an order
 */
export async function reimbursementOrder(
  action: ReimbursementAction
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const response = await fetch('/api/quickmart/orders/reimburse/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || 'Failed to process reimbursement'
      };
    }

    return {
      success: true,
      message: 'Reimbursement processed successfully',
      data: result.data
    };
  } catch (error) {
    console.error('Reimbursement error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process reimbursement'
    };
  }
}

/**
 * Get audit logs for an order
 */
export async function getOrderAuditLogs(orderNumber: string): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('checkout_audit_logs')
      .select('*')
      .eq('order_reference', orderNumber)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
}

/**
 * Get checkout statistics for a date range
 */
export async function getCheckoutStatistics(startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('checkout_statistics')
      .select('*')
      .gte('checkout_date', startDate.toISOString().split('T')[0])
      .lte('checkout_date', endDate.toISOString().split('T')[0])
      .order('checkout_date', { ascending: false });

    if (error) {
      console.error('Error fetching checkout statistics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get checkout statistics error:', error);
    return [];
  }
}

/**
 * Get pending orders for checkout
 */
export async function getPendingOrders(limit: number = 50): Promise<OrderDetails[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'confirmed', 'ready_for_pickup'])
      .eq('is_locked', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }

    return data?.map(mapOrderResponse) || [];
  } catch (error) {
    console.error('Get pending orders error:', error);
    return [];
  }
}

/**
 * Get completed orders (picked up)
 */
export async function getCompletedOrders(limit: number = 50): Promise<OrderDetails[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'picked_up')
      .order('checked_out_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching completed orders:', error);
      return [];
    }

    return data?.map(mapOrderResponse) || [];
  } catch (error) {
    console.error('Get completed orders error:', error);
    return [];
  }
}

/**
 * Get refunded orders
 */
export async function getRefundedOrders(limit: number = 50): Promise<OrderDetails[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'refunded')
      .order('refunded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching refunded orders:', error);
      return [];
    }

    return data?.map(mapOrderResponse) || [];
  } catch (error) {
    console.error('Get refunded orders error:', error);
    return [];
  }
}

/**
 * Export orders data to CSV format
 */
export function exportOrdersToCSV(orders: OrderDetails[]): string {
  const headers = [
    'Order Number',
    'Customer Name',
    'Customer Phone',
    'Total Amount',
    'Payment Method',
    'Status',
    'Created At',
    'Checked Out At',
    'Checked Out By',
    'Refunded At',
    'Refund Reason'
  ];

  const rows = orders.map(order => [
    order.order_reference,
    order.customer_name,
    order.customer_phone,
    order.total_amount,
    order.payment_method,
    order.status,
    new Date(order.created_at).toLocaleString(),
    order.checked_out_at ? new Date(order.checked_out_at).toLocaleString() : '',
    order.checked_out_by || '',
    order.refunded_at ? new Date(order.refunded_at).toLocaleString() : '',
    order.refund_reason || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Helper function to map database order to OrderDetails
 */
function mapOrderResponse(data: any): OrderDetails {
  return {
    id: data.id,
    order_reference: data.order_reference || data.id,
    customer_name: data.customer_name || '',
    customer_phone: data.customer_phone || '',
    customer_email: data.customer_email || '',
    total_amount: data.total_amount_kes || data.total || 0,
    subtotal: data.subtotal_kes || data.subtotal || 0,
    delivery_fee: data.delivery_fee_kes || data.delivery_fee || 0,
    payment_method: data.payment_method || '',
    payment_status: data.payment_status || 'pending',
    status: data.status || 'pending',
    delivery_address: data.delivery_address,
    pickup_location: data.pickup_location,
    items: data.items || [],
    created_at: data.created_at,
    is_locked: data.is_locked,
    checked_out_at: data.checked_out_at,
    checked_out_by: data.checked_out_by,
    refunded_at: data.refunded_at,
    refund_reason: data.refund_reason
  };
}
