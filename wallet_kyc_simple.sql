-- Simple wallet_kyc table creation for Supabase
-- Run this in Supabase SQL Editor

-- Create the table first (without foreign key constraint to avoid auth.users issues)
CREATE TABLE wallet_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    id_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    kra_pin TEXT NOT NULL,
    id_type TEXT NOT NULL DEFAULT 'national_id',
    status TEXT NOT NULL DEFAULT 'pending_verification',
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT wallet_kyc_id_type_check CHECK (id_type IN ('national_id', 'passport')),
    CONSTRAINT wallet_kyc_status_check CHECK (status IN ('pending_verification', 'verified', 'rejected'))
);

-- Create indexes
CREATE INDEX wallet_kyc_user_id_idx ON wallet_kyc(user_id);
CREATE INDEX wallet_kyc_status_idx ON wallet_kyc(status);
CREATE INDEX wallet_kyc_created_at_idx ON wallet_kyc(created_at);

-- Enable RLS
ALTER TABLE wallet_kyc ENABLE ROW LEVEL SECURITY;

-- Create update trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger
CREATE TRIGGER update_wallet_kyc_updated_at 
    BEFORE UPDATE ON wallet_kyc 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
CREATE POLICY "Users can view own KYC data" ON wallet_kyc
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC data" ON wallet_kyc
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending KYC data" ON wallet_kyc
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_verification');

-- Service role policy for admin operations
CREATE POLICY "Service role can manage all KYC data" ON wallet_kyc
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON wallet_kyc TO authenticated;
GRANT ALL ON wallet_kyc TO service_role;