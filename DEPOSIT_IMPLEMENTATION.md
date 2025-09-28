# Rukisha Deposit Functionality Implementation

This document outlines the complete implementation of deposit functionality with callback confirmation for Rukisha's deposit-funds API.

## 🎯 Overview

The implementation provides:
- UUID-based transaction references for reliable tracking
- Callback URL configuration for payment confirmations
- Pending state management in the frontend
- Real-time balance updates via Supabase subscriptions
- Comprehensive error handling and user feedback

## 🏗️ Architecture

```
Frontend Component
       ↓
Supabase Edge Function (deposit-funds)
       ↓
1. Generate UUID reference
2. Store pending transaction in DB
3. Call Rukisha API with callback URL
       ↓
Rukisha STK Push to User's Phone
       ↓
User Enters M-Pesa PIN
       ↓
Rukisha Callback (rukisha-callback function)
       ↓
1. Lookup transaction by reference
2. Update transaction status
3. Update wallet balance (if successful)
```

## 📁 Files Created/Modified

### 1. Database Migration
- `supabase/migrations/20250928_add_reference_to_wallet_transactions.sql`
- Adds required columns: `reference`, `transaction_id`, `status`, `phone_number`, etc.

### 2. Edge Functions
- `supabase/functions/deposit-funds/index.ts` - Updated with reference and callback URL
- `supabase/functions/rukisha-callback/index.ts` - Updated to handle reference lookups

### 3. Frontend Services  
- `src/services/wallet-service.ts` - New service for wallet operations
- `src/contexts/NewWalletContext.tsx` - Context with pending state management
- `src/components/WalletDepositComponent.tsx` - Complete deposit UI component

### 4. Deployment Scripts
- `scripts/apply-wallet-migration.sh` - Database migration script
- `scripts/deploy-deposit-functions.sh` - Edge function deployment script

## 🚀 Deployment Steps

### 1. Apply Database Migration
```bash
./scripts/apply-wallet-migration.sh
```

### 2. Deploy Edge Functions
```bash
./scripts/deploy-deposit-functions.sh
```

### 3. Configure Environment Variables
Ensure these are set in your Supabase project:
```bash
RUKISHA_API_TOKEN=your_rukisha_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Update Frontend
Replace your existing wallet context and component with the new ones:

```tsx
// In your main App.tsx or layout
import { WalletProvider } from './contexts/NewWalletContext';

function App() {
  return (
    <WalletProvider>
      {/* Your app content */}
    </WalletProvider>
  );
}
```

```tsx
// In your wallet page
import { WalletDepositComponent } from './components/WalletDepositComponent';

function WalletPage() {
  return (
    <div>
      <WalletDepositComponent />
    </div>
  );
}
```

## 🔄 How It Works

### Deposit Flow

1. **User initiates deposit**
   - Enters amount and phone number
   - Frontend calls `initiateDeposit()`

2. **deposit-funds Edge Function**
   - Generates UUID reference
   - Creates pending transaction record
   - Calls Rukisha API with callback URL and reference
   - Returns success/failure to frontend

3. **STK Push**
   - User receives M-Pesa prompt on phone
   - Enters PIN to complete payment

4. **Rukisha Callback**
   - Rukisha calls our callback endpoint
   - Looks up transaction by reference
   - Updates transaction status
   - Updates wallet balance (if successful)

5. **Frontend Updates**
   - Real-time subscription updates balance
   - Pending transactions list updates
   - User sees immediate feedback

### Payload Examples

**Deposit Request to Rukisha:**
```json
{
  "amount": 1000,
  "phone": "0712345678",
  "customer_id": "RUKISHA_CUSTOMER_ID", 
  "callback_url": "https://[project].supabase.co/functions/v1/rukisha-callback",
  "reference": "uuid-generated-reference"
}
```

**Rukisha Callback:**
```json
{
  "transaction_id": "rukisha_tx_id",
  "customer_id": "RUKISHA_CUSTOMER_ID",
  "amount": 1000,
  "phone": "0712345678",
  "status": "success",
  "reference": "uuid-generated-reference"
}
```

## 🎨 Frontend Features

### WalletDepositComponent Features:
- ✅ Current balance display with refresh button
- ✅ Deposit form with validation
- ✅ Phone number formatting
- ✅ Pending deposits list with status badges
- ✅ Real-time balance updates
- ✅ Loading states and error handling
- ✅ Step-by-step instructions for users

### User Experience:
1. User sees current balance
2. Enters deposit amount and phone number
3. Clicks "Send STK Push"
4. Sees "Check your phone" message
5. Transaction appears in "Pending Deposits" list
6. Balance updates automatically when payment confirms
7. Pending transaction disappears from list

## 📊 Database Schema

### wallet_transactions Table
```sql
CREATE TABLE wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id text NOT NULL,
  type text NOT NULL, -- 'deposit', 'withdrawal', 'payment'
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_id text, -- Rukisha transaction ID
  reference text, -- UUID reference for callbacks
  phone_number text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

## 🔧 Configuration

### Rukisha API Integration
The system calls the Rukisha deposit-to-wallet endpoint:
```
POST https://api.rukisha.com/api/tap-and-go/deposit-to-wallet
```

### Required Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_RUKISHA_API_TOKEN
```

## 🧪 Testing

### Test Deposit Flow:
1. Use small amounts (KES 100-500) for testing
2. Use test phone numbers provided by Rukisha
3. Monitor Supabase logs for callback processing
4. Verify database updates in real-time

### Debug Checklist:
- [ ] Environment variables set correctly
- [ ] Edge functions deployed successfully  
- [ ] Database migration applied
- [ ] Rukisha API token valid
- [ ] Callback URL accessible from internet
- [ ] User has valid customer_id in profiles table

## 🚨 Error Handling

The implementation handles:
- Network failures
- Invalid phone numbers
- Insufficient Rukisha balance
- Callback processing errors
- Database connection issues
- Duplicate transactions

## 🔒 Security Features

- Service role key used for callback processing
- Transaction amount validation
- User authentication required
- Reference-based transaction lookup
- Status validation before balance updates

## 📈 Monitoring

Monitor these metrics:
- Deposit success/failure rates
- Callback processing latency
- Pending transaction counts
- Balance update accuracy

## 💡 Future Enhancements

Potential improvements:
- Webhook retry mechanism
- Transaction timeout handling
- Email notifications for deposits
- Deposit limits and KYC checks
- Multi-currency support

---

## 🆘 Troubleshooting

### Common Issues:

1. **STK Push not received**
   - Check phone number format
   - Verify Rukisha API token
   - Check user's M-Pesa account status

2. **Callback not processed**
   - Verify callback URL is accessible
   - Check Supabase service role key
   - Monitor Edge function logs

3. **Balance not updating**
   - Check callback processing logs
   - Verify database permissions
   - Check real-time subscription status

4. **Pending transactions stuck**
   - Check Rukisha API status
   - Verify callback endpoint is receiving calls
   - Consider manual status updates for stuck transactions

---

**🎉 Your Rukisha deposit functionality with callback confirmation is now fully implemented!**