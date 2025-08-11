import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Phone } from "lucide-react";

interface AuthModalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModals({ open, onOpenChange, defaultTab = "signin" }: AuthModalsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign in logic here
    onOpenChange(false);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign up logic here
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-extrabold">
            Welcome to GetDeals
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">Sign in or create an account to continue</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full rounded-lg" size="lg">
                Sign In
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline">Google</Button>
                <Button type="button" variant="outline">Facebook</Button>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </p>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full rounded-lg" size="lg">
                Create Account
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline">Google</Button>
                <Button type="button" variant="outline">Facebook</Button>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}