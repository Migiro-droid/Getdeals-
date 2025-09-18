import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletKyc } from "../hooks/useWalletKyc";
import { KycStatusDisplay } from "../components/KycStatusDisplay";
import { WalletActivationModal } from "../components/WalletActivationModal";
import { ArrowDownCircle, ArrowUpCircle, Wallet, RefreshCw, Shield } from "lucide-react";

export default function WalletPage() {
  const { balance, walletId, transactions, deposit, withdraw, reset } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const amt = Number(amount) || 0;
  
  // Check KYC status
  const { kycData, loading: kycLoading, isVerified, hasKycData, refetch: refetchKyc } = useWalletKyc();
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const handleContactSupport = () => {
    window.open('mailto:support@getdeals.co.ke', '_blank');
  };

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    let inflow = 0;
    let outflow = 0;
    let count = 0;
    for (const t of transactions) {
      if (!t.date.startsWith(month)) continue;
      count++;
      if (t.type === "deposit") inflow += t.amount;
      else outflow += t.amount;
    }
    return { inflow, outflow, count };
  }, [transactions]);

  const presets = [500, 1000, 2000, 5000];

  const onDeposit = () => {
    const res = deposit(amt, "Top up");
    if (!res.ok) return toast({ title: "Deposit failed", description: res.error });
    toast({ title: "Deposit successful", description: `KES ${amt.toLocaleString()} added to wallet` });
    setAmount("");
  };

  const onWithdraw = () => {
    const res = withdraw(amt, "Withdrawal");
    if (!res.ok) return toast({ title: "Withdraw failed", description: res.error });
    toast({ title: "Withdraw successful", description: `KES ${amt.toLocaleString()} withdrawn` });
    setAmount("");
  };

  return (
    <div className="min-h-screen py-10 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary" /> Wallet
            </h1>
            <p className="text-muted-foreground">Use funds to pay seamlessly at checkout.</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Wallet ID: <span className="font-mono bg-muted px-2 py-1 rounded">{walletId}</span>
          </div>
        </div>

        {/* KYC Status Check - Show appropriate message if user has submitted KYC but not verified */}
        {hasKycData && !isVerified && (
          <div className="mb-8">
            <KycStatusDisplay 
              kycData={kycData} 
              loading={kycLoading}
              onRetry={refetchKyc}
              onContactSupport={handleContactSupport}
            />
          </div>
        )}

        {/* Show KYC requirement if no KYC data submitted */}
        {!hasKycData && (
          <div className="mb-8">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto text-amber-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Wallet Activation Required</h3>
                <p className="text-muted-foreground mb-4">
                  To use wallet features, you need to complete KYC (Know Your Customer) verification.
                  This helps us ensure the security of your account.
                </p>
                <Button onClick={() => setKycModalOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Start KYC Verification
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Wallet Features - Only show for verified users */}
        {isVerified && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-4xl font-extrabold text-primary">KES {balance.toLocaleString()}</div>
              <Button variant="outline" size="sm" onClick={() => reset()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reset
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

        {/* Actions */}
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
                  <Button onClick={onDeposit} disabled={amt <= 0}>
                    <ArrowDownCircle className="h-4 w-4 mr-2" /> Deposit
                  </Button>
                  <Button variant="outline" onClick={onWithdraw} disabled={amt <= 0}>
                    <ArrowUpCircle className="h-4 w-4 mr-2" /> Withdraw
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
              <p className="text-sm text-muted-foreground">Funds are stored locally for demo purposes.</p>
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

        {/* Transactions */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No transactions yet.</div>
              ) : (
                <div className="divide-y">
                  {transactions.map((t) => (
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
                            {new Date(t.date).toLocaleString()} {t.note ? `• ${t.note}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={t.type === "deposit" ? "text-emerald-700" : "text-red-700"}>
                          {t.type === "deposit" ? "+" : "-"} KES {t.amount.toLocaleString()}
                        </div>
                        <Badge className="mt-1">KES</Badge>
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

        {}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-primary">CPF</span>
          </p>
        </div>
      </div>

      {/* KYC Activation Modal */}
      <WalletActivationModal 
        open={kycModalOpen} 
        onOpenChange={(open) => {
          setKycModalOpen(open);
          // Refetch KYC data when modal closes
          if (!open) {
            refetchKyc();
          }
        }} 
      />
    </div>
  );
}
