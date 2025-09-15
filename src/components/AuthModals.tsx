import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { PostSignupChecklist } from "./PostSignupChecklist";

interface AuthModalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModals({ open, onOpenChange, defaultTab = "signin" }: AuthModalsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const { signIn, signUp, resetPassword, signInWithOAuth, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setError(null);
      setLoading(false);
      setShowSignInPassword(false);
      setShowSignUpPassword(false);
      setShowChecklist(false);
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    }
  }, [open, defaultTab]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.querySelector('#signin-email') as HTMLInputElement)?.value;
    const password = (form.querySelector('#signin-password') as HTMLInputElement)?.value;
    try {
      await signIn(email, password);
  toast({ title: "Signed in successfully" });
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
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
      await signUp(name, phone, email, password);
      toast({ title: "Account created", description: "Welcome to GetDeals! A welcome SMS has been sent to your phone." });
      // Show checklist for new users (onboardingCompleted will be false by default)
      setShowChecklist(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistComplete = () => {
    setShowChecklist(false);
    onOpenChange(false);
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
      const result = await signInWithOAuth(provider);
      if (!result.ok) {
        setError(result.error || `Failed to sign in with ${provider}`);
      }
      // OAuth will redirect, so no need to close modal here
    } catch (err: any) {
      setError(err?.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white dark:bg-white border shadow-lg">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {showForgotPassword ? "Reset Password" : "Welcome to GetDeals"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              {showForgotPassword ? "Enter your email to receive a password reset link" : "Sign in or create an account to continue shopping"}
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
                  Back to Sign In
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
            <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50">
              <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="signin-email" className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 h-10 border-2 focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-xs font-medium">Password</Label>
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
                      id="signin-password"
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
                  Sign In
                </Button>
                
                <div className="flex items-center gap-2">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px bg-border flex-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleSocialLogin('google')} disabled={loading}>
                    Google
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
                    Create one now
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-2 mt-3">
              <form onSubmit={handleSignUp} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-xs font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        className="pl-7 h-9 text-sm border-2 focus:border-primary/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-phone" className="text-xs font-medium">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+254 700 123 456"
                        className="pl-7 h-9 text-sm border-2 focus:border-primary/50 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 h-9 border-2 focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pl-10 pr-10 h-9 border-2 focus:border-primary/50 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button disabled={loading} type="submit" className="w-full h-9 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all">
                  Create Account
                </Button>
                
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px bg-border flex-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleSocialLogin('google')} disabled={loading}>
                    Google
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                    Facebook
                  </Button>
                </div>
                
                <p className="text-center text-xs text-muted-foreground pt-1">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signin")}
                    className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                  >
                    Sign in instead
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <PostSignupChecklist
        open={showChecklist}
        onComplete={handleChecklistComplete}
      />
    </>
  );
}