# Checkout Management Feature - Quick Integration Guide

## Quick Start (5 Steps)

### Step 1: Run Database Migration
Execute the migration file to create required tables and columns:

```bash
# Using psql
psql -U postgres -d your_database -f migrations/20251031_add_checkout_management.sql

# Or copy-paste the SQL into your database management tool
```

**Tables Created:**
- `checkout_audit_logs` - Stores all checkout/reimbursement actions
- `checkout_statistics` view - For analytics

**Columns Added to `orders`:**
- `checked_out_at`
- `checked_out_by`
- `refunded_at`
- `refunded_amount`
- `refund_reason`
- `refunded_by`
- `is_locked`

### Step 2: Deploy Backend Endpoints

Place these files in your deployment:
```
api/quickmart/orders/checkout.ts
api/quickmart/orders/reimburse.ts
```

**Endpoints Created:**
- `POST /api/quickmart/orders/checkout/` - Process checkout
- `POST /api/quickmart/orders/reimburse/` - Process reimbursement

### Step 3: Deploy Service Layer

Add to your services:
```
src/services/checkoutService.ts
```

**Exported Functions:**
- `searchOrder()` - Search for order
- `getOrderDetails()` - Get order info
- `checkoutOrder()` - Perform checkout
- `reimbursementOrder()` - Process refund
- `getOrderAuditLogs()` - View audit trail
- `getPendingOrders()` - List pending orders
- `getCompletedOrders()` - List completed orders
- `getRefundedOrders()` - List refunded orders
- `exportOrdersToCSV()` - Export to CSV

### Step 4: Deploy UI Component

Add to your pages:
```
src/pages/quickmart/QuickMartCheckout.tsx
```

Update the dashboard:
```
src/pages/quickmart/QuickMartAdminDashboard.tsx
```

The component is already integrated and set as the default tab.

### Step 5: Test the Feature

1. **Login to Quickmart Admin Dashboard**
   - Navigate to `/quickmart/admin`
   - Sign in with admin credentials

2. **Test Order Lookup**
   - Go to Checkout tab (should be default)
   - Enter valid order number
   - Verify order details display

3. **Test Checkout**
   - Click "Mark as Picked Up"
   - Confirm in modal
   - Verify order status changes to `picked_up`

4. **Test Reimbursement**
   - Search for different order
   - Click "Process Reimbursement"
   - Select reason and confirm
   - Verify order status changes to `refunded`

5. **Test Audit Trail**
   - Click "View Audit Trail" on any order
   - Verify all actions are logged

## File Structure

```
project-root/
├── api/
│   └── quickmart/
│       └── orders/
│           ├── checkout.ts          (NEW)
│           ├── reimburse.ts         (NEW)
│           └── update-status.ts     (existing)
├── migrations/
│   └── 20251031_add_checkout_management.sql    (NEW)
├── src/
│   ├── pages/
│   │   └── quickmart/
│   │       ├── QuickMartAdminDashboard.tsx     (UPDATED)
│   │       ├── QuickMartCheckout.tsx           (NEW)
│   │       └── ...
│   └── services/
│       ├── checkoutService.ts                  (NEW)
│       └── ...
├── CHECKOUT_MANAGEMENT_FEATURE.md              (NEW - Documentation)
└── ...
```

## Environment Variables

No new environment variables required. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Dependencies

Already included in your project:
- `@supabase/supabase-js` - Database client
- `lucide-react` - Icons
- `shadcn/ui components` - UI components
- `uuid` - Audit log ID generation

No new npm packages required.

## Configuration

### User Roles for Access
Checkout Management requires one of these roles:
- `admin` - Global administrator
- `quickmart` - Quickmart administrator

Users with other roles will see "Access Denied" message.

### Optional: Customize UI Colors
To change from blue-green theme to your branding:

In `QuickMartCheckout.tsx`:
- Replace `bg-blue-*` with your primary color
- Replace `bg-green-*` with your success color
- Replace `bg-red-*` with your error color

## API Usage Examples

### Checkout Example
```typescript
import { checkoutOrder } from '@/services/checkoutService';

const result = await checkoutOrder({
  order_number: 'QM-2025-001234',
  action: 'checkout',
  admin_id: 'admin-uuid',
  admin_name: 'John Doe',
  notes: 'Order picked up at store'
});

if (result.success) {
  console.log('Checkout successful:', result.data);
} else {
  console.error('Checkout failed:', result.message);
}
```

### Reimbursement Example
```typescript
import { reimbursementOrder } from '@/services/checkoutService';

const result = await reimbursementOrder({
  order_number: 'QM-2025-001234',
  reason: 'damaged_item',
  amount: 2500,
  admin_id: 'admin-uuid',
  admin_name: 'John Doe',
  notes: 'Item was damaged upon arrival'
});

if (result.success) {
  console.log('Refund processed:', result.data);
} else {
  console.error('Refund failed:', result.message);
}
```

### Search Order Example
```typescript
import { getOrderDetails } from '@/services/checkoutService';

const order = await getOrderDetails('QM-2025-001234');

if (order) {
  console.log('Order found:', {
    customer: order.customer_name,
    total: order.total_amount,
    status: order.status
  });
} else {
  console.log('Order not found');
}
```

## Database Queries

### Get Pending Orders
```sql
SELECT * FROM orders 
WHERE status IN ('pending', 'confirmed', 'ready_for_pickup')
  AND is_locked = false
ORDER BY created_at ASC;
```

### Get Checkout Statistics
```sql
SELECT * FROM checkout_statistics 
ORDER BY checkout_date DESC;
```

### View Audit Trail for Order
```sql
SELECT * FROM checkout_audit_logs 
WHERE order_reference = 'QM-2025-001234'
ORDER BY created_at DESC;
```

### Total Refunds by Date
```sql
SELECT 
  DATE(created_at) as refund_date,
  COUNT(*) as refund_count,
  SUM(amount) as total_refunded
FROM checkout_audit_logs
WHERE action = 'reimbursement'
GROUP BY DATE(created_at)
ORDER BY refund_date DESC;
```

## Troubleshooting Checklist

- [ ] Migration ran successfully without errors
- [ ] Backend endpoints responding with 200 status
- [ ] User has `admin` or `quickmart` role
- [ ] Orders table has new columns
- [ ] `checkout_audit_logs` table exists
- [ ] Service layer functions accessible
- [ ] UI component renders without errors
- [ ] Search functionality finds orders
- [ ] Checkout button updates order status
- [ ] Audit logs created on actions

## Testing Checklist

- [ ] **Order Lookup**: Search returns correct order details
- [ ] **Checkout**: Mark as picked up works and locks order
- [ ] **Reimbursement**: Refund processes and locks order
- [ ] **Audit Trail**: All actions logged with correct timestamps
- [ ] **Wallet Credit**: Customer wallet credited on refund
- [ ] **CSV Export**: Export downloads valid CSV file
- [ ] **Filters**: Pending/Completed/Refunded tabs work correctly
- [ ] **Access Control**: Non-admins cannot access feature
- [ ] **Error Handling**: Invalid inputs show proper error messages
- [ ] **Idempotency**: Cannot process same action twice

## Performance Notes

- Order lookup optimized with index on `order_reference`
- Audit logs indexed for fast filtering
- List queries paginated (default 50 items)
- CSV export handles large datasets
- Wallet updates use efficient SQL operations

## Support & Questions

For additional information, see:
- `CHECKOUT_MANAGEMENT_FEATURE.md` - Full documentation
- API endpoint implementations for request/response schemas
- Service layer for available functions
- Component code for UI customization

## Next Steps

1. ✅ Complete all 5 setup steps
2. ✅ Run through testing checklist
3. ✅ Train admins on feature usage
4. ✅ Monitor first few days for issues
5. Consider future enhancements (see main documentation)

---

**Feature Complete!** Your Quickmart checkout management system is ready for production use.
