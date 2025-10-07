-- Simple Migration: Add sender_name to payments table
-- Date: October 7, 2025
-- Purpose: Capture M-Pesa sender's name from callback metadata
-- Dependencies: None (standalone migration)

-- Add sender_name column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.payments.sender_name IS 'Name of the M-Pesa sender (FirstName + MiddleName + LastName from callback)';

-- Create index for searching by sender name
CREATE INDEX IF NOT EXISTS idx_payments_sender_name ON public.payments(sender_name);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Added sender_name column to payments table';
    RAISE NOTICE '   - Created index idx_payments_sender_name';
    RAISE NOTICE '   - Ready to capture M-Pesa sender names';
END $$;
