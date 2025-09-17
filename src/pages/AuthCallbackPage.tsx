import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing OAuth callback...');
        console.log('Current URL:', window.location.href);
        
        // Check if we have hash fragments (implicit flow)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('Processing hash fragment authentication...');
          // Let Supabase handle the hash fragment automatically
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for Supabase to process
        }
        
        // Handle the OAuth callback session
        const { data, error } = await supabase.auth.getSession();
        
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
          
          toast({
            title: "Signed in successfully! 🎉",
            description: `Welcome ${data.session.user.user_metadata?.name || data.session.user.email}!`
          });
          
          navigate('/', { replace: true });
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

  // If user is already authenticated, redirect immediately
  useEffect(() => {
    if (user && !isProcessing) {
      console.log('User already authenticated, redirecting...');
      navigate('/', { replace: true });
    }
  }, [user, navigate, isProcessing]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {isProcessing ? "Completing sign in..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}