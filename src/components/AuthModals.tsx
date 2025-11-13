import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Phone, Eye, EyeOff, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface AuthModalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // accept legacy "signin" value too and normalize internally
  defaultTab?: "login" | "signup" | "signin";
  onLoginSuccess?: () => void;
}

export function AuthModals({ open, onOpenChange, defaultTab = "login", onLoginSuccess }: AuthModalsProps) {
  // normalize any incoming "signin" to "login"
  const normalizeTab = (t?: string) => (t === "signin" ? "login" : (t as any) ?? "login");
  const [activeTab, setActiveTab] = useState(normalizeTab(defaultTab));
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const { signIn, signUp, resetPassword, signInWithOAuth, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setActiveTab(normalizeTab(defaultTab));
      setError(null);
      setLoading(false);
      setShowSignInPassword(false);
      setShowSignUpPassword(false);
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    }
  }, [open, defaultTab]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.querySelector('#login-email') as HTMLInputElement)?.value;
    const password = (form.querySelector('#login-password') as HTMLInputElement)?.value;
    try {
      await signIn(email, password);
      toast({ title: "Welcome back!" });
      onOpenChange(false);
      // Trigger post-login address check if callback provided
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const name = (form.querySelector('#signup-name') as HTMLInputElement)?.value;
    const phone = (form.querySelector('#signup-phone') as HTMLInputElement)?.value;
    const email = (form.querySelector('#signup-email') as HTMLInputElement)?.value;
    const password = (form.querySelector('#signup-password') as HTMLInputElement)?.value;
    
    // Validate phone number is provided
    if (!phone || phone.trim() === '') {
      setError('Phone number is required for account creation');
      setLoading(false);
      return;
    }
    
    try {
      await signUp(name, phone, email, password, '', '');
      toast({ 
        title: "Account created", 
        description: "Please check your email to confirm your account. The preferences section will be available after email confirmation." 
      });
      // Don't show checklist immediately - wait for email confirmation
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await resetPassword(forgotPasswordEmail);
      if (result.ok) {
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    setLoading(true);
    try {
      console.log(`Attempting ${provider} OAuth login...`);
      const result = await signInWithOAuth(provider);
      if (!result.ok) {
        console.error(`${provider} OAuth error:`, result.error);
        setError(result.error || `Failed to sign in with ${provider}`);
        setLoading(false);
      } else {
        console.log(`${provider} OAuth initiated successfully`);
        // OAuth will redirect, so loading state will be maintained
        // The callback page will handle the completion
      }
    } catch (err: any) {
      console.error(`${provider} OAuth exception:`, err);
      setError(err?.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white dark:bg-white border shadow-lg">
          <DialogHeader className="text-center pb-4 border-b">
            {/* Logo */}
            <div className="flex justify-center mb-3">
              <img 
                src="/logo.png" 
                alt="GetDeals Kenya" 
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent text-center w-full">
              {showForgotPassword ? "Reset Password" : activeTab === "signup" ? "Signup" : "Welcome to GetDeals"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              {showForgotPassword ? "Enter your email to receive a password reset link" : "Login or create an account to continue shopping"}
            </DialogDescription>
          </DialogHeader>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="forgot-email" className="text-xs font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-10 h-10 border-2 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button disabled={loading} type="submit" className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all">
                Send Reset Link
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                >
                  Back to Login
                </button>
              </p>
            </form>
          ) : (

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as typeof activeTab);
              setError(null);
            }}
            className="w-full"
          >
            {/* Only show Login tab. Sign Up is accessible via the CTA below */}
            <TabsList className="grid w-full grid-cols-1 h-10 bg-muted/50">
              <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="login-email" className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 h-10 border-2 focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs font-medium">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showSignInPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-10 border-2 focus:border-primary/50 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button disabled={loading} type="submit" className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all">
                  Login
                </Button>
                
                <div className="flex items-center gap-2">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px bg-border flex-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleSocialLogin('google')} disabled={loading} className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                    Facebook
                  </Button>
                </div>
                
                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                  >
                    Signup Now
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-2 mt-3 max-h-96 overflow-y-auto pr-3">
              <form onSubmit={handleSignUp} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-xs font-medium">Name *</Label>
                    <div className="relative">
                      <User className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        className="pl-7 h-8 text-xs border-2 focus:border-primary/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-phone" className="text-xs font-medium">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+254 700 123456"
                        className="pl-7 h-8 text-xs border-2 focus:border-primary/50 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs font-medium">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-7 h-8 text-xs border-2 focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs font-medium">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      className="pl-7 pr-8 h-8 text-xs border-2 focus:border-primary/50 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-2 top-2 h-3 w-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showSignUpPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-600 py-1">{error}</p>}
                <Button disabled={loading} type="submit" className="w-full h-8 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all">
                  Create Account
                </Button>
                
                <div className="flex items-center gap-2 py-1">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground">or sign up with</span>
                  <div className="h-px bg-border flex-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleSocialLogin('google')} disabled={loading} className="flex items-center justify-center gap-2 h-8 text-xs">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed h-8 text-xs">
                    Facebook
                  </Button>
                </div>
                
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                  >
                    Login
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
