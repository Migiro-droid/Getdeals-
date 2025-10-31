-- Add columns to orders table for checkout management
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checked_out_by TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_by TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Create checkout_audit_logs table
CREATE TABLE IF NOT EXISTS checkout_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  order_reference TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('checkout', 'reimbursement')),
  reason TEXT,
  amount DECIMAL(10, 2),
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_checkout_audit_logs_order_id ON checkout_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_checkout_audit_logs_order_reference ON checkout_audit_logs(order_reference);
CREATE INDEX IF NOT EXISTS idx_checkout_audit_logs_created_at ON checkout_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON orders(order_reference);

-- Create checkout_statistics view for analytics
CREATE OR REPLACE VIEW checkout_statistics AS
SELECT 
  DATE(created_at) as checkout_date,
  COUNT(*) as total_checkouts,
  SUM(CASE WHEN action = 'checkout' THEN 1 ELSE 0 END) as pickups,
  SUM(CASE WHEN action = 'reimbursement' THEN 1 ELSE 0 END) as reimbursements,
  COUNT(DISTINCT admin_id) as unique_admins
FROM checkout_audit_logs
GROUP BY DATE(created_at)
ORDER BY checkout_date DESC;
