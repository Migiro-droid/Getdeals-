import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export const StuckTransactionsFixer: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFixStuckTransactions = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-stuck-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast({
          title: "✅ Stuck Transactions Fixed!",
          description: `Successfully processed ${data.processed} transactions.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "❌ Fix Failed",
          description: data.error || "Failed to fix stuck transactions",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error fixing stuck transactions:', error);
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Fix Stuck Wallet Transactions
        </CardTitle>
        <CardDescription>
          This will find pending deposit transactions that likely succeeded but weren't updated due to the missing callback endpoint.
          It will mark them as completed and update wallet balances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Admin Only:</strong> This operation will automatically complete pending transactions older than 10 minutes
            and update wallet balances. Only use this if you've confirmed the actual M-Pesa payments were successful.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleFixStuckTransactions}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Stuck Transactions...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Fix Stuck Transactions
            </>
          )}
        </Button>

        {result && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>✅ Fix Complete!</strong></div>
                <div>• Found {result.total_found} stuck transactions</div>
                <div>• Successfully processed {result.processed} transactions</div>
                {result.errors && result.errors.length > 0 && (
                  <div className="text-red-600">
                    • {result.errors.length} transactions had errors
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Finds pending deposit transactions older than 10 minutes</li>
            <li>Updates their status to "completed"</li>
            <li>Adds the deposit amount to user wallet balances</li>
            <li>Sends real-time notifications to update frontend</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};