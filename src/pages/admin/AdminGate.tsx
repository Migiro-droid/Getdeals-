import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import { User, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModals } from "@/components/AuthModals";

export default function AdminGate() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Admin access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              Please sign in to access the admin dashboard.
            </div>
            <Button className="w-full" onClick={() => setOpen(true)}>
              <LogIn className="h-4 w-4 mr-2" /> Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
      <AuthModals open={open} onOpenChange={setOpen} defaultTab="signin" />
    </div>
  );
}
