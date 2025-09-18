-- Create wallet_kyc table for storing KYC verification data
CREATE TABLE IF NOT EXISTS wallet_kyc (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    id_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    kra_pin TEXT NOT NULL,
    id_type TEXT NOT NULL DEFAULT 'national_id',
    status TEXT NOT NULL DEFAULT 'pending_verification',
    verified_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraint if users table exists
    CONSTRAINT wallet_kyc_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS wallet_kyc_user_id_idx ON wallet_kyc(user_id);
CREATE INDEX IF NOT EXISTS wallet_kyc_status_idx ON wallet_kyc(status);
CREATE INDEX IF NOT EXISTS wallet_kyc_created_at_idx ON wallet_kyc(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE wallet_kyc ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own KYC data
CREATE POLICY "Users can view own KYC data" ON wallet_kyc
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own KYC data
CREATE POLICY "Users can insert own KYC data" ON wallet_kyc
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own KYC data (but only if pending)
CREATE POLICY "Users can update own pending KYC data" ON wallet_kyc
    FOR UPDATE USING (auth.uid()::text = user_id AND status = 'pending_verification')
    WITH CHECK (auth.uid()::text = user_id);

-- Policy: Admins can view all KYC data
CREATE POLICY "Admins can view all KYC data" ON wallet_kyc
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can update any KYC data
CREATE POLICY "Admins can update any KYC data" ON wallet_kyc
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Add trigger for updated_at timestamp
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

-- Add comments for documentation
COMMENT ON TABLE wallet_kyc IS 'Store KYC (Know Your Customer) data for wallet activation';
COMMENT ON COLUMN wallet_kyc.id_type IS 'Type of ID: national_id or passport';
COMMENT ON COLUMN wallet_kyc.status IS 'Verification status: pending_verification, verified, or rejected';
COMMENT ON COLUMN wallet_kyc.kra_pin IS 'Kenya Revenue Authority PIN number';