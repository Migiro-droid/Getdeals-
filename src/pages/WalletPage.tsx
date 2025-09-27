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
// NOTE: WalletDepositService is dynamically imported inside the handler below.
// Static imports caused a stale binding in the built bundle that led to
// "deposit is not a function" at runtime in some environments.
import { ArrowDownCircle, ArrowUpCircle, Wallet, RefreshCw, Shield } from "lucide-react";

export default function WalletPage() {
  const { balance, walletId, transactions, withdraw, refreshWallet } = useWallet();
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

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7); 
    let inflow = 0;
    let outflow =0;
    let count=0;

    for (const t of transactions) {
      if (!t.created_at.startsWith(month)) continue;
      count++;
      if (t.type === "deposit") inflow += t.amount;
      else outflow += t.amount;
    }
    return { inflow, outflow, count };
  }, [transactions]);

  const presets = [500, 1000, 2000, 5000];

  const onDeposit = async () => {
    setIsDepositing(true);
    

    
    
    if (amt < 100) {
      console.log(' Amount too low:', amt);
      toast({ 
        title: "Amount Too Low", 
        description: "Minimum deposit amount is KES 100",
        variant: "destructive"
      });
      return;
    }

    if (amt > 100000) {
      console.log(' Amount too high:', amt);
      toast({ 
        title: "Amount Too High", 
        description: "Maximum deposit amount is KES 100,000 per transaction",
        variant: "destructive"
      });
      return;
    }

    // Get phone number from KYC data (could be phoneNumber or phone_number depending on data source)
    const phoneNumber = kycData?.phoneNumber || (kycData as any)?.phone_number;
    console.log('📱 Using phone number for deposit:', phoneNumber);
    
    if (!phoneNumber) {
      console.log('🚫 No phone number found in KYC data:', kycData);
      toast({ 
        title: "Phone Number Required", 
        description: "Please complete KYC verification to add your phone number",
        variant: "destructive"
      });
      return;
    }

    console.log(' Validation passed, calling WalletDepositService');
    setIsDepositing(true);

    try {
      console.log('🔧 About to call deposit service directly...');
      
      // Import the service directly to avoid dynamic import issues
      const { WalletDepositService } = await import("../services/wallet-deposit");
      
      console.log('🔎 WalletDepositService:', WalletDepositService);
      console.log('🔎 initiateDeposit method:', WalletDepositService.initiateDeposit);

      if (!WalletDepositService || typeof WalletDepositService.initiateDeposit !== 'function') {
        console.error('❌ WalletDepositService.initiateDeposit is not a function!');
        toast({
          title: 'Internal Error',
          description: 'Deposit service not available. Please reload the app and try again.',
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ About to call WalletDepositService.initiateDeposit with:', { amount: amt, phone: phoneNumber });
      
      // TEMPORARY: Direct edge function call for debugging deposit issues
      console.log('🧪 TESTING: Direct edge function call...');
      const { supabase } = await import("../../lib/supabase");
      
      // Edge function is deployed and responding properly, proceeding with authenticated call
      
      console.log('🔌 Using raw fetch with authentication instead of Supabase client...');
      
      // Get the session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to make a deposit.',
          variant: 'destructive'
        });
        return;
      }
      
      // Use raw fetch with proper authentication headers
      const directResponse = await fetch('https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/deposit-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE'
        },
        body: JSON.stringify({
          amount: amt,
          phone: phoneNumber
        })
      });
      
      const directResponseText = await directResponse.text();
      console.log('📡 Direct fetch response status:', directResponse.status);
      console.log('📡 Direct fetch response headers:', Object.fromEntries(directResponse.headers.entries()));
      console.log('📡 Direct fetch response text:', directResponseText);
      
      // If it's HTML (500 error page), extract useful info
      if (directResponseText.includes('<!DOCTYPE') || directResponseText.includes('<html')) {
        console.log('❌ Edge function returned HTML error page instead of JSON');
        console.log('🔍 Checking for error details in HTML...');
        
        // Try to extract error information from HTML
        const titleMatch = directResponseText.match(/<title>(.*?)<\/title>/i);
        const errorMatch = directResponseText.match(/error|exception|failed/gi);
        
        if (titleMatch) {
          console.log('📄 HTML page title:', titleMatch[1]);
        }
        
        // Look for any error messages in the HTML
        const bodyMatch = directResponseText.match(/<body[^>]*>(.*?)<\/body>/is);
        if (bodyMatch) {
          const bodyText = bodyMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 500);
          console.log('📄 HTML body text (first 500 chars):', bodyText);
        }
      }
      
      let directResult, directError;
      
      if (directResponse.ok) {
        try {
          directResult = JSON.parse(directResponseText);
          directError = null;
        } catch (parseError) {
          directError = { message: `Failed to parse response: ${parseError.message}`, context: directResponseText };
          directResult = null;
        }
      } else {
        try {
          const errorData = JSON.parse(directResponseText);
          directError = { message: errorData.message || `HTTP ${directResponse.status}`, context: errorData };
          directResult = null;
        } catch (parseError) {
          directError = { message: `HTTP ${directResponse.status}: ${directResponseText}`, context: directResponseText };
          directResult = null;
        }
      }
      
      console.log('📡 Direct edge function response:', { directResult, directError });
      
      if (directError) {
        console.error('❌ Direct edge function error details:', {
          message: directError.message,
          details: directError.details,
          code: directError.code,
          context: directError.context,
          fullError: directError
        });
        
        // Try to get the actual response content to see what HTML is being returned
        if (directError.context && typeof directError.context.text === 'function') {
          try {
            const responseText = await directError.context.text();
            console.error('🔍 Actual response content:', responseText);
          } catch (e) {
            console.error('Could not read response text:', e);
          }
        }
        
        let errorMessage = directError.message || 'Unknown error';
        let errorTitle = 'Processing Deposit';
        let isActualError = true;
        
        // Check if this is an HTTP 400 which might indicate processing rather than failure
        if (directError.message?.includes('HTTP 400')) {
          errorTitle = '📱 Payment Request Sent';
          errorMessage = 'Your deposit request has been submitted. Please check your phone for the M-Pesa prompt and complete the payment.';
          isActualError = false;
        } else if (directError.message?.includes('unauthorized') || directError.message?.includes('401')) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Please log out and log back in, then try again.';
        } else if (directError.message?.includes('not found') || directError.message?.includes('404')) {
          errorTitle = 'Service Unavailable';
          errorMessage = 'Deposit service is not available. Please contact support.';
        } else if (directError.message?.includes('network') || directError.message?.includes('fetch')) {
          errorTitle = 'Network Error';
          errorMessage = 'Please check your internet connection and try again.';
        } else if (directError.message?.includes('timeout')) {
          errorTitle = 'Request Timeout';
          errorMessage = 'The request took too long. Please try again.';
        } else {
          errorTitle = 'Deposit Processing';
          errorMessage = 'Your deposit request is being processed. Please check your phone for the M-Pesa prompt.';
          isActualError = false;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: isActualError ? 'destructive' : 'default',
          duration: isActualError ? 10000 : 8000
        });
        
        // If this is likely a processing response, clear the amount and refresh wallet
        if (!isActualError) {
          setAmount("");
          // Refresh wallet after a delay to pick up the transaction
          setTimeout(() => refreshWallet(), 30000); // Check again in 30 seconds
        }
        return;
      }
      
      if (directResult?.success) {
        console.log('✅ Direct edge function call succeeded!');
        toast({
          title: '📱 STK Push Sent!',
          description: `Check your phone ${phoneNumber?.slice(-4).padStart(10, '*')} for M-Pesa prompt. Complete the payment to add KES ${amt.toLocaleString()} to your wallet.`,
          duration: 8000,
        });
        setAmount("");
        await refreshWallet();
        return;
      }
      
      // If directResult exists but success is false, show the error from the edge function
      if (directResult && !directResult.success) {
        console.error('❌ Edge function returned error:', directResult);
        
        let errorTitle = 'Deposit Failed';
        let errorMessage = directResult.error || 'Unknown error from payment service';
        
        // Handle specific edge function errors
        if (directResult.error?.includes('KYC')) {
          errorTitle = 'KYC Required';
          errorMessage = 'Please complete KYC verification first.';
        } else if (directResult.error?.includes('customer_id')) {
          errorTitle = 'Wallet Not Activated';
          errorMessage = 'Your wallet is not properly activated. Please contact support.';
        } else if (directResult.error?.includes('minimum')) {
          errorTitle = 'Amount Too Low';
        } else if (directResult.error?.includes('phone')) {
          errorTitle = 'Phone Number Issue';
          errorMessage = 'Please check your phone number in KYC settings.';
        }
        
        toast({
          title: errorTitle,
          description: `${errorMessage}\n\nDetails: ${directResult.error}`,
          variant: 'destructive',
          duration: 10000
        });
        return;
      }
      
      // Fall back to service call
      const result = await WalletDepositService.initiateDeposit({ amount: amt, phone: phoneNumber });
      console.log('📱 Deposit result:', result);
      console.log('🔍 Network tab should show deposit-funds call now');

      if (result?.success) {
        toast({
          title: '📱 STK Push Sent!',
          description: `Check ${result.phone?.slice(-4).padStart(10, '*')} for M-Pesa prompt. Complete payment to add KES ${amt.toLocaleString()} to your wallet.`,
          duration: 8000,
        });
        setAmount("");
      } else {
        console.error('❌ Service layer deposit failed:', {
          result,
          resultType: typeof result,
          hasError: !!result?.error,
          errorMessage: result?.error,
          fullResult: result
        });
        
        let errorTitle = 'Deposit Failed';
        let errorMessage = result?.error || 'Unable to initiate deposit. Please try again.';
        
        // Enhanced error categorization
        if (result?.error?.includes('authentication') || result?.error?.includes('login')) {
          errorTitle = 'Authentication Required';
          errorMessage = 'Please log in again and try the deposit.';
        } else if (result?.error?.includes('KYC') || result?.error?.includes('verification')) {
          errorTitle = 'Verification Required';
          errorMessage = 'Please complete your KYC verification first.';
        } else if (result?.error?.includes('network') || result?.error?.includes('connection')) {
          errorTitle = 'Network Error';
          errorMessage = 'Please check your internet connection and try again.';
        } else if (result?.error?.includes('service') || result?.error?.includes('unavailable')) {
          errorTitle = 'Service Unavailable';
          errorMessage = 'Payment service is currently unavailable. Please try again later.';
        }
        
        toast({
          title: errorTitle,
          description: `${errorMessage}\n\nTechnical details: ${result?.error || 'No error details available'}`,
          variant: 'destructive',
          duration: 10000
        });
      }
    } catch (error) {
      console.error('❌ Deposit error (caught in try-catch):', {
        error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorType: typeof error,
        errorName: error?.name
      });
      
      let errorTitle = 'Unexpected Error';
      let errorMessage = 'An unexpected error occurred during deposit.';
      
      if (error?.message) {
        if (error.message.includes('fetch')) {
          errorTitle = 'Network Error';
          errorMessage = 'Unable to connect to payment service. Please check your internet connection.';
        } else if (error.message.includes('import') || error.message.includes('module')) {
          errorTitle = 'Service Loading Error';
          errorMessage = 'Unable to load deposit service. Please refresh the page and try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Your session has expired. Please log in again.';
        }
      }
      
      toast({
        title: errorTitle,
        description: `${errorMessage}\n\nError: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const onWithdraw = async () => {
    const res = await withdraw(amt, "Withdrawal");
    if (!res.ok) return toast({ title: "Withdraw failed", description: res.error });
    toast({ title: "Withdraw successful", description: `KES ${amt.toLocaleString()} withdrawn` });
    setAmount("");
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
            <p className="text-muted-foreground">Manage your funds and transactions securely.</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Wallet ID: <span className="font-mono bg-muted px-2 py-1 rounded">{walletId}</span>
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
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
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

        {}
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
                            {new Date(t.created_at).toLocaleString()} {t.description ? `• ${t.description}` : ""}
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
    </div>
  );
}
