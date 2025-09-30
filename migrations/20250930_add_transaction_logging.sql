-- Migration to create comprehensive transaction logging table
-- This ensures all M-Pesa transactions are properly audited and tracked

-- Create transaction_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS public.transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL, -- CheckoutRequestID from M-Pesa
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  phone_number TEXT,
  amount BIGINT, -- Store amount in cents for precision
  transaction_date BIGINT, -- M-Pesa timestamp format
  result_code INTEGER,
  result_desc TEXT,
  callback_data JSONB, -- Store full callback for debugging
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON transaction_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_mpesa_receipt ON transaction_logs(mpesa_receipt_number);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_phone ON transaction_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_result_code ON transaction_logs(result_code);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction_logs
CREATE POLICY "Service role can manage transaction logs" ON public.transaction_logs
  FOR ALL USING (true);

-- Admins can view all transaction logs
CREATE POLICY "Admins can view all transaction logs" ON public.transaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own transaction logs (matched by phone number)
CREATE POLICY "Users can view own transaction logs" ON public.transaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND phone = transaction_logs.phone_number
    )
  );

-- Add missing columns to payments table if they don't exist
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_date BIGINT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS merchant_request_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes on payments table for better performance
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_mpesa_receipt ON payments(mpesa_receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_phone_number ON payments(phone_number);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_logs_updated_at BEFORE UPDATE ON transaction_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy transaction monitoring
CREATE OR REPLACE VIEW public.payment_transactions_view AS
SELECT 
  p.id as payment_id,
  p.order_id,
  p.amount,
  p.method,
  p.status,
  p.phone_number,
  p.reference,
  p.transaction_id,
  p.mpesa_receipt_number,
  p.created_at as payment_created,
  p.processed_at as payment_processed,
  tl.result_code,
  tl.result_desc,
  tl.transaction_date as mpesa_transaction_date,
  tl.processed_at as callback_processed,
  o.status as order_status,
  o.total as order_total
FROM payments p
LEFT JOIN transaction_logs tl ON p.transaction_id = tl.transaction_id
LEFT JOIN orders o ON p.order_id = o.id
ORDER BY p.created_at DESC;

-- Grant access to the view
ALTER VIEW public.payment_transactions_view OWNER TO postgres;
GRANT SELECT ON public.payment_transactions_view TO authenticated;
GRANT SELECT ON public.payment_transactions_view TO service_role;