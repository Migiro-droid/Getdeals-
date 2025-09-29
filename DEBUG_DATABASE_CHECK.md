# Quick Database Check

Please run this SQL query in your Supabase SQL Editor to check if the database setup is correct:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('wallet_kyc', 'profiles', 'wallets')
ORDER BY table_name, ordinal_position;

SELECT 
    id,
    user_id,
    status,
    verified_at,
    created_at
FROM wallet_kyc 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 
    user_id,
    customer_id,
    first_name,
    last_name,
    updated_at
FROM profiles 
ORDER BY updated_at DESC 
LIMIT 5;

SELECT 
    user_id,
    is_active,
    balance,
    updated_at
FROM wallets 
ORDER BY updated_at DESC 
LIMIT 5;
```

This will help us identify if:
1. The database tables exist
2. Your KYC submission is being saved
3. The status is being updated to 'verified'
4. The wallet is being activated

If any of these tables don't exist, you'll need to run the migrations from `SIMPLIFIED_DATABASE_SETUP.md` first.