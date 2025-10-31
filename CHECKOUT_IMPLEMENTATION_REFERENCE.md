# Checkout Management Feature - Implementation Reference

## Component Architecture

```
QuickMartAdminDashboard (Main Container)
├── Header (Logo, User Info, Logout)
├── Tabs Navigation
│   └── ✨ Checkout (NEW - Default Tab)
│       ├── QuickMartCheckout Component
│       │   ├── Search Panel
│       │   │   ├── Search Input
│       │   │   ├── Search Button
│       │   │   └── Status Messages
│       │   ├── Order Details (when found)
│       │   │   ├── Summary Card
│       │   │   │   ├── Customer Info
│       │   │   │   ├── Order Details
│       │   │   │   ├── Items List
│       │   │   │   ├── Pickup Location
│       │   │   │   └── Action Buttons
│       │   │   └── Audit Trail Button
│       │   ├── Tab Contents
│       │   │   ├── Pending Orders
│       │   │   ├── Completed Orders
│       │   │   └── Refunded Orders
│       │   └── Dialogs
│       │       ├── Checkout Confirmation
│       │       ├── Reimbursement Form
│       │       └── Audit Trail Viewer
│       ├── Orders Tab
│       ├── Products Tab
│       └── Analytics Tab
```

## Data Flow Diagram

```
User Searches Order
    ↓
searchOrder() / getOrderDetails()
    ↓
API Query: SELECT * FROM orders WHERE order_reference = ?
    ↓
Order Found
    ↓
Display Order Details
    ↓
User Action:
├─ Mark as Picked Up
│   ├─ checkoutOrder()
│   ├─ POST /api/quickmart/orders/checkout/
│   ├─ Update orders table
│   ├─ Insert checkout_audit_logs
│   └─ Show Success/Error
│
└─ Process Reimbursement
    ├─ reimbursementOrder()
    ├─ POST /api/quickmart/orders/reimburse/
    ├─ Update orders table
    ├─ Update wallet balance
    ├─ Insert checkout_audit_logs
    └─ Show Success/Error
```

## State Management

### QuickMartCheckout Component State

```typescript
// Main checkout state
const [checkoutState, setCheckoutState] = useState<CheckoutState>({
  order: null,              // Current selected order
  auditLogs: [],           // Audit trail for order
  loading: false,          // Loading indicator
  error: '',              // Error message
  success: ''             // Success message
});

// Dialog states
const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
const [showReimbursementDialog, setShowReimbursementDialog] = useState(false);
const [showAuditLog, setShowAuditLog] = useState(false);

// Reimbursement form state
const [reimbursementForm, setReimbursementForm] = useState({
  reason: '',             // Refund reason
  amount: '',            // Optional custom amount
  notes: ''              // Optional notes
});

// List states
const [pendingOrders, setPendingOrders] = useState<OrderDetails[]>([]);
const [completedOrders, setCompletedOrders] = useState<OrderDetails[]>([]);
const [refundedOrders, setRefundedOrders] = useState<OrderDetails[]>([]);
const [listLoading, setListLoading] = useState(false);
```

## Key Functions

### Order Search Handler

```typescript
const handleSearchOrder = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!searchQuery.trim()) {
    setCheckoutState(prev => ({
      ...prev,
      error: 'Please enter an order number'
    }));
    return;
  }

  setCheckoutState(prev => ({ ...prev, loading: true, error: '', success: '' }));

  try {
    const order = await getOrderDetails(searchQuery);
    
    if (!order) {
      setCheckoutState(prev => ({
        ...prev,
        error: 'Order not found',
        order: null,
        auditLogs: [],
        loading: false
      }));
      return;
    }

    const logs = await getOrderAuditLogs(order.order_reference);

    setCheckoutState(prev => ({
      ...prev,
      order,
      auditLogs: logs,
      error: '',
      success: '',
      loading: false
    }));
  } catch (error) {
    setCheckoutState(prev => ({
      ...prev,
      error: error instanceof Error ? error.message : 'Failed to search order',
      loading: false
    }));
  }
};
```

### Checkout Handler

```typescript
const handleCheckout = async () => {
  if (!checkoutState.order) return;

  setCheckoutState(prev => ({ ...prev, loading: true, error: '' }));

  const result = await checkoutOrder({
    order_number: checkoutState.order.order_reference,
    action: 'checkout',
    admin_id: adminId,
    admin_name: adminName,
    notes: `Checked out at physical pickup location`
  });

  if (result.success) {
    setCheckoutState(prev => ({
      ...prev,
      success: result.message,
      order: prev.order ? { ...prev.order, status: 'picked_up' } : null,
      loading: false
    }));
    setShowCheckoutConfirm(false);
    
    // Refresh after 2 seconds
    setTimeout(() => {
      setCheckoutState(prev => ({ ...prev, success: '' }));
      setSearchQuery('');
      handleSearchOrder({ preventDefault: () => {} } as any);
    }, 2000);
  } else {
    setCheckoutState(prev => ({
      ...prev,
      error: result.message,
      loading: false
    }));
  }
};
```

### Reimbursement Handler

```typescript
const handleReimbursement = async () => {
  if (!checkoutState.order || !reimbursementForm.reason) return;

  setCheckoutState(prev => ({ ...prev, loading: true, error: '' }));

  const result = await reimbursementOrder({
    order_number: checkoutState.order.order_reference,
    reason: reimbursementForm.reason,
    amount: reimbursementForm.amount 
      ? parseInt(reimbursementForm.amount) 
      : undefined,
    admin_id: adminId,
    admin_name: adminName,
    notes: reimbursementForm.notes
  });

  if (result.success) {
    setCheckoutState(prev => ({
      ...prev,
      success: result.message,
      order: prev.order ? { ...prev.order, status: 'refunded' } : null,
      loading: false
    }));
    setShowReimbursementDialog(false);
    setReimbursementForm({ reason: '', amount: '', notes: '' });
    
    setTimeout(() => {
      setCheckoutState(prev => ({ ...prev, success: '' }));
      setSearchQuery('');
    }, 2000);
  } else {
    setCheckoutState(prev => ({
      ...prev,
      error: result.message,
      loading: false
    }));
  }
};
```

## Service Layer API

### Search Function

```typescript
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
```

### Checkout Function

```typescript
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
```

## Backend API Implementation

### Checkout Endpoint

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { order_number, action, admin_id, admin_name, notes }: CheckoutRequest = req.body;

    // Validate
    if (!order_number || !action) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', order_number)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ success: false, error: `Order not found: ${order_number}` });
    }

    // Check if already checked out
    if (order.status === 'completed' || order.status === 'picked_up') {
      return res.status(409).json({ success: false, error: `Order has already been checked out` });
    }

    if (action === 'verify') {
      return res.status(200).json({
        success: true,
        data: {
          order_id: order.id,
          order_number: order.order_reference,
          status: order.status,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount_kes || order.total,
          items: order.items || []
        }
      });
    }

    // Update order
    const checkedOutAt = new Date().toISOString();
    const auditLogId = uuidv4();

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'picked_up',
        checked_out_at: checkedOutAt,
        checked_out_by: admin_id || 'system',
        is_locked: true,
        updated_at: checkedOutAt
      })
      .eq('id', order.id);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Failed to update order status' });
    }

    // Create audit log
    await supabase
      .from('checkout_audit_logs')
      .insert({
        id: auditLogId,
        order_id: order.id,
        order_reference: order_number,
        action: 'checkout',
        admin_id: admin_id || 'system',
        admin_name: admin_name || 'System',
        notes: notes || null,
        created_at: checkedOutAt
      });

    return res.status(200).json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order_number,
        status: 'picked_up',
        checked_out_at: checkedOutAt,
        audit_log_id: auditLogId
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
```

## UI Component Patterns

### Order Search Card

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Search className="w-5 h-5 text-blue-600" />
      Order Lookup
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <form onSubmit={handleSearchOrder} className="space-y-3">
      <Input
        placeholder="Enter order number"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        disabled={checkoutState.loading}
      />
      <Button type="submit" disabled={checkoutState.loading}>
        {checkoutState.loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
        Search
      </Button>
    </form>
  </CardContent>
</Card>
```

### Confirmation Dialog

```tsx
<Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Pickup</DialogTitle>
      <DialogDescription>
        Mark order {checkoutState.order?.order_reference} as picked up?
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-900">
          <strong>Customer:</strong> {checkoutState.order?.customer_name}
        </p>
        <p className="text-sm text-blue-900">
          <strong>Amount:</strong> KES {checkoutState.order?.total_amount.toLocaleString()}
        </p>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowCheckoutConfirm(false)}>
        Cancel
      </Button>
      <Button className="bg-green-600 hover:bg-green-700" onClick={handleCheckout}>
        Confirm Pickup
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Error Handling Patterns

### API Error Response

```typescript
// Handle checkout error
if (!result.success) {
  setCheckoutState(prev => ({
    ...prev,
    error: result.message,
    loading: false
  }));
}

// Show error to user
{checkoutState.error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{checkoutState.error}</AlertDescription>
  </Alert>
)}
```

### Validation Pattern

```typescript
if (!searchQuery.trim()) {
  setCheckoutState(prev => ({
    ...prev,
    error: 'Please enter an order number'
  }));
  return;
}

if (!reimbursementForm.reason) {
  return; // Disable button if no reason selected
}
```

## Database Query Patterns

### Get Order with All Details

```sql
SELECT 
  o.*,
  ARRAY_AGG(oi.*) as items,
  u.name as customer_name,
  u.phone as customer_phone,
  u.email as customer_email
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN users u ON o.user_id = u.id
WHERE o.order_reference = $1
GROUP BY o.id, u.id;
```

### Get Audit Logs for Order

```sql
SELECT * FROM checkout_audit_logs
WHERE order_reference = $1
ORDER BY created_at DESC;
```

### Get Pending Orders

```sql
SELECT * FROM orders
WHERE status IN ('pending', 'confirmed', 'ready_for_pickup')
  AND is_locked = false
  AND checked_out_at IS NULL
ORDER BY created_at ASC
LIMIT 100;
```

## TypeScript Type Definitions

```typescript
interface OrderDetails {
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

interface CheckoutAction {
  order_number: string;
  action: 'checkout' | 'verify';
  admin_id?: string;
  admin_name?: string;
  notes?: string;
}

interface ReimbursementAction {
  order_number: string;
  reason: string;
  amount?: number;
  admin_id?: string;
  admin_name?: string;
  notes?: string;
}

interface AuditLog {
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
```

## Testing Patterns

### Unit Test Example

```typescript
describe('checkoutService', () => {
  describe('getOrderDetails', () => {
    it('should return order details for valid order number', async () => {
      const order = await getOrderDetails('QM-2025-001234');
      
      expect(order).toBeDefined();
      expect(order?.order_reference).toBe('QM-2025-001234');
      expect(order?.total_amount).toBeGreaterThan(0);
    });

    it('should return null for non-existent order', async () => {
      const order = await getOrderDetails('NON-EXISTENT');
      
      expect(order).toBeNull();
    });
  });

  describe('checkoutOrder', () => {
    it('should successfully checkout an order', async () => {
      const result = await checkoutOrder({
        order_number: 'QM-2025-001234',
        action: 'checkout',
        admin_id: 'test-admin',
        admin_name: 'Test Admin'
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('picked_up');
    });
  });
});
```

---

This reference guide provides patterns and examples for understanding and extending the Checkout Management Feature.
