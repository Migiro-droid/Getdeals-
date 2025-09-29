import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/NewWalletContext";
import { useWalletKyc } from "../hooks/useWalletKyc";
import { KycStatusDisplay } from "../components/KycStatusDisplay";
import { WalletActivationModal } from "../components/WalletActivationModal";
import { ArrowDownCircle, ArrowUpCircle, Wallet, RotateCcw, Shield } from "lucide-react";

export default function WalletPage() {
  const { balance, transactions, pendingTransactions, initiateDeposit, refreshWallet, resetWalletData, walletId, loading, transactionsLoading, walletData } = useWallet() as any;
  console.log('[WalletPage] Render', { walletId, walletData, loading, transactionsLoading });
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);
  const amt = Number(amount) || 0;
  
  // KYC functionality
  const { kycData, loading: kycLoading, isVerified, hasKycData, refetch: refetchKyc } = useWalletKyc();
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const handleContactSupport = () => {
    window.open('mailto:support@getdeals.co.ke', '_blank');
  };

  const handleKycSuccess = async () => {
    // Refresh both wallet and KYC data after successful activation
    await Promise.all([
      refreshWallet(),
      refetchKyc()
    ]);
    
    toast({
      title: "Welcome to your wallet!",
      description: "Your identity has been verified and wallet is fully activated. All features are now available.",
    });
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset your wallet data? This will permanently delete all incomplete transactions (pending, failed, cancelled) from the database and reset your balance display. This action cannot be undone.")) {
      try {
        await resetWalletData();
        toast({
          title: "Wallet Reset Complete",
          description: "All incomplete transactions have been permanently deleted from the database. Only completed transactions will remain.",
        });
      } catch (error) {
        console.error('Error resetting wallet data:', error);
        toast({
          title: "Reset Error",
          description: "There was an error resetting your wallet data. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7); 
    let inflow = 0;
    let outflow = 0;
    let count = 0;

    for (const t of transactions) {
      // Only count completed transactions for stats
      if (!t.created_at.startsWith(month) || t.status !== 'completed') continue;
      count++;
      // Only successful deposits should count towards inflow
      if (t.type === "deposit") inflow += t.amount;
      else outflow += t.amount;
    }
    return { inflow, outflow, count };
  }, [transactions]);

  const presets = [500, 1000, 2000, 5000];

  const onDeposit = async () => {
    if (amt < 100) {
      toast({ 
        title: "Amount Too Low", 
        description: "Minimum deposit amount is KES 100",
        variant: "destructive"
      });
      return;
    }

    if (amt > 100000) {
      toast({ 
        title: "Amount Too High", 
        description: "Maximum deposit amount is KES 100,000 per transaction",
        variant: "destructive"
      });
      return;
    }

    // Get phone number from KYC data
    const phoneNumber = kycData?.phoneNumber || (kycData as any)?.phone_number;
    
    if (!phoneNumber) {
      toast({ 
        title: "Phone Number Required", 
        description: "Please complete KYC verification to add your phone number",
        variant: "destructive"
      });
      return;
    }

    setIsDepositing(true);

    try {
      const result = await initiateDeposit({ amount: amt, phone: phoneNumber });

      if (result.success) {
        toast({
          title: '📱 STK Push Sent!',
          description: `Check your phone ${phoneNumber?.slice(-4).padStart(10, '*')} for M-Pesa prompt. Complete the payment to add KES ${amt.toLocaleString()} to your wallet.`,
          duration: 8000,
        });
        setAmount("");
        await refreshWallet();
      } else {
        toast({
          title: 'Deposit Failed',
          description: result.error || 'Unable to initiate deposit. Please try again.',
          variant: 'destructive',
          duration: 10000
        });
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: error?.message || 'An unexpected error occurred during deposit.',
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setIsDepositing(false);
    }
  };



  return (
    <div className="min-h-screen py-10 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4">
        {}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary" /> Wallet
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="text-muted-foreground">Manage your funds and transactions securely.</p>
              <span className="inline-flex items-center rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-1 text-xs font-mono tracking-wide">
                ID: {walletId || (walletData?.user_id ? 'TEMP-' + walletData.user_id.slice(0,8) : '...')}
              </span>
            </div>
          </div>

        </div>

        {/* KYC Status Display removed - users are redirected directly to wallet after KYC submission */}

        {!hasKycData && !kycLoading && (
          <div className="mb-8">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto text-amber-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Wallet Activation Required</h3>
                <p className="text-muted-foreground mb-4">
                  To use wallet features, you need to complete KYC (Know Your Customer) verification.
                  This helps us ensure the security of your account and activate your wallet instantly.
                </p>
                <Button onClick={() => setKycModalOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Start KYC Verification
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {}
        {isVerified && !kycLoading && (
          <>
            {}
            <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-4xl font-extrabold text-primary">KES {balance.toLocaleString()}</div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Inflow (This Month)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-emerald-600">
              <ArrowDownCircle className="h-6 w-6" />
              <div className="text-2xl font-bold">KES {stats.inflow.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Outflow (This Month)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-red-600">
              <ArrowUpCircle className="h-6 w-6" />
              <div className="text-2xl font-bold">KES {stats.outflow.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Manage Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <Input
                  type="number"
                  placeholder="Enter amount (KES)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={onDeposit} 
                    disabled={amt < 100 || isDepositing}
                    className="w-full"
                  >
                    {isDepositing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="h-4 w-4 mr-2" /> Deposit
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button key={p} variant="secondary" size="sm" onClick={() => setAmount(String(p))}>
                    + KES {p.toLocaleString()}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setAmount("")}>Clear</Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                   Deposits via M-Pesa STK Push • Min: KES 100 • Max: KES 100,000
                </p>
                <p className="text-xs text-muted-foreground">
                  You'll receive a payment prompt on {kycData?.phoneNumber || 'your registered phone'}
                </p>
              </div>

              {}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 How deposits work:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Click "Deposit" to send STK Push to your phone</li>
                  <li>• Enter your M-Pesa PIN when prompted</li>
                  <li>• Funds are added to your wallet within 30 seconds</li>
                  <li>• Use wallet funds for faster checkout & cashback</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="secondary" onClick={() => setAmount("1000")}>Quick Top-up: KES 1,000</Button>
              <Button variant="secondary" onClick={() => setAmount("2000")}>Quick Top-up: KES 2,000</Button>
              <Button variant="secondary" onClick={() => setAmount("5000")}>Quick Top-up: KES 5,000</Button>
            </CardContent>
          </Card>
        </div>

        {/* Pending Transactions Section */}
        {pendingTransactions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></div>
              Pending Transactions
            </h2>
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-0">
                <div className="divide-y">
                  {pendingTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
                        <div>
                          <div className="font-medium capitalize">{t.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleString()} • Awaiting confirmation
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-700">
                          +KES {t.amount.toLocaleString()}
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs border-orange-300 text-orange-700">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-2">
              Complete the M-Pesa payment on your phone to add these funds to your wallet balance.
            </p>
          </div>
        )}

        {}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-0">
              {transactions.filter(t => t.status === 'completed').length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No completed transactions yet.</div>
              ) : (
                <div className="divide-y">
                  {transactions
                    .filter(t => t.status === 'completed')
                    .map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {t.type === "deposit" ? (
                          <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium capitalize">{t.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(t.completed_at || t.created_at).toLocaleString()} {t.description ? `• ${t.description}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={t.type === "deposit" ? "text-emerald-700" : "text-red-700"}>
                          {t.type === "deposit" ? "+" : "-"} KES {t.amount.toLocaleString()}
                        </div>
                        <Badge variant="secondary" className="mt-1 text-xs">Completed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-primary">CPF</span>
          </p>
        </div>
      </div>

      {}
      <WalletActivationModal
        open={kycModalOpen}
        onOpenChange={(open) => {
          setKycModalOpen(open);
          if (!open) {
            refetchKyc();
          }
        }}
        onSuccess={handleKycSuccess}
      />

      {/* Global Loading Overlay for wallet content */}
      {isVerified && (loading || transactionsLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border bg-card shadow-xl">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="space-y-1 text-center">
              <p className="font-semibold tracking-tight">Loading your wallet</p>
              <p className="text-xs text-muted-foreground">Fetching balance, transactions & pending activities…</p>
              {walletId && <p className="text-[10px] text-muted-foreground/70 font-mono">{walletId}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
