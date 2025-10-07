-- Migration: Fix payment amount tracking and add sender name
-- Date: October 7, 2025
-- Purpose: 
--   1. Add sender_name column to capture M-Pesa sender's name
--   2. Ensure payment amounts reflect actual charged amount (not inflated by delivery fee for pickup)

-- Add sender_name column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Add sender_name column to transaction_logs table for audit trail (if table exists)
-- Note: transaction_logs table is created by migration 20250930_add_transaction_logging.sql
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transaction_logs'
    ) THEN
        ALTER TABLE public.transaction_logs ADD COLUMN IF NOT EXISTS sender_name TEXT;
        COMMENT ON COLUMN public.transaction_logs.sender_name IS 'Name of the M-Pesa sender from callback metadata';
    END IF;
END $$;

-- Add comment explaining the payments.sender_name column
COMMENT ON COLUMN public.payments.sender_name IS 'Name of the M-Pesa sender (FirstName + MiddleName + LastName from callback)';

-- Create index for searching by sender name
CREATE INDEX IF NOT EXISTS idx_payments_sender_name ON public.payments(sender_name);

-- Update the payment_transactions_view to include sender_name (if view exists)
-- Note: This view is created by migration 20250930_add_transaction_logging.sql
DO $$ 
BEGIN
    -- Check if transaction_logs table exists before creating/updating the view
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transaction_logs'
    ) THEN
        -- Drop and recreate the view with sender_name
        DROP VIEW IF EXISTS payment_transactions_view;
        
        CREATE VIEW payment_transactions_view AS
        SELECT 
          p.id as payment_id,
          p.order_id,
          p.amount,
          p.method,
          p.status as payment_status,
          p.transaction_id,
          p.phone_number,
          p.sender_name,
          p.mpesa_receipt_number,
          p.transaction_date,
          p.merchant_request_id,
          p.reference,
          p.failure_reason,
          p.processed_at,
          p.created_at as payment_created_at,
          p.updated_at as payment_updated_at,
          tl.result_code,
          tl.result_desc,
          tl.sender_name as transaction_sender_name,
          tl.transaction_date as mpesa_transaction_date,
          tl.callback_data,
          o.order_reference,
          o.status as order_status,
          o.total_amount as order_total,
          o.customer_name,
          o.customer_email
        FROM payments p
        LEFT JOIN transaction_logs tl ON p.transaction_id = tl.transaction_id
        LEFT JOIN orders o ON p.order_id = o.id;
        
        -- Grant access to the view
        GRANT SELECT ON payment_transactions_view TO authenticated;
        GRANT ALL ON payment_transactions_view TO service_role;
        
        RAISE NOTICE 'payment_transactions_view updated successfully with sender_name column';
    ELSE
        RAISE NOTICE 'transaction_logs table does not exist, skipping view update. Please run migration 20250930_add_transaction_logging.sql first.';
    END IF;
END $$;
