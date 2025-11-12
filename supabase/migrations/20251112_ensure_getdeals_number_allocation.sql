-- Ensure existing users with active wallets get their correct GetDeals number

-- First, verify the wallets table schema
-- ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS getdeals_number TEXT UNIQUE;

-- Create a function to generate and assign GetDeals numbers for existing wallets without them
CREATE OR REPLACE FUNCTION generate_missing_getdeals_numbers()
RETURNS TABLE(user_id UUID, getdeals_number TEXT, status TEXT) AS $$
DECLARE
  v_wallet RECORD;
  v_next_number INT;
  v_formatted_number TEXT;
  v_count INT := 0;
BEGIN
  -- Get the highest existing GetDeals number to continue from
  SELECT COALESCE(MAX(CAST(SUBSTRING(getdeals_number, 4) AS INT)), 100000)
  INTO v_next_number
  FROM public.wallets
  WHERE getdeals_number IS NOT NULL;
  
  -- Process each wallet without a GetDeals number
  FOR v_wallet IN 
    SELECT id, user_id FROM public.wallets 
    WHERE getdeals_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    v_next_number := v_next_number + 1;
    v_formatted_number := 'GD-' || LPAD(v_next_number::TEXT, 6, '0');
    
    -- Update the wallet with the new GetDeals number
    UPDATE public.wallets
    SET getdeals_number = v_formatted_number,
        updated_at = NOW()
    WHERE id = v_wallet.id;
    
    RETURN QUERY SELECT v_wallet.user_id, v_formatted_number, 'assigned'::TEXT;
    v_count := v_count + 1;
  END LOOP;
  
  -- If no wallets needed assignment
  IF v_count = 0 THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 'no_wallets_to_process'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to auto-assign GetDeals number when a wallet is created
CREATE OR REPLACE FUNCTION auto_assign_getdeals_number()
RETURNS TRIGGER AS $$
DECLARE
  v_next_number INT;
  v_formatted_number TEXT;
BEGIN
  -- Only assign if getdeals_number is NULL
  IF NEW.getdeals_number IS NULL THEN
    -- Get the highest existing number
    SELECT COALESCE(MAX(CAST(SUBSTRING(getdeals_number, 4) AS INT)), 100000)
    INTO v_next_number
    FROM public.wallets
    WHERE getdeals_number IS NOT NULL;
    
    -- Increment and format
    v_next_number := v_next_number + 1;
    v_formatted_number := 'GD-' || LPAD(v_next_number::TEXT, 6, '0');
    
    -- Assign to the new wallet
    NEW.getdeals_number := v_formatted_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_auto_assign_getdeals_number ON public.wallets;
CREATE TRIGGER trigger_auto_assign_getdeals_number
  BEFORE INSERT ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_getdeals_number();

-- Ensure RLS policy allows users to see their getdeals_number
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;

-- Recreate policies to ensure getdeals_number is accessible
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Run the backfill for existing wallets without GetDeals numbers
SELECT * FROM generate_missing_getdeals_numbers();

-- Comment for documentation
COMMENT ON FUNCTION generate_missing_getdeals_numbers() IS 'Backfill function to assign GetDeals numbers to existing wallets';
COMMENT ON FUNCTION auto_assign_getdeals_number() IS 'Trigger function to auto-assign GetDeals numbers to new wallets';
