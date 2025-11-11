# 🔍 Quickmart Checkout - Order Lookup Guide for Admins

## Quick Reference for Order Lookup

### Order Reference Format
The order you mentioned is: **`ORD-1761846167882-SULH`**

This appears to be the format: `ORD-{TIMESTAMP}-{SUFFIX}`

### How to Use Order Lookup

1. **Navigate to Checkout Tab**
   - Go to Admin Dashboard
   - Click on "Checkout" tab (default)

2. **Enter Order Reference**
   - Find the search box on the left
   - Enter: `ORD-1761846167882-SULH`
   - Click "Search" button

3. **View Results**
   - If order exists: Full order details display
   - If not found: Error message shows "Order not found"

## ✅ What to Look For

When searching, you should see:
- Customer Name
- Customer Phone
- Customer Email
- Order Items
- Total Amount (KES)
- Payment Method
- Order Status
- Creation Date
- Pickup Location (if applicable)

## Search Methods

The system can search by:

1. **Exact Order Reference** (recommended)
   - Enter: `ORD-1761846167882-SULH`

2. **Partial Match**
   - Enter: `ORD-1761846167882`
   - Enter: `SULH`
   - Enter: Customer name
   - Enter: Customer phone
   - Enter: Customer email

3. **Browse by Tab**
   - Click "Pending Pickup" to see waiting orders
   - Click "Picked Up" to see completed orders
   - Click "Refunded" to see cancelled/refunded orders

## If Order Not Found

### Possible Reasons:
1. ❌ Order doesn't exist in database
2. ❌ Wrong order reference format
3. ❌ Order was deleted or archived
4. ❌ Typo in order number

### What to Do:
1. **Double-check the reference**
   - Verify: `ORD-1761846167882-SULH`
   - Check spelling and case

2. **Try browsing tabs**
   - Go to "Pending Pickup" tab
   - Look through recent orders
   - Check "Completed Orders" if it might be picked up

3. **Search by customer details**
   - If you have customer name: search that
   - If you have customer phone: search that
   - System will find related orders

4. **Report to system admin**
   - If order should exist but doesn't
   - Check if order was created successfully
   - Verify database connection

## Database Verification

### Check if Order Exists (For Developers)

Run this command to verify the order:
```bash
npx ts-node scripts/check-order.ts
```

This will:
- Search for the exact order reference
- List all recent orders in system
- Show order details if found

### Expected Order Fields

```
✓ order_reference: ORD-1761846167882-SULH
✓ customer_name: [Customer Name]
✓ customer_phone: [Phone Number]
✓ customer_email: [Email]
✓ total_amount: [Amount in KES]
✓ status: pending | picked_up | refunded | etc.
✓ created_at: [Timestamp]
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Search returns nothing | Check spelling; try customer name/phone |
| Order shows but can't checkout | Order might already be locked or completed |
| Error "order not found" | Order reference doesn't exist in database |
| Search is slow | Normal - wait for results to load |

## Admin Tips

### ✅ Quick Checkout Process
1. Search for order
2. Review order details
3. Click "Mark as Picked Up"
4. Confirm in modal
5. ✓ Order is locked and completed

### ✅ Quick Refund Process
1. Search for order
2. Click "Process Reimbursement"
3. Select refund reason
4. Optional: Enter custom amount
5. Add notes if needed
6. Confirm
7. ✓ Order refunded, wallet credited

### ✅ View Audit Trail
After checkout or refund:
1. Search for same order again
2. Click "View Audit Trail"
3. See all actions with timestamps and admin names

## Contact Support

If order truly doesn't exist:
- Check: Is this the correct order reference?
- Check: Was order created successfully?
- Check: Is database connection working?

---

**For the specific order `ORD-1761846167882-SULH`:**

Try these steps:
1. Go to Checkout tab
2. Search: `ORD-1761846167882-SULH`
3. If found: Proceed with checkout/reimbursement
4. If NOT found: Check with customer for correct reference

**Status:** Ready to verify order existence when you test the search!
