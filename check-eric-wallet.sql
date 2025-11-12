-- Diagnostic query to check wallet data for user eric
-- This shows exactly what's in the wallets table

SELECT 
  w.id,
  w.user_id,
  w.balance,
  w.is_active,
  w.getdeals_number,
  w.created_at,
  w.updated_at,
  -- Also show profile info for reference
  p.first_name,
  p.last_name,
  p.email,
  p.organization
FROM public.wallets w
LEFT JOIN public.profiles p ON w.user_id = p.user_id
WHERE p.first_name = 'eric' OR p.first_name = 'Eric' OR p.last_name = 'ndivo'
ORDER BY w.created_at DESC
LIMIT 10;
