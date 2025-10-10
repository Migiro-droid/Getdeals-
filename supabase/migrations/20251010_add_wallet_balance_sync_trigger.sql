-- Add trigger to automatically update wallet balance when transaction status changes to 'completed'
-- This ensures the wallet balance is always in sync with completed transactions

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION trigger_sync_wallet_on_transaction_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if status changed to 'completed'
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
    
    -- Sync the wallet balance using the existing function
    PERFORM sync_wallet_balance(NEW.user_id);
    
    -- Log the balance update for debugging
    RAISE NOTICE 'Wallet balance synced for user_id: %, transaction_id: %, amount: %', 
      NEW.user_id, NEW.id, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_wallet_on_transaction_complete ON wallet_transactions;

-- Create the trigger
CREATE TRIGGER sync_wallet_on_transaction_complete
  AFTER INSERT OR UPDATE OF status ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_wallet_on_transaction_complete();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_sync_wallet_on_transaction_complete() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_wallet_balance(UUID) TO authenticated;

-- Test comment: This trigger will automatically update the wallets.balance 
-- whenever a wallet_transaction is inserted or updated to 'completed' status
