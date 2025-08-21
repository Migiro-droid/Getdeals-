import React, { useState } from "react";
import { useSupabaseAdmin } from "@/contexts/SupabaseAdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Settings, Phone, Mail, MapPin, Sparkles } from "lucide-react";

export default function SupabaseAdminSettings() {
  const { settings, loading, updateSettings } = useSupabaseAdmin();
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local state when settings change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleDateTimeChange = (value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      black_friday_date: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  // Format the date for datetime-local input
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Settings</h1>
          </div>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Black Friday Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Black Friday Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Black Friday Promotions</Label>
                  <div className="text-sm text-muted-foreground">
                    Toggle Black Friday banners and deals across the site
                  </div>
                </div>
                <Switch
                  checked={localSettings.black_friday_enabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, black_friday_enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Black Friday Date & Time
                </Label>
                <Input
                  type="datetime-local"
                  value={formatDateForInput(localSettings.black_friday_date)}
                  onChange={(e) => handleDateTimeChange(e.target.value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  This controls the countdown timer displayed to users
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Current Status</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Promotions:</span>
                    <Badge variant={localSettings.black_friday_enabled ? "default" : "secondary"}>
                      {localSettings.black_friday_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Target Date:</span>
                    <Badge variant="outline">
                      {new Date(localSettings.black_friday_date).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Site Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Maintenance Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Show maintenance banner to all users
                  </div>
                </div>
                <Switch
                  checked={localSettings.maintenance_mode}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, maintenance_mode: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Contact & Support Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Support Phone
                  </Label>
                  <Input
                    value={localSettings.support_phone}
                    onChange={(e) =>
                      setLocalSettings(prev => ({ ...prev, support_phone: e.target.value }))
                    }
                    placeholder="+254 700 123 456"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Support Email
                  </Label>
                  <Input
                    type="email"
                    value={localSettings.support_email}
                    onChange={(e) =>
                      setLocalSettings(prev => ({ ...prev, support_email: e.target.value }))
                    }
                    placeholder="support@getdeals.co.ke"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    value={localSettings.location}
                    onChange={(e) =>
                      setLocalSettings(prev => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Karen Green, Nairobi, Kenya"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-center">
          <Button onClick={handleSave} size="lg">
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}