# Wallet KYC Database Setup Guide

## 🗄️ Database Setup

### Option 1: Run SQL in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `create_wallet_kyc_table.sql`
4. Execute the query

### Option 2: Use Supabase CLI (if available)

```bash
supabase db push
```

### Option 3: Manual Schema Update

If the above don't work, you can manually create the table with this SQL:

```sql
-- Create wallet_kyc table
CREATE TABLE wallet_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Add indexes
CREATE INDEX wallet_kyc_user_id_idx ON wallet_kyc(user_id);
CREATE INDEX wallet_kyc_status_idx ON wallet_kyc(status);

-- Enable RLS
ALTER TABLE wallet_kyc ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own KYC data" ON wallet_kyc
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC data" ON wallet_kyc
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending KYC data" ON wallet_kyc
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_verification');
```

## 📁 Files Created

1. **Database Schema**: `create_wallet_kyc_table.sql`
2. **Migration File**: `supabase/migrations/20250918000001_add_wallet_kyc_table.sql`
3. **TypeScript Types**: `src/types/wallet-kyc.ts`
4. **API Endpoints**:
   - `api/wallet/kyc/submit.ts` - For KYC submission
   - `api/wallet/kyc/verify.ts` - For admin verification

## 🔧 Next Steps

### 1. Update WalletActivationModal to use API

Replace the localStorage logic in `src/components/WalletActivationModal.tsx` with:

```typescript
// Instead of localStorage, call the API
const response = await fetch('/api/wallet/kyc/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}` // Get from auth context
  },
  body: JSON.stringify(formData)
});

const result = await response.json();
if (result.success) {
  // Handle success
} else {
  // Handle error
}
```

### 2. Create Admin Interface

Create an admin page to view and verify KYC submissions:

```typescript
// Fetch pending KYC submissions
const { data: pendingKyc } = await supabase
  .from('wallet_kyc')
  .select('*')
  .eq('status', 'pending_verification');

// Verify KYC
await fetch('/api/wallet/kyc/verify', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    kycId: 'kyc-id',
    status: 'verified', // or 'rejected'
    verificationNotes: 'Notes...'
  })
});
```

### 3. Update Supabase Types

After creating the table, regenerate Supabase types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

### 4. Security Considerations

- ✅ KRA PIN validation (personal PINs start with 'A')
- ✅ Row Level Security (RLS) enabled
- ✅ Input validation and sanitization
- ✅ Admin-only verification endpoints
- ⚠️ Consider encrypting sensitive fields (KRA PIN, ID numbers)
- ⚠️ Implement audit logging
- ⚠️ Add rate limiting for API endpoints

## 📊 Table Structure

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| full_name | TEXT | Full name as per ID |
| id_number | TEXT | National ID or Passport number |
| phone_number | TEXT | Phone number |
| email | TEXT | Email address |
| kra_pin | TEXT | Kenya Revenue Authority PIN |
| id_type | TEXT | 'national_id' or 'passport' |
| status | TEXT | 'pending_verification', 'verified', 'rejected' |
| verified_at | TIMESTAMPTZ | When KYC was verified |
| rejected_at | TIMESTAMPTZ | When KYC was rejected |
| rejection_reason | TEXT | Reason for rejection |
| verification_notes | TEXT | Admin notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## 🔄 Workflow

1. **User submits KYC** → Data stored with status 'pending_verification'
2. **Admin reviews** → Can verify or reject with notes
3. **User gets notified** → Via email/SMS about status change
4. **Wallet activated** → If KYC is verified