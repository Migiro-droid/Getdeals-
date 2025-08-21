import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSupabaseWallet } from "@/contexts/SupabaseWalletContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { ArrowDownCircle, ArrowUpCircle, Wallet, RefreshCw, LogIn } from "lucide-react";

export default function SupabaseWalletPage() {
  const { balance, transactions, loading, deposit, withdraw, refreshWallet } = useSupabaseWallet();
  const { isAuthenticated } = useSupabaseAuth();
  const [amount, setAmount] = useState<string>("");
  const amt = Number(amount) || 0;

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Wallet className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>Wallet Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need to be signed in to access your wallet and manage your funds.
            </p>
            <Link to="/auth">
              <Button className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Access Wallet
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Don't have an account? You can create one on the sign in page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = React.useMemo(() => {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    let inflow = 0;
    let outflow = 0;
    let count = 0;
    
    for (const t of transactions) {
      if (!t.created_at.startsWith(month)) continue;
      count++;
      if (t.type === "deposit") inflow += Number(t.amount);
      else outflow += Number(t.amount);
    }
    return { inflow, outflow, count };
  }, [transactions]);

  const presets = [500, 1000, 2000, 5000];

  const onDeposit = async () => {
    if (amt <= 0) return;
    
    const res = await deposit(amt, "Wallet top-up");
    if (res.ok) {
      setAmount("");
    }
  };

  const onWithdraw = async () => {
    if (amt <= 0) return;
    
    const res = await withdraw(amt, "Wallet withdrawal");
    if (res.ok) {
      setAmount("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary" /> 
              Your Wallet
            </h1>
            <p className="text-muted-foreground">
              Manage your funds and pay seamlessly at checkout with wallet balance.
            </p>
          </div>
          <Button variant="outline" onClick={refreshWallet}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-4xl font-extrabold text-primary">
                KES {balance.toLocaleString()}
              </div>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                  <Button variant="outline" onClick={onWithdraw} disabled={amt <= 0 || amt > balance}>
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
              <p className="text-sm text-muted-foreground">
                Funds are securely stored in your account and can be used for purchases.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="secondary" onClick={() => setAmount("1000")}>
                Quick Top-up: KES 1,000
              </Button>
              <Button variant="secondary" onClick={() => setAmount("2000")}>
                Quick Top-up: KES 2,000
              </Button>
              <Button variant="secondary" onClick={() => setAmount("5000")}>
                Quick Top-up: KES 5,000
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No transactions yet. Start by adding funds to your wallet.
              </div>
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
                          {new Date(t.created_at).toLocaleString()} 
                          {t.description && ` • ${t.description}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={t.type === "deposit" ? "text-emerald-700" : "text-red-700"}>
                        {t.type === "deposit" ? "+" : "-"} KES {Number(t.amount).toLocaleString()}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {t.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}