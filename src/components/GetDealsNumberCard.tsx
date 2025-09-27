import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import GetDealsNumberService, { GetDealsUser } from '../services/getdeals-number';
import { Hash, Search, User, Wallet, Copy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export const GetDealsNumberCard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userNumber, setUserNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchNumber, setSearchNumber] = useState('');
  const [searchResult, setSearchResult] = useState<GetDealsUser | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [showBackfill, setShowBackfill] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);

  // Load current user's GetDeals number
  useEffect(() => {
    loadUserNumber();
    loadStatistics();
  }, [user]);

  const loadUserNumber = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const number = await GetDealsNumberService.getCurrentUserNumber();
      setUserNumber(number);
    } catch (error) {
      console.error('Error loading GetDeals number:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await GetDealsNumberService.getNumberStatistics();
      setStatistics(stats);
      
      // Show backfill option if there are users without numbers
      setShowBackfill(stats.profiles_without_numbers > 0);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchNumber.trim()) return;
    
    try {
      setSearchLoading(true);
      setSearchResult(null);
      
      const result = await GetDealsNumberService.getUserByNumber(searchNumber.trim());
      setSearchResult(result);
      
      if (!result) {
        toast({
          title: 'Not Found',
          description: 'No user found with that GetDeals number',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Search Error',
        description: error.message || 'Failed to search for user',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast({
      title: 'Copied!',
      description: 'GetDeals number copied to clipboard',
    });
  };

  const handleBackfill = async () => {
    try {
      setBackfillLoading(true);
      
      const results = await GetDealsNumberService.backfillNumbers();
      
      toast({
        title: 'Backfill Complete',
        description: `${results.length} users were assigned GetDeals numbers`,
      });
      
      // Refresh statistics
      await loadStatistics();
    } catch (error: any) {
      toast({
        title: 'Backfill Error',
        description: error.message || 'Failed to run backfill process',
        variant: 'destructive',
      });
    } finally {
      setBackfillLoading(false);
    }
  };

  const formatNumber = (number: string) => {
    return GetDealsNumberService.formatNumber(number);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            GetDeals Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-4xl">
      {/* Current User's GetDeals Number */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Your GetDeals Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              {userNumber ? (
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-mono font-bold text-green-600">
                    {formatNumber(userNumber)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyNumber(userNumber)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Badge variant="default">Active</Badge>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your GetDeals number is being generated. Please refresh in a moment.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-sm text-gray-600">
                <p>Use this number to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Receive payments and transfers</li>
                  <li>Identify your wallet transactions</li>
                  <li>Access customer support</li>
                  <li>Link with external services</li>
                </ul>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to view your GetDeals number.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Search Users by GetDeals Number */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find User by GetDeals Number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-number">GetDeals Number</Label>
              <Input
                id="search-number"
                placeholder="GD-123456"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Search className="w-4 h-4 mr-1" />
                )}
                Search
              </Button>
            </div>
          </div>

          {searchResult && (
            <div className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{searchResult.full_name || 'Unknown User'}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Email: {searchResult.email}</p>
                    {searchResult.phone && <p>Phone: {searchResult.phone}</p>}
                    {searchResult.organization && <p>Organization: {searchResult.organization}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-500" />
                    <span>Balance: KSh {searchResult.wallet_balance?.toFixed(2) || '0.00'}</span>
                    <Badge variant={searchResult.wallet_active ? "default" : "secondary"}>
                      {searchResult.wallet_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-green-600">
                    {formatNumber(searchResult.getdeals_number)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyNumber(searchResult.getdeals_number)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              GetDeals Number Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.total_profiles}
                </div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.profiles_with_numbers}
                </div>
                <div className="text-sm text-gray-600">With Numbers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.profiles_without_numbers}
                </div>
                <div className="text-sm text-gray-600">Without Numbers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.total_wallets}
                </div>
                <div className="text-sm text-gray-600">Total Wallets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {statistics.wallets_with_numbers}
                </div>
                <div className="text-sm text-gray-600">Linked Wallets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">
                  {statistics.coverage_percentage}%
                </div>
                <div className="text-sm text-gray-600">Coverage</div>
              </div>
            </div>

            {showBackfill && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-800">Backfill Required</h4>
                    <p className="text-sm text-yellow-700">
                      {statistics.profiles_without_numbers} users need GetDeals numbers assigned.
                    </p>
                  </div>
                  <Button
                    onClick={handleBackfill}
                    disabled={backfillLoading}
                    variant="outline"
                  >
                    {backfillLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Run Backfill
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Format Information */}
      <Card>
        <CardHeader>
          <CardTitle>GetDeals Number Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="font-mono bg-gray-100 px-2 py-1 rounded">GD-XXXXXX</div>
              <span className="text-sm text-gray-600">Standard format (6 digits)</span>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Format Rules:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Prefix: "GD-" (GetDeals)</li>
                <li>6 digits, zero-padded</li>
                <li>Sequential numbering starting from 100001</li>
                <li>Unique across all users</li>
                <li>Permanent identifier (never changes)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};