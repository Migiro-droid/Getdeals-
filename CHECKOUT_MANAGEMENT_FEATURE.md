# Quickmart Checkout Management Feature

## Overview

The Checkout Management Feature is a dedicated admin module for Quickmart administrators to manage customer pickups, verify orders, and handle reimbursements for cancelled or returned orders. This system provides a complete checkout workflow similar to physical retail systems with comprehensive audit tracking.

## Features

### 1. **Order Lookup**
- Simple search functionality by order number
- Display comprehensive order details:
  - Customer name & contact information
  - Items in the order with quantities and prices
  - Total amount, subtotal, and delivery fee
  - Payment method and status
  - Current order status
  - Pickup location (if applicable)
  - Order creation timestamp

### 2. **Checkout Action**
- **Mark as Picked Up Button**: Confirm customer order collection
- Updates order status to `picked_up`
- Locks order to prevent reuse or reprocessing
- Automatically triggers:
  - Order status update
  - Audit trail entry
  - Post-checkout actions

### 3. **Reimbursement & Cancellation Handling**
- Process refunds for cancelled or returned orders
- Select from predefined cancellation reasons:
  - Customer Cancelled
  - Damaged Item
  - Price Dispute
  - Out of Stock
  - Customer Return
  - Defective
  - Duplicate Order
  - Other
- Support for partial or full refunds
- Automatic wallet credit for customers
- Complete audit logging of reimbursement

### 4. **Audit Trail & Access Control**
- Comprehensive logging of all checkout and reimbursement actions
- Tracked information:
  - Admin who performed the action
  - Timestamp of action
  - Order reference number
  - Type of action (Checkout/Reimbursement)
  - Refund reason (if applicable)
  - Amount (if applicable)
  - Additional notes
- Role-based access control (Quickmart and Global admins only)

### 5. **Order Management Views**
- **Pending Pickup**: Orders awaiting customer collection
- **Picked Up**: Orders that have been checked out
- **Refunded**: Orders that have been refunded
- Filter and search capabilities
- CSV export for daily reconciliations

## API Endpoints

### Checkout Endpoint
```
POST /api/quickmart/orders/checkout/
```

**Request Body:**
```json
{
  "order_number": "QM-2025-001234",
  "action": "checkout",
  "admin_id": "admin-uuid",
  "admin_name": "John Doe",
  "notes": "Customer collected order"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid",
    "order_number": "QM-2025-001234",
    "status": "picked_up",
    "checked_out_at": "2025-10-31T14:30:00Z",
    "audit_log_id": "log-uuid"
  }
}
```

### Reimbursement Endpoint
```
POST /api/quickmart/orders/reimburse/
```

**Request Body:**
```json
{
  "order_number": "QM-2025-001234",
  "reason": "damaged_item",
  "amount": 5000,
  "admin_id": "admin-uuid",
  "admin_name": "John Doe",
  "notes": "Item arrived damaged - refund processed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid",
    "order_number": "QM-2025-001234",
    "status": "refunded",
    "reimbursement_amount": 5000,
    "reimbursed_at": "2025-10-31T14:35:00Z",
    "audit_log_id": "log-uuid"
  }
}
```

## Database Schema

### Orders Table Extensions
```sql
-- New columns for checkout management
checked_out_at TIMESTAMP          -- When order was picked up
checked_out_by TEXT               -- Admin ID who checked out
refunded_at TIMESTAMP             -- When refund was processed
refunded_amount INTEGER           -- Refund amount in KES
refund_reason TEXT                -- Reason for refund
refunded_by TEXT                  -- Admin ID who processed refund
is_locked BOOLEAN                 -- Prevents reuse after checkout/refund
```

### Checkout Audit Logs Table
```sql
CREATE TABLE checkout_audit_logs (
  id UUID PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_reference TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'checkout' or 'reimbursement'
  reason TEXT,                    -- Reason (for reimbursement)
  amount DECIMAL(10, 2),          -- Amount (for reimbursement)
  admin_id TEXT NOT NULL,         -- Admin who performed action
  admin_name TEXT NOT NULL,       -- Admin display name
  notes TEXT,                     -- Additional notes
  created_at TIMESTAMP,           -- Action timestamp
  FOREIGN KEY (order_id) REFERENCES orders(id)
)
```

### Checkout Statistics View
```sql
CREATE VIEW checkout_statistics AS
SELECT 
  DATE(created_at) as checkout_date,
  COUNT(*) as total_actions,
  SUM(CASE WHEN action = 'checkout' THEN 1 ELSE 0 END) as pickups,
  SUM(CASE WHEN action = 'reimbursement' THEN 1 ELSE 0 END) as reimbursements,
  COUNT(DISTINCT admin_id) as unique_admins
FROM checkout_audit_logs
GROUP BY DATE(created_at)
ORDER BY checkout_date DESC
```

## Service Layer

### checkoutService.ts

Core functions provided:

#### `searchOrder(orderNumber: string): Promise<OrderDetails | null>`
Search for an order by order number or reference.

#### `getOrderDetails(orderNumber: string): Promise<OrderDetails | null>`
Fetch detailed information about a specific order.

#### `checkoutOrder(action: CheckoutAction): Promise<{ success: boolean; message: string; data?: any }>`
Perform checkout action on an order.

#### `reimbursementOrder(action: ReimbursementAction): Promise<{ success: boolean; message: string; data?: any }>`
Process reimbursement for an order.

#### `getOrderAuditLogs(orderNumber: string): Promise<AuditLog[]>`
Retrieve all audit logs for a specific order.

#### `getCheckoutStatistics(startDate: Date, endDate: Date): Promise<any[]>`
Get checkout statistics for a date range.

#### `getPendingOrders(limit: number = 50): Promise<OrderDetails[]>`
Get orders pending pickup.

#### `getCompletedOrders(limit: number = 50): Promise<OrderDetails[]>`
Get orders that have been picked up.

#### `getRefundedOrders(limit: number = 50): Promise<OrderDetails[]>`
Get orders that have been refunded.

#### `exportOrdersToCSV(orders: OrderDetails[]): string`
Export orders data to CSV format.

## UI Components

### QuickMartCheckout Component
Main checkout dashboard component with:
- Order search panel
- Order details display
- Checkout confirmation dialog
- Reimbursement dialog
- Audit trail viewer
- Order list views (Pending, Completed, Refunded)
- Export functionality

### Integration with Admin Dashboard
- Added as primary tab in `QuickMartAdminDashboard`
- Set as default active tab
- Seamless navigation between checkout and other admin functions

## Usage Flow

### Checkout Flow
1. Admin navigates to Checkout tab in Quickmart Admin Dashboard
2. Enters order number in search bar
3. System displays order details
4. Admin reviews order information
5. Clicks "Mark as Picked Up" button
6. Confirms action in modal dialog
7. System:
   - Updates order status to `picked_up`
   - Sets `is_locked` flag to prevent reuse
   - Creates audit log entry
   - Shows success message
8. Order locked and ready for next process

### Reimbursement Flow
1. Admin searches for order
2. Clicks "Process Reimbursement" button
3. Selects refund reason from dropdown
4. Optionally enters custom amount (defaults to order total)
5. Adds notes (optional)
6. System:
   - Updates order status to `refunded`
   - Records refund amount and reason
   - Credits customer wallet (if applicable)
   - Creates audit log
   - Shows confirmation

## Security & Validation

### Access Control
- Only users with `quickmart` or `admin` role can access
- Unauthorized users see access denied message
- Sign-in required with email and password

### Data Validation
- Order number validation (must exist in database)
- Reason validation (must be from predefined list)
- Amount validation (must be positive number)
- Status validation (cannot checkout already locked orders)
- Idempotency checks (prevent double processing)

### Audit & Compliance
- All actions logged with:
  - Admin credentials
  - Exact timestamp
  - Order reference
  - Action details
  - Optional notes
- Immutable audit logs for compliance
- CSV export for reconciliation
- View audit trail for any order

## Error Handling

### Common Error Scenarios

**Order Not Found**
```
Error: Order not found: <order_number>
```

**Order Already Checked Out**
```
Error: Order <number> has already been checked out
```

**Order Already Refunded**
```
Error: Order <number> has already been refunded or cancelled
```

**Invalid Reimbursement Reason**
```
Error: Invalid reason. Must be one of: customer_cancelled, damaged_item, ...
```

**Database Errors**
```
Error: Failed to update order status
Error: Failed to process wallet refund
```

## Performance Considerations

- Orders indexed by `order_reference` for fast lookup
- Audit logs indexed by `order_id`, `order_reference`, and `created_at`
- Pagination support for order lists (default 50, max 100)
- Efficient query joins for order details
- CSV export handles large datasets gracefully

## Future Enhancements

### Optional Features
1. **Bulk Operations**
   - Batch checkout for multiple orders
   - Bulk reimbursement processing

2. **Advanced Analytics**
   - Daily checkout summary
   - Reimbursement trends
   - Admin performance metrics

3. **Notifications**
   - Email notifications to customers on refund
   - SMS alerts for high-value transactions

4. **Integration**
   - SMS notification to customer on checkout
   - Email receipt generation
   - Integration with accounting system

5. **Mobile Support**
   - Mobile-optimized checkout interface
   - Barcode scanning for order lookup
   - Offline mode support

6. **Reports**
   - PDF reconciliation reports
   - Daily settlement sheets
   - Refund analytics

## Deployment Checklist

- [ ] Run migration: `20251031_add_checkout_management.sql`
- [ ] Deploy backend endpoints (`checkout.ts`, `reimburse.ts`)
- [ ] Deploy service layer (`checkoutService.ts`)
- [ ] Deploy UI component (`QuickMartCheckout.tsx`)
- [ ] Update admin dashboard to include checkout tab
- [ ] Test order lookup functionality
- [ ] Test checkout action
- [ ] Test reimbursement action
- [ ] Verify audit logs are created
- [ ] Test wallet credit on refund
- [ ] Test access control for unauthorized users
- [ ] Verify CSV export functionality
- [ ] Load test with multiple concurrent admins

## Troubleshooting

### Orders Not Appearing in Search
- Verify order exists in database
- Check order_reference format matches search input
- Ensure user has permission to view orders

### Checkout Fails
- Check order is not already locked
- Verify order status is not cancelled or refunded
- Check database connectivity
- Review audit logs for errors

### Wallet Credit Not Applied
- Verify customer has a wallet account
- Check wallet status is `active`
- Verify refund amount is valid
- Check database constraints

## Support

For issues or questions about the Checkout Management Feature:
1. Check audit logs for detailed error information
2. Review API response messages
3. Contact system administrator
4. Report bugs with order number and timestamp
