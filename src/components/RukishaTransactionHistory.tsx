import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RukishaService, RukishaTransaction } from '../services/RukishaService';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RukishaTransactionHistoryProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function RukishaTransactionHistory({ 
  limit = 20, 
  autoRefresh = false,
  refreshInterval = 30000 
}: RukishaTransactionHistoryProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<RukishaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userTransactions = await RukishaService.getUserTransactions(user.id, limit);
      setTransactions(userTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, limit]);

  useEffect(() => {
    if (autoRefresh && user) {
      const interval = setInterval(fetchTransactions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Please log in to view transaction history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rukisha Transaction History</CardTitle>
            <CardDescription>
              Your recent Rukisha wallet payments and top-ups
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-center py-8">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={fetchTransactions} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No transactions found</p>
            <p className="text-sm text-gray-400 mt-1">
              Your Rukisha payment history will appear here
            </p>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">KES {transaction.amount}</span>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {transaction.payment_method} • {formatDate(transaction.created_at)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Ref: {transaction.reference}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm">
                  {transaction.phone && (
                    <div className="text-gray-500">{transaction.phone}</div>
                  )}
                  {transaction.rukisha_reference && (
                    <div className="text-xs text-gray-400">
                      Receipt: {transaction.rukisha_reference}
                    </div>
                  )}
                  {transaction.error_message && (
                    <div className="text-xs text-red-500 mt-1">
                      {transaction.error_message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {transactions.length >= limit && (
          <div className="text-center mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Showing latest {limit} transactions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RukishaTransactionHistory;