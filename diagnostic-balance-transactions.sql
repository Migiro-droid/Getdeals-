-- Diagnostic queries for user eric's wallet balance and transactions

-- 1. Check current wallet balance in wallets table
SELECT 
  w.id,
  w.user_id,
  w.balance,
  w.is_active,
  w.getdeals_number,
  w.created_at,
  w.updated_at
FROM public.wallets w
WHERE w.user_id = 'd0f48d73-8b97-480e-860b-d781ff45a46d';

-- 2. Check all wallet transactions (all statuses)
SELECT 
  id,
  user_id,
  type,
  amount,
  status,
  created_at,
  updated_at,
  completed_at,
  description,
  reference
FROM public.wallet_transactions
WHERE user_id = 'd0f48d73-8b97-480e-860b-d781ff45a46d'
ORDER BY created_at DESC;

-- 3. Check breakdown by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(
    CASE 
      WHEN type = 'deposit' THEN amount
      WHEN type IN ('withdrawal', 'payment') THEN -amount
      ELSE 0
    END
  ) as net_amount
FROM public.wallet_transactions
WHERE user_id = 'd0f48d73-8b97-480e-860b-d781ff45a46d'
GROUP BY status;

-- 4. Calculate what balance should be (only completed transactions)
SELECT 
  COALESCE(SUM(
    CASE 
      WHEN type = 'deposit' AND status = 'completed' THEN amount
      WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
      WHEN type = 'payment' AND status = 'completed' THEN -amount
      ELSE 0
    END
  ), 0) as calculated_balance
FROM public.wallet_transactions
WHERE user_id = 'd0f48d73-8b97-480e-860b-d781ff45a46d';

-- 5. If balance mismatch, sync it
UPDATE public.wallets
SET balance = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'deposit' AND status = 'completed' THEN amount
      WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
      WHEN type = 'payment' AND status = 'completed' THEN -amount
      ELSE 0
    END
  ), 0)
  FROM public.wallet_transactions
  WHERE user_id = 'd0f48d73-8b97-480e-860b-d781ff45a46d'
),
updated_at = NOW()
WHERE user_id = 'd0f48d73-8b97-480e-860b-d781ff45a46d';

-- 6. Verify the fix
SELECT 
  w.balance,
  (
    SELECT COALESCE(SUM(
      CASE 
        WHEN type = 'deposit' AND status = 'completed' THEN amount
        WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
        WHEN type = 'payment' AND status = 'completed' THEN -amount
        ELSE 0
      END
    ), 0)
    FROM public.wallet_transactions wt
    WHERE wt.user_id = w.user_id
  ) as calculated_balance,
  w.updated_at
FROM public.wallets w
WHERE w.user_id = 'd0f48d73-8b97-480e-860b-d781ff45a46d';
