import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { useWallet } from '../contexts/NewWalletContext';
import { Loader2, Phone, DollarSign, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const WalletDepositComponent: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    balance,
    pendingTransactions,
    depositLoading,
    balanceUpdating,
    initiateDeposit,
    refreshWallet,
    refreshPendingTransactions,
    forceBalanceRefresh
  } = useWallet();

  // Auto-refresh pending transactions periodically
  useEffect(() => {
    if (pendingTransactions.length > 0) {
      const interval = setInterval(async () => {
        console.log('🔄 Auto-refreshing wallet data due to pending transactions');
        await forceBalanceRefresh();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [pendingTransactions.length, forceBalanceRefresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const depositAmount = parseFloat(amount);
    
    // Validation
    if (!depositAmount || depositAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is KES 100",
        variant: "destructive"
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await initiateDeposit({
        amount: depositAmount,
        phone: phone.trim()
      });

      if (result.success) {
        toast({
          title: "STK Push Sent! 📱",
          description: "Check your phone and enter your M-Pesa PIN to complete the deposit.",
        });
        
        // Clear form
        setAmount('');
        setPhone('');
      } else {
        toast({
          title: "Deposit Failed",
          description: result.error || "Failed to initiate deposit. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Kenyan phone number
    if (digits.startsWith('254')) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
    } else if (digits.startsWith('0')) {
      return `0${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
    } else if (digits.length >= 9) {
      return `07${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
    }
    
    return digits;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            KES {balance.toLocaleString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              refreshWallet();
              refreshPendingTransactions();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Balance
          </Button>
        </CardContent>
      </Card>

      {/* Pending Deposits Alert */}
      {pendingTransactions.length > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            You have {pendingTransactions.length} pending deposit{pendingTransactions.length > 1 ? 's' : ''}.
            Your balance will update automatically once the payment{pendingTransactions.length > 1 ? 's are' : ' is'} confirmed.
          </AlertDescription>
        </Alert>
      )}

      {/* Deposit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Funds</CardTitle>
          <CardDescription>
            Add money to your wallet using M-Pesa. Minimum deposit is KES 100.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount (min. 100)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="100"
                step="1"
                required
                disabled={isSubmitting || depositLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712 345 678 or +254 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className="pl-10"
                  required
                  disabled={isSubmitting || depositLoading}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your M-Pesa registered phone number
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || depositLoading}
              className="w-full"
            >
              {isSubmitting || depositLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Deposit...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Send STK Push
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Deposits</CardTitle>
            <CardDescription>
              These deposits are waiting for payment confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="font-medium">
                        KES {transaction.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.phone_number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Enter the amount you want to deposit (minimum KES 100)</li>
            <li>Enter your M-Pesa registered phone number</li>
            <li>Click "Send STK Push" to initiate the payment</li>
            <li>Check your phone for the M-Pesa payment request</li>
            <li>Enter your M-Pesa PIN to complete the payment</li>
            <li>Your wallet balance will update automatically once confirmed</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};