import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/contexts/AdminContext";
import { User } from "lucide-react";

export default function AdminGate() {
  const { login } = useAdmin();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  
  const devHint = useMemo(() => {
    const adminPin = (import.meta as any)?.env?.VITE_ADMIN_PIN ?? "1234";
    const staffPin = (import.meta as any)?.env?.VITE_STAFF_PIN ?? "1111";
    return import.meta.env.DEV ? `Admin: ${adminPin} • Staff: ${staffPin}` : null;
  }, []);

  const activate = () => {
    setError(null);
    
    // If user info form is not shown yet, validate passcode first
    if (!showUserForm) {
      const adminPin = (import.meta as any)?.env?.VITE_ADMIN_PIN ?? "1234";
      const staffPin = (import.meta as any)?.env?.VITE_STAFF_PIN ?? "1111";
      
      if (code.trim() === String(adminPin) || code.trim() === String(staffPin)) {
        setShowUserForm(true);
        return;
      } else {
        setError("Invalid passcode");
        return;
      }
    }
    
    // Now login with user info
    const userInfo = name.trim() || email.trim() ? {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
    } : undefined;
    
    const ok = login(code.trim(), userInfo);
    if (!ok) setError("Login failed");
  };

  const handleBack = () => {
    setShowUserForm(false);
    setError(null);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {showUserForm ? "User Information" : "Enter Admin Mode"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showUserForm ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="passcode">Passcode</Label>
                  <Input
                    id="passcode"
                    type="password"
                    placeholder="Enter passcode"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && activate()}
                  />
                </div>
                {devHint && <div className="text-xs text-muted-foreground">Dev hint: {devHint}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                <Button className="w-full" onClick={activate}>Continue</Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && activate()}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  This information helps identify who's logged in and is stored locally for this session only.
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={activate} className="flex-1">Login</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
