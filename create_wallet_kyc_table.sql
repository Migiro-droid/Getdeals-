-- Manual SQL to run in Supabase SQL Editor
-- Creates the wallet_kyc table for KYC data storage

CREATE TABLE wallet_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    id_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    kra_pin TEXT NOT NULL,
    id_type TEXT NOT NULL DEFAULT 'national_id' CHECK (id_type IN ('national_id', 'passport')),
    status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX wallet_kyc_user_id_idx ON wallet_kyc(user_id);
CREATE INDEX wallet_kyc_status_idx ON wallet_kyc(status);
CREATE INDEX wallet_kyc_created_at_idx ON wallet_kyc(created_at);

-- Add foreign key constraint (optional - depends on your auth setup)
-- ALTER TABLE wallet_kyc ADD CONSTRAINT wallet_kyc_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE wallet_kyc ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own KYC data" ON wallet_kyc
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC data" ON wallet_kyc
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending KYC data" ON wallet_kyc
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_verification')
    WITH CHECK (auth.uid() = user_id);

-- Admin policies (if you have admin users)
CREATE POLICY "Service role can manage all KYC data" ON wallet_kyc
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_kyc_updated_at 
    BEFORE UPDATE ON wallet_kyc 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();