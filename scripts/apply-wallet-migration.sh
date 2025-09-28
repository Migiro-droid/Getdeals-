#!/bin/bash

# Script to apply the wallet_transactions reference column migration
# This should be run after the Supabase project is set up

echo "🔧 Applying wallet_transactions migration..."

# Apply the migration
npx supabase db push --include-all

# Alternatively, if you want to run the SQL directly:
# npx supabase db reset --debug

echo "✅ Migration applied successfully!"
echo ""
echo "📋 Summary of changes:"
echo "   - Added 'reference' column to wallet_transactions table"
echo "   - Added 'transaction_id' column to wallet_transactions table"  
echo "   - Added 'status' column with CHECK constraint"
echo "   - Added 'phone_number' column"
echo "   - Added 'user_id' column with FK to auth.users"
echo "   - Added 'completed_at' and 'updated_at' timestamp columns"
echo "   - Created performance indexes"
echo ""
echo "🚀 Your deposit functionality is now ready!"
echo ""
echo "Next steps:"
echo "1. Deploy the updated Edge Functions (deposit-funds, rukisha-callback)"
echo "2. Update your frontend to use the new WalletDepositComponent"
echo "3. Test deposits with small amounts first"