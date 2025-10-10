import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { OrganizationSetupModal } from "@/components/OrganizationSetupModal";
import { PostSignupChecklist } from "@/components/PostSignupChecklist";
import { useSyncPendingPreferences } from "@/hooks/useSyncPendingPreferences";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; isOAuthUser: boolean } | null>(null);

  // Automatically sync pending preferences from localStorage after login
  useSyncPendingPreferences();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        console.log('Current URL:', window.location.href);
        
        // Check if we have hash fragments (implicit flow) or query parameters (PKCE flow)
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        
        if (hash && hash.includes('access_token')) {
          console.log('Processing hash fragment authentication (implicit flow)...');
          // Let Supabase handle the hash fragment automatically
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for Supabase to process
        } else if (searchParams.has('code')) {
          console.log('Processing PKCE code exchange...');
          // Supabase will automatically exchange the code for a session
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for code exchange
        }
        
        // Handle the auth callback session - retry a few times if needed
        let data, error;
        let retries = 3;
        
        while (retries > 0) {
          const result = await supabase.auth.getSession();
          data = result.data;
          error = result.error;
          
          if (data.session) {
            console.log('✅ Session established successfully');
            break;
          }
          
          console.log(`⏳ No session yet, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
        }
        
        if (error) {
          console.error('OAuth callback error:', error);
          throw error;
        }

        if (data.session) {
          console.log('OAuth session established:', data.session.user.email);
          
          // Clear the hash fragment from URL
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          // Wait a moment for the AuthContext to sync
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if this is an OAuth user (Google/Facebook login)
          const isOAuthUser = data.session.user.app_metadata?.provider === 'google' || 
                             data.session.user.app_metadata?.provider === 'facebook';
          
          // Check if user has organization details
          const hasOrganizationDetails = data.session.user.user_metadata?.organization !== undefined;
          
          console.log('OAuth user:', isOAuthUser, 'Has org details:', hasOrganizationDetails);
          
          if (isOAuthUser && !hasOrganizationDetails) {
            // Show organization setup modal for OAuth users without org details
            setUserInfo({
              email: data.session.user.email!,
              isOAuthUser: true
            });
            setShowOrgSetup(true);
            setIsProcessing(false);
            
            toast({
              title: "Welcome to GetDeals! 🎉",
              description: "Please complete your organization setup to continue."
            });
          } else if (isOAuthUser && hasOrganizationDetails) {
            // OAuth user with organization details - check if preferences are needed
            const hasPreferences = data.session.user.user_metadata?.preferences || 
                                  data.session.user.user_metadata?.onboardingCompleted;
            
            setUserInfo({
              email: data.session.user.email!,
              isOAuthUser: true
            });
            setIsProcessing(false);
            
            if (!hasPreferences) {
              setShowPreferences(true);
              toast({
                title: "Welcome back! 🎉",
                description: "Let's personalize your shopping experience."
              });
            } else {
              // User has both org details and preferences, redirect to home
              toast({
                title: "Welcome back! 🎉",
                description: `Good to see you again!`
              });
              navigate('/', { replace: true });
            }
          } else {
            // Regular email/password signup user confirmed their email
            // Check if they need to set preferences
            const hasPreferences = data.session.user.user_metadata?.preferences || 
                                  data.session.user.user_metadata?.onboardingCompleted;
            
            setUserInfo({
              email: data.session.user.email!,
              isOAuthUser: false
            });
            setIsProcessing(false);
            
            if (!hasPreferences) {
              // New user who just confirmed email - show preferences
              setShowPreferences(true);
              toast({
                title: "Email confirmed! 🎉",
                description: "Welcome to GetDeals! Let's personalize your experience."
              });
            } else {
              // Returning user - just redirect
              toast({
                title: "Signed in successfully! 🎉",
                description: `Welcome back ${data.session.user.user_metadata?.name || data.session.user.email}!`
              });
              navigate('/', { replace: true });
            }
          }
        } else {
          console.log('No session found in callback');
          // If no session after a reasonable wait, redirect to home
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: "Authentication failed",
          description: "There was an error signing you in. Please try again.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    // Only process if we haven't processed yet and we're not already authenticated
    if (isProcessing) {
      handleAuthCallback();
    }
  }, [navigate, toast, isProcessing]);

  // If user is already authenticated and no setup flows are active, redirect immediately
  useEffect(() => {
    if (user && !isProcessing && !showOrgSetup && !showPreferences) {
      console.log('User already authenticated, redirecting...');
      navigate('/', { replace: true });
    }
  }, [user, navigate, isProcessing, showOrgSetup, showPreferences]);

  const handleOrganizationSetupComplete = () => {
    setShowOrgSetup(false);
    setShowPreferences(true);
    toast({
      title: "Setup complete! 🎉",
      description: "Now let's personalize your shopping experience."
    });
  };

  const handlePreferencesComplete = () => {
    setShowPreferences(false);
    toast({
      title: "All set! 🎉",
      description: "Welcome to GetDeals Kenya. You're ready to start shopping!"
    });
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isProcessing ? "Completing sign in..." : "Redirecting..."}
          </p>
        </div>
      </div>

      {/* Organization Setup Modal for OAuth users */}
      {showOrgSetup && userInfo && (
        <OrganizationSetupModal
          open={showOrgSetup}
          onComplete={handleOrganizationSetupComplete}
          userEmail={userInfo.email}
        />
      )}

      {/* Preferences Setup for OAuth users */}
      <PostSignupChecklist
        open={showPreferences}
        onComplete={handlePreferencesComplete}
      />
    </>
  );
}