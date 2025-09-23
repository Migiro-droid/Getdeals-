# Wallet Backend Migration Guide

## Step 1: Run Database Migration

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Run the complete SQL** from `WALLET_TRANSACTIONS_MIGRATION.md`
3. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name IN ('wallets', 'wallet_transactions');
   ```

## Step 2: Update Your Application

### Replace WalletContext
1. **Backup current WalletContext**:
   ```bash
   mv src/contexts/WalletContext.tsx src/contexts/WalletContext.old.tsx
   ```

2. **Use new backend-connected context**:
   ```bash
   mv src/contexts/WalletContextNew.tsx src/contexts/WalletContext.tsx
   ```

### Update Prisma Schema
1. **Generate new types**:
   ```bash
   npx prisma generate
   ```

2. **Push schema to database** (optional):
   ```bash
   npx prisma db push
   ```

## Step 3: Test the Integration

### Test Wallet Loading
1. **Start dev server**: `npm run dev`
2. **Go to wallet page**: Login and visit `/wallet`
3. **Check console**: Should see wallet data loading from database
4. **Check Network tab**: API calls to Supabase instead of localStorage

### Test Deposit Flow
1. **Click deposit button** with amount (e.g., 100 KES)
2. **Should see**: Real STK Push sent to your phone
3. **Complete payment**: Enter M-Pesa PIN
4. **Check database**: 
   ```sql
   SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM wallets WHERE user_id = 'your-user-id';
   ```

### Test Withdrawal
1. **Try withdrawal** (checkout simulation)
2. **Should see**: Balance deducted, transaction recorded
3. **Real-time updates**: Balance should update instantly

## Step 4: Verify Real-Time Features

### Wallet Balance Updates
- Deposits should update balance automatically via webhook
- Withdrawals should update balance immediately
- Multiple browser tabs should sync balance changes

### Transaction History
- New transactions should appear instantly
- Transaction status updates should sync in real-time
- History should load from database, not localStorage

## Step 5: Cleanup (After Testing)

### Remove Old Files
```bash
rm src/contexts/WalletContext.old.tsx
rm src/services/wallet-backend.ts  # If you prefer to keep context-only approach
```

### Environment Variables
Make sure these are set in Supabase:
- `RUKISHA_API_KEY`: Your Rukisha API key
- `RUKISHA_BASE_URL`: Rukisha API endpoint
- `SUPABASE_SERVICE_ROLE_KEY`: For edge functions

## Troubleshooting

### "Wallet not found" Error
- Run the migration SQL to create wallet tables
- Check if trigger created wallets for existing users

### TypeScript Errors
- Run `npx prisma generate` to update types
- Restart your IDE/TypeScript server

### Balance Not Updating
- Check edge function logs in Supabase Dashboard
- Verify webhook URL is configured in Rukisha
- Check RLS policies allow service role to update wallets

### Real-time Not Working
- Check browser console for WebSocket connection errors
- Verify Supabase project has real-time enabled
- Check subscription filters match your user ID

## Benefits of New Backend

✅ **Real Database Storage** - No more localStorage limitations  
✅ **Real-time Updates** - Balance changes sync across devices  
✅ **Atomic Transactions** - Prevents race conditions  
✅ **Audit Trail** - Complete transaction history  
✅ **Scalable** - Supports multiple users  
✅ **Secure** - Row Level Security policies  
✅ **Webhook Integration** - Automatic M-Pesa confirmations  

Your wallet system is now production-ready! 🚀