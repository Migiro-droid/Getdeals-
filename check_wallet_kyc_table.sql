-- Check if wallet_kyc table exists and see its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_kyc'
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT COUNT(*) as total_records FROM wallet_kyc;

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'wallet_kyc';