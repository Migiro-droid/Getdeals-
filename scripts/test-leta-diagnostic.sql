-- ============================================================
-- Leta Integration Diagnostic Queries
-- Run these in Supabase SQL Editor to verify Leta integration
-- ============================================================

-- ===== SECTION 1: Check Recent Orders with Leta Integration =====
-- Shows the last 20 speedy delivery orders and their Leta status

SELECT 
  order_reference,
  id as order_id,
  status,
  delivery_method,
  delivery_address,
  leta_order_id,
  leta_reference,
  leta_status,
  leta_tracking_url,
  created_at,
  CASE 
    WHEN leta_order_id IS NOT NULL THEN '✅ INTEGRATED'
    ELSE '❌ NOT INTEGRATED'
  END as integration_status,
  EXTRACT(MINUTE FROM NOW() - created_at) as minutes_ago
FROM orders
WHERE delivery_method = 'speedy'
ORDER BY created_at DESC
LIMIT 20;

-- ===== SECTION 2: Check Order Creation Flow =====
-- Shows order with its payment relationship

SELECT 
  o.order_reference,
  o.id as order_id,
  o.status as order_status,
  o.delivery_method,
  p.reference as payment_reference,
  p.status as payment_status,
  o.leta_order_id,
  o.leta_status,
  o.created_at,
  CASE 
    WHEN p.reference IS NULL THEN '⚠️  PAYMENT NOT LINKED'
    WHEN o.leta_order_id IS NULL THEN '⚠️  LETA NOT CREATED'
    ELSE '✅ COMPLETE'
  END as flow_status
FROM orders o
LEFT JOIN payments p ON o.payment_reference = p.reference 
  OR o.id = p.order_id
WHERE o.delivery_method = 'speedy'
ORDER BY o.created_at DESC
LIMIT 15;

-- ===== SECTION 3: Check for Failed Leta Creations =====
-- Shows orders where Leta integration was attempted but failed

SELECT 
  order_reference,
  id as order_id,
  status,
  delivery_address,
  customer_email,
  customer_phone,
  customer_name,
  created_at,
  DATEDIFF(MINUTE, created_at, NOW()) as minutes_since_creation,
  CASE 
    WHEN delivery_method = 'speedy' AND leta_order_id IS NULL THEN 'FAILED'
    ELSE 'OK'
  END as leta_status
FROM orders
WHERE delivery_method = 'speedy'
  AND leta_order_id IS NULL
  AND created_at > NOW() - INTERVAL 24 HOUR
ORDER BY created_at DESC;

-- ===== SECTION 4: Check Payment-Order Linking =====
-- Verifies payments are properly linked to orders

SELECT 
  COUNT(*) as total_payments,
  SUM(CASE WHEN order_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_order,
  SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END) as not_linked,
  ROUND(100.0 * SUM(CASE WHEN order_id IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as link_percentage
FROM payments
WHERE created_at > NOW() - INTERVAL 7 DAY;

-- ===== SECTION 5: Check Order Items are Saved =====
-- Shows order items for recent orders

SELECT 
  o.order_reference,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.quantity * oi.price) as items_total,
  o.total_amount as order_total,
  o.delivery_fee,
  o.status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.delivery_method = 'speedy'
  AND o.created_at > NOW() - INTERVAL 24 HOUR
GROUP BY o.id, o.order_reference, o.total_amount, o.delivery_fee, o.status
ORDER BY o.created_at DESC
LIMIT 10;

-- ===== SECTION 6: Check Customer Data Integrity =====
-- Verifies customer contact information is captured correctly

SELECT 
  order_reference,
  customer_name,
  customer_email,
  customer_phone,
  CASE 
    WHEN customer_name IS NULL OR customer_name = '' THEN '❌ NAME MISSING'
    WHEN customer_email IS NULL OR customer_email = '' THEN '❌ EMAIL MISSING'
    WHEN customer_phone IS NULL OR customer_phone = '' THEN '❌ PHONE MISSING'
    WHEN LENGTH(customer_phone) < 10 THEN '⚠️  PHONE FORMAT INVALID'
    ELSE '✅ COMPLETE'
  END as data_quality,
  created_at
FROM orders
WHERE delivery_method = 'speedy'
  AND created_at > NOW() - INTERVAL 24 HOUR
ORDER BY created_at DESC
LIMIT 15;

-- ===== SECTION 7: Check Delivery Address Data =====
-- Verifies delivery addresses are captured

SELECT 
  order_reference,
  delivery_address,
  pickup_location,
  CASE 
    WHEN delivery_address IS NULL OR delivery_address = '' THEN '❌ ADDRESS MISSING'
    WHEN LENGTH(delivery_address::TEXT) < 5 THEN '⚠️  ADDRESS TOO SHORT'
    ELSE '✅ ADDRESS OK'
  END as address_quality,
  latitude,
  longitude,
  created_at
FROM orders
WHERE delivery_method = 'speedy'
  AND created_at > NOW() - INTERVAL 24 HOUR
ORDER BY created_at DESC
LIMIT 15;

-- ===== SECTION 8: Leta Status Distribution =====
-- Shows how many orders are at each stage of delivery

SELECT 
  leta_status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM orders
WHERE delivery_method = 'speedy'
  AND leta_order_id IS NOT NULL
  AND created_at > NOW() - INTERVAL 7 DAY
GROUP BY leta_status
ORDER BY count DESC;

-- ===== SECTION 9: Check for Stalled Orders =====
-- Shows orders stuck in the same status for too long

SELECT 
  order_reference,
  leta_status,
  EXTRACT(HOUR FROM NOW() - created_at) as hours_in_status,
  EXTRACT(HOUR FROM NOW() - created_at) / 24.0 as days_in_status,
  created_at,
  CASE 
    WHEN EXTRACT(HOUR FROM NOW() - created_at) > 48 THEN '❌ STALLED (48+ hours)'
    WHEN EXTRACT(HOUR FROM NOW() - created_at) > 24 THEN '⚠️  DELAYED (24+ hours)'
    ELSE '✅ NORMAL'
  END as status_check
FROM orders
WHERE delivery_method = 'speedy'
  AND leta_order_id IS NOT NULL
  AND created_at > NOW() - INTERVAL 7 DAY
ORDER BY created_at ASC;

-- ===== SECTION 10: Summary Statistics =====
-- Overall integration health check

WITH recent_orders AS (
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN leta_order_id IS NOT NULL THEN 1 ELSE 0 END) as with_leta,
    SUM(CASE WHEN delivery_method = 'pickup' THEN 1 ELSE 0 END) as pickup_orders,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
  FROM orders
  WHERE created_at > NOW() - INTERVAL 7 DAY
)
SELECT 
  total as total_orders_7d,
  with_leta as with_leta_integration,
  pickup_orders,
  delivered,
  pending,
  cancelled,
  ROUND(100.0 * with_leta / (total - pickup_orders), 2) as speedy_integration_rate,
  ROUND(100.0 * delivered / total, 2) as delivery_completion_rate
FROM recent_orders;

-- ===== SECTION 11: Check RLS Policies for Orders Table =====
-- Verify RLS policies are properly configured

SELECT 
  schemaname,
  tablename,
  rowsecurity,
  policyname,
  cmd,
  QUAL,
  WITH_CHECK
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- ===== SECTION 12: Check Service Role Permissions =====
-- Verify service role has necessary permissions

SELECT 
  grantee,
  table_catalog,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'order_items', 'payments')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ===== DEBUGGING: Get specific order details =====
-- Replace 'ORD-123456' with actual order reference
-- SELECT * FROM orders WHERE order_reference = 'ORD-123456';

-- ===== DEBUGGING: Check specific payment =====
-- Replace 'REF-123456' with actual payment reference
-- SELECT * FROM payments WHERE reference = 'REF-123456';

-- ===== NOTES =====
/*
How to use these queries:

1. Go to Supabase Dashboard > SQL Editor
2. Copy each query you want to run
3. Paste it and click "Run"
4. Check the results:
   - ✅ = Good
   - ⚠️  = Warning (might need attention)
   - ❌ = Error (needs fixing)

Key things to verify:
- Orders have leta_order_id populated
- Payment records are linked to orders
- Customer data (name, email, phone) is complete
- Delivery addresses are saved
- RLS policies exist
- Service role has permissions
*/
