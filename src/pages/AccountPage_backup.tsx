import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut } from "lucide-react";

export default function AccountPage() {
  const { user, signOut } = useSupabaseAuth();

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Please sign in</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You need to be signed in to access your account.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Email</h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">User ID</h3>
              <p className="text-muted-foreground text-xs">{user.id}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Account Created</h3>
              <p className="text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={signOut}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Note</h3>
              <p className="text-sm text-muted-foreground">
                This is a simplified account page for the Supabase migration. 
                Advanced features like password change and 2FA will be added in future updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
