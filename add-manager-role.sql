-- Migration: Add 'manager' role to users table
-- This updates the CHECK constraint to include the 'manager' role

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with 'manager' included
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('customer', 'admin', 'manager', 'staff'));

-- Verify the change
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
