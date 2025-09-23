# Database Migration: Complete Wallet System

Run this SQL in your Supabase SQL Editor to create the complete wallet system:

```sql
-- Create wallets table for user balance tracking
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency TEXT NOT NULL DEFAULT 'KES',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_transactions table for deposit/withdrawal tracking
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    transaction_id TEXT, -- Rukisha transaction ID
    phone_number TEXT,
    description TEXT,
    metadata JSONB, -- Additional transaction data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for wallets
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS wallets_status_idx ON public.wallets(status);

-- Create indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_idx ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_status_idx ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS wallet_transactions_type_idx ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS wallet_transactions_transaction_id_idx ON public.wallet_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_created_at_idx ON public.wallet_transactions(created_at);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can update wallets" ON public.wallets;
CREATE POLICY "Service can update wallets" ON public.wallets
    FOR UPDATE USING (true); -- Allow service role to update wallet balance

-- RLS Policies for wallet_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can update transactions" ON public.wallet_transactions;
CREATE POLICY "Service can update transactions" ON public.wallet_transactions
    FOR UPDATE USING (true); -- Allow service role to update transaction status

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON public.wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at 
    BEFORE UPDATE ON public.wallet_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance, currency, status)
    VALUES (NEW.id, 0, 'KES', 'active');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create wallet when user signs up
DROP TRIGGER IF EXISTS create_wallet_on_signup ON auth.users;
CREATE TRIGGER create_wallet_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();

-- Create wallets for existing users who don't have one
INSERT INTO public.wallets (user_id, balance, currency, status)
SELECT id, 0, 'KES', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets);

-- Function for atomic withdrawal processing
CREATE OR REPLACE FUNCTION process_withdrawal(
  p_user_id UUID,
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Withdrawal'
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  wallet_id UUID,
  type TEXT,
  amount NUMERIC,
  status TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  transaction_record RECORD;
BEGIN
  -- Check wallet balance and update in one operation
  UPDATE public.wallets 
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE wallets.id = p_wallet_id 
    AND wallets.user_id = p_user_id 
    AND balance >= p_amount;
  
  -- Check if update affected any rows (balance was sufficient)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or wallet not found';
  END IF;
  
  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    user_id, wallet_id, type, amount, status, description, completed_at
  )
  VALUES (
    p_user_id, p_wallet_id, 'withdrawal', p_amount, 'completed', p_description, NOW()
  )
  RETURNING * INTO transaction_record;
  
  -- Return the transaction record
  RETURN QUERY
  SELECT 
    transaction_record.id,
    transaction_record.user_id,
    transaction_record.wallet_id,
    transaction_record.type,
    transaction_record.amount,
    transaction_record.status,
    transaction_record.description,
    transaction_record.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

-- Add comments
COMMENT ON TABLE public.wallet_transactions IS 'Track wallet deposits and withdrawals';
COMMENT ON COLUMN public.wallet_transactions.transaction_id IS 'External transaction ID from payment provider (e.g., Rukisha)';
COMMENT ON COLUMN public.wallet_transactions.status IS 'Transaction status: pending, completed, failed, cancelled';
```