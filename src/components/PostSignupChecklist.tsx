import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ShoppingCart, Truck, Home, Utensils, Car, Smartphone, Shirt, Baby, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface PostSignupChecklistProps {
  open: boolean;
  onComplete: () => void;
}

const preferenceOptions = [
  {
    id: "groceries",
    label: "Groceries & Food",
    description: "Rice, cooking oil, sugar, flour, and other essentials",
    icon: Utensils,
    category: "food"
  },
  {
    id: "household",
    label: "Household Items",
    description: "Cleaning supplies, toiletries, and home essentials",
    icon: Home,
    category: "household"
  },
  {
    id: "electronics",
    label: "Electronics",
    description: "Phones, laptops, TVs, and electronic gadgets",
    icon: Smartphone,
    category: "electronics"
  },
  {
    id: "automotive",
    label: "Automotive",
    description: "Car parts, accessories, and maintenance items",
    icon: Car,
    category: "automotive"
  },
  {
    id: "clothing",
    label: "Clothing & Fashion",
    description: "Clothes, shoes, and fashion accessories",
    icon: Shirt,
    category: "clothing"
  },
  {
    id: "baby",
    label: "Baby & Kids",
    description: "Baby products, toys, and children's items",
    icon: Baby,
    category: "baby"
  },
  {
    id: "health",
    label: "Health & Beauty",
    description: "Personal care, cosmetics, and wellness products",
    icon: Heart,
    category: "health"
  }
];

export function PostSignupChecklist({ open, onComplete }: PostSignupChecklistProps) {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const handlePreferenceToggle = (preferenceId: string) => {
    setSelectedPreferences(prev =>
      prev.includes(preferenceId)
        ? prev.filter(id => id !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handleComplete = async () => {
    if (selectedPreferences.length === 0) {
      toast({
        title: "Please select at least one preference",
        description: "This helps us personalize your shopping experience.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Store preferences in user profile
      const preferences = {
        shoppingPreferences: selectedPreferences,
        preferencesSetAt: new Date().toISOString(),
        onboardingCompleted: true
      };

      const result = await updateProfile({
        preferences: JSON.stringify(preferences)
      } as any);

      if (result.ok) {
        toast({
          title: "Preferences saved!",
          description: "We'll use this to personalize your shopping experience.",
        });
        onComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error saving preferences",
        description: "Please try again or skip for now.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Welcome to GetDeals, {user?.name}!
          </DialogTitle>
          <DialogDescription className="text-base">
            Help us personalize your shopping experience by telling us what you usually buy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Select all categories that interest you. We'll use this to show you relevant products and deals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preferenceOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedPreferences.includes(option.id);

              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handlePreferenceToggle(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={option.id}
                        checked={isSelected}
                        onChange={() => handlePreferenceToggle(option.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                          <Label
                            htmlFor={option.id}
                            className="font-medium cursor-pointer text-sm"
                          >
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm mb-1">Why share your preferences?</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Get personalized product recommendations</li>
                  <li>• See relevant deals and promotions first</li>
                  <li>• Faster checkout with suggested items</li>
                  <li>• Better curated baskets for your needs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleComplete}
              disabled={loading || selectedPreferences.length === 0}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can update your preferences anytime in your account settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
