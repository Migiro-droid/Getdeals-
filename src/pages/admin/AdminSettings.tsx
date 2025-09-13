import { useAdmin } from "@/contexts/AdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const { settings, updateSettings } = useAdmin();
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Site Settings</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Black Friday Promo</Label>
                  <div className="text-sm text-muted-foreground">Toggle Black Friday surfaces across the site</div>
                </div>
                <Switch checked={settings.blackFridayEnabled} onCheckedChange={(v) => updateSettings({ blackFridayEnabled: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <div className="text-sm text-muted-foreground">Show maintenance banner</div>
                </div>
                <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => updateSettings({ maintenanceMode: v })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Black Friday Countdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Countdown</Label>
                  <div className="text-sm text-muted-foreground">Show countdown timer on homepage</div>
                </div>
                <Switch checked={settings.blackFridayCountdownEnabled} onCheckedChange={(v) => updateSettings({ blackFridayCountdownEnabled: v })} />
              </div>
              <div>
                <Label htmlFor="countdown-date">Countdown Target Date</Label>
                <Input
                  id="countdown-date"
                  type="datetime-local"
                  value={new Date(settings.blackFridayCountdownDate).toISOString().slice(0, 16)}
                  onChange={(e) => updateSettings({ blackFridayCountdownDate: new Date(e.target.value).toISOString() })}
                  disabled={!settings.blackFridayCountdownEnabled}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  Set the date and time when Black Friday officially starts
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Support Phone</Label>
                <Input value={settings.supportPhone} onChange={(e) => updateSettings({ supportPhone: e.target.value })} />
              </div>
              <div>
                <Label>Support Email</Label>
                <Input type="email" value={settings.supportEmail} onChange={(e) => updateSettings({ supportEmail: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={settings.location} onChange={(e) => updateSettings({ location: e.target.value })} />
              </div>
              <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to Top</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
