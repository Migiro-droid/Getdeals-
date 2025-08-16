import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { AuthModals } from "./AuthModals";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredDialog({ open, onOpenChange }: AuthRequiredDialogProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-xl">Sign in required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need an account to add items to your cart. Please sign in or create an account to continue.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  setTab("signin");
                  // Close this dialog before opening the auth modal to avoid nested dialogs
                  onOpenChange(false);
                  setAuthOpen(true);
                }}
              >
                <LogIn className="h-4 w-4 mr-2" /> Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTab("signup");
                  onOpenChange(false);
                  setAuthOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Create Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AuthModals open={authOpen} onOpenChange={setAuthOpen} defaultTab={tab} />
    </>
  );
}
