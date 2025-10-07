-- Create increment_wallet_balance function
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id UUID, amount NUMERIC)
RETURNS void AS $$
BEGIN
    -- Update wallet balance by adding the amount
    UPDATE public.wallets 
    SET 
        balance = balance + amount,
        updated_at = NOW()
    WHERE user_id = increment_wallet_balance.user_id;
    
    -- If no wallet exists, create one (shouldn't happen in normal flow)
    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, balance, is_active, created_at, updated_at)
        VALUES (increment_wallet_balance.user_id, amount, true, NOW(), NOW());
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;