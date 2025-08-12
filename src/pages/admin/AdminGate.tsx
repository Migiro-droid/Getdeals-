import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";

export default function AdminGate() {
  const { setIsAdmin } = useAdmin();
  const [code, setCode] = useState("");
  const activate = () => {
    if (code.trim().toLowerCase() === "admin") {
      setIsAdmin(true);
    } else {
      alert("Invalid admin code (demo: 'admin')");
    }
  };
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Enter Admin Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Enter admin code (demo: admin)" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button className="w-full" onClick={activate}>Continue</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
