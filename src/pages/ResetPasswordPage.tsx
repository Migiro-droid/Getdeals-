import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [requestingNewLink, setRequestingNewLink] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { updatePasswordAfterReset, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const validateResetToken = async () => {
      try {
        console.log('Validating password reset token...');
        console.log('Current URL:', window.location.href);
        
        // Check for error parameters first (expired token, etc.)
        const urlError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const errorCode = searchParams.get('error_code');
        
        if (urlError) {
          console.error('URL contains error:', { urlError, errorCode, errorDescription });
          
          if (errorCode === 'otp_expired' || urlError === 'access_denied') {
            setError("Password reset link has expired. Please request a new one below.");
            setIsValidToken(false);
            setIsCheckingToken(false);
            return;
          } else {
            toast({
              title: "Reset link error",
              description: errorDescription || "Invalid reset link. Please try requesting a new one.",
              variant: "destructive"
            });
            setTimeout(() => navigate('/?forgot-password=true'), 3000);
            return;
          }
        }
        
        // Check if we have hash fragments (Supabase default)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
          console.log('Found hash fragments for password reset');
          // Wait for Supabase to process the hash
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if we have a valid session for password reset
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Session error:', error);
            throw new Error('Invalid reset session: ' + error.message);
          }
          
          if (data.session) {
            console.log('Valid password reset session found');
            setIsValidToken(true);
          } else {
            throw new Error('No valid session for password reset');
          }
        } else {
          // Check URL parameters as fallback
          const accessToken = searchParams.get('access_token');
          const type = searchParams.get('type');
          
          if (accessToken && type === 'recovery') {
            console.log('Found URL parameters for password reset');
            setIsValidToken(true);
          } else {
            throw new Error('Missing or invalid reset parameters');
          }
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        toast({
          title: "Invalid reset link",
          description: "Please request a new password reset link. Link may have expired.",
          variant: "destructive"
        });
        setTimeout(() => navigate('/?forgot-password=true'), 3000);
      } finally {
        setIsCheckingToken(false);
      }
    };
    
    validateResetToken();
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePasswordAfterReset(password);
      if (result.ok) {
        toast({
          title: "Password updated",
          description: "Your password has been successfully reset."
        });
        navigate('/');
      } else {
        setError(result.error || 'Failed to update password');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      setError("Please enter your email address");
      return;
    }

    setRequestingNewLink(true);
    setError(null);
    
    try {
      const result = await resetPassword(userEmail);
      if (result.ok) {
        toast({
          title: "New reset link sent!",
          description: "Check your email (including spam folder) for the new password reset link."
        });
        setUserEmail("");
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setRequestingNewLink(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {!isValidToken && !isCheckingToken ? "Reset Link Expired" : "Reset Your Password"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isCheckingToken 
              ? "Validating reset link..." 
              : !isValidToken 
                ? "Request a new password reset link" 
                : "Enter your new password below"
            }
          </p>
        </CardHeader>
        <CardContent>
          {isCheckingToken ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Validating your reset link...</p>
            </div>
          ) : !isValidToken ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-red-600 mb-4">
                  {error || "Your password reset link has expired or is invalid."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter your email below to receive a new password reset link.
                </p>
              </div>
              
              <form onSubmit={handleRequestNewLink} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={requestingNewLink}>
                  {requestingNewLink ? "Sending..." : "Send New Reset Link"}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
