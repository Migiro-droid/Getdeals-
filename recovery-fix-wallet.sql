-- Recovery script to fix wallet duplicates and restore correct GetDeals number
-- This script handles the case where multiple wallet rows exist for the same user_id

-- Step 1: Find all users with multiple wallets (should only be one per user_id due to UNIQUE constraint)
SELECT 
  user_id, 
  COUNT(*) as wallet_count,
  STRING_AGG(DISTINCT getdeals_number, ', ') as getdeals_numbers,
  STRING_AGG(DISTINCT id::text, ', ') as wallet_ids
FROM public.wallets
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Step 2: For user eric, show all wallet rows
SELECT 
  w.id,
  w.user_id,
  w.balance,
  w.is_active,
  w.getdeals_number,
  w.created_at,
  w.updated_at,
  p.first_name,
  p.last_name
FROM public.wallets w
LEFT JOIN public.profiles p ON w.user_id = p.user_id
WHERE p.first_name ILIKE 'eric' OR p.last_name ILIKE 'ndivo'
ORDER BY w.created_at ASC;

-- Step 3: Set the correct GetDeals number for user eric (GD-100009)
-- Find the user_id for eric first, then update
UPDATE public.wallets
SET getdeals_number = 'GD-100009',
    updated_at = NOW()
WHERE user_id = (
  SELECT id FROM public.profiles 
  WHERE first_name ILIKE 'eric' AND last_name ILIKE 'ndivo'
  LIMIT 1
)
AND getdeals_number IS NULL;

-- Step 4: Verify the fix
SELECT 
  w.id,
  w.user_id,
  w.balance,
  w.is_active,
  w.getdeals_number,
  w.created_at,
  w.updated_at,
  p.first_name,
  p.last_name,
  p.email
FROM public.wallets w
LEFT JOIN public.profiles p ON w.user_id = p.user_id
WHERE p.first_name ILIKE 'eric' AND p.last_name ILIKE 'ndivo';
