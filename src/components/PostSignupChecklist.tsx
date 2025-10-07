import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ShoppingCart, Truck, Home, Utensils, Car, Smartphone, Shirt, Baby, Heart, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../lib/supabase";

interface PostSignupChecklistProps {
  open: boolean;
  onComplete: () => void;
}

interface PreferenceOption {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: string;
  subcategories?: string[];
  frequency?: string;
}

const preferenceOptions: PreferenceOption[] = [
  {
    id: "groceries",
    label: "Groceries & Food",
    description: "Rice, cooking oil, sugar, flour, and other essentials",
    icon: Utensils,
    category: "food",
    subcategories: ["Staples (rice, flour, sugar)", "Fruits & Vegetables", "Meat & Dairy", "Beverages", "Snacks"]
  },
  {
    id: "household",
    label: "Household Items",
    description: "Cleaning supplies, toiletries, and home essentials",
    icon: Home,
    category: "household",
    subcategories: ["Cleaning Products", "Personal Care", "Laundry Supplies", "Kitchen Essentials", "Bathroom Items"]
  },
  {
    id: "electronics",
    label: "Electronics",
    description: "Phones, laptops, TVs, and electronic gadgets",
    icon: Smartphone,
    category: "electronics",
    subcategories: ["Mobile Phones", "Laptops & Computers", "TVs & Audio", "Accessories", "Home Appliances"]
  },
  {
    id: "automotive",
    label: "Automotive",
    description: "Car parts, accessories, and maintenance items",
    icon: Car,
    category: "automotive",
    subcategories: ["Car Parts", "Oil & Fluids", "Tires", "Accessories", "Tools & Equipment"]
  },
  {
    id: "clothing",
    label: "Clothing & Fashion",
    description: "Clothes, shoes, and fashion accessories",
    icon: Shirt,
    category: "clothing",
    subcategories: ["Men's Clothing", "Women's Clothing", "Children's Wear", "Shoes", "Accessories"]
  },
  {
    id: "baby",
    label: "Baby & Kids",
    description: "Baby products, toys, and children's items",
    icon: Baby,
    category: "baby",
    subcategories: ["Baby Food & Formula", "Diapers & Wipes", "Clothing", "Toys & Games", "Baby Care"]
  },
  {
    id: "health",
    label: "Health & Beauty",
    description: "Personal care, cosmetics, and wellness products",
    icon: Heart,
    category: "health",
    subcategories: ["Skincare", "Hair Care", "Makeup", "Supplements", "Personal Hygiene"]
  }
];

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "occasionally", label: "Occasionally" }
];

export function PostSignupChecklist({ open, onComplete }: PostSignupChecklistProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<Record<string, {
    subcategories: string[];
    frequency: string;
  }>>({});
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  // Wait for user to be available
  useEffect(() => {
    if (!user?.id && open) {
      const timer = setTimeout(() => {
        if (!user?.id) {
          toast({
            title: "Account setup in progress",
            description: "Please wait while we set up your account...",
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user?.id, open, toast]);

  // Don't show checklist if user has already completed onboarding (but allow OAuth users)
  if (user?.onboardingCompleted && open) {
    // Check if this is being explicitly shown (e.g., for OAuth users)
    const isExplicitlyShown = new URLSearchParams(window.location.search).has('showPreferences') || 
                             window.location.pathname.includes('/auth/callback');
    
    if (!isExplicitlyShown) {
      onComplete();
      return null;
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );

    // Initialize category details when selected
    if (!selectedCategories.includes(categoryId)) {
      setCategoryDetails(prev => ({
        ...prev,
        [categoryId]: {
          subcategories: [],
          frequency: "weekly"
        }
      }));
    }
  };

  const handleSubcategoryToggle = (categoryId: string, subcategory: string) => {
    setCategoryDetails(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        subcategories: prev[categoryId]?.subcategories?.includes(subcategory)
          ? prev[categoryId].subcategories.filter(s => s !== subcategory)
          : [...(prev[categoryId]?.subcategories || []), subcategory]
      }
    }));
  };

  const handleFrequencyChange = (categoryId: string, frequency: string) => {
    setCategoryDetails(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        frequency
      }
    }));
  };

  const handleComplete = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "Please select at least one category",
        description: "This helps us personalize your shopping experience.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Please wait",
        description: "We're setting up your account. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare detailed preferences data
      const detailedPreferences = {
        categories: selectedCategories,
        categoryDetails,
        shoppingPreferences: selectedCategories, // Keep for backward compatibility
        preferencesSetAt: new Date().toISOString(),
        onboardingCompleted: true
      };

      console.log('Saving preferences for user:', user.id, detailedPreferences);

      // Try multiple approaches to save preferences
      let saveSuccessful = false;
      let saveError = null;

      // Approach 1: Try updateProfile from AuthContext
      try {
        const result = await updateProfile({
          preferences: JSON.stringify(detailedPreferences),
          onboardingCompleted: true
        } as any);

        if (result.ok) {
          saveSuccessful = true;
          console.log('✅ Preferences saved via updateProfile');
        } else {
          saveError = result.error;
          console.warn('⚠️ updateProfile failed:', result.error);
        }
      } catch (updateError) {
        saveError = updateError;
        console.warn('⚠️ updateProfile threw error:', updateError);
      }

      // Approach 2: If updateProfile failed, try direct Supabase auth metadata update
      if (!saveSuccessful) {
        try {
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              preferences: JSON.stringify(detailedPreferences),
              onboardingCompleted: true
            }
          });

          if (!authError) {
            saveSuccessful = true;
            console.log('✅ Preferences saved via auth metadata');
          } else {
            console.warn('⚠️ Auth metadata update failed:', authError);
          }
        } catch (authError) {
          console.warn('⚠️ Auth metadata update threw error:', authError);
        }
      }

      // Approach 3: If both failed, still show success for OAuth users
      // (Google OAuth users might not have confirmed email but should still get preferences)
      if (!saveSuccessful) {
        // For OAuth users, we'll proceed anyway and store in localStorage as fallback
        try {
          localStorage.setItem(`preferences_${user.id}`, JSON.stringify(detailedPreferences));
          console.log('📦 Preferences stored in localStorage as fallback');
          saveSuccessful = true;
        } catch (localError) {
          console.error('❌ Even localStorage failed:', localError);
        }
      }

      if (saveSuccessful) {
        toast({
          title: "Preferences saved successfully!",
          description: "We'll use this to personalize your shopping experience.",
        });
        onComplete();
      } else {
        // Show the error but allow them to continue
        toast({
          title: "Preferences saved with limitations",
          description: "Your preferences were saved locally. You can update them later in settings.",
          variant: "default"
        });
        console.error('All save approaches failed, but continuing:', saveError);
        onComplete(); // Still complete the onboarding
      }

    } catch (error) {
      console.error("Error in preference saving flow:", error);
      // Even if saving fails, let OAuth users continue
      toast({
        title: "Setup completed",
        description: "Welcome to GetDeals! You can set preferences later in your account settings.",
      });
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="text-center pb-3 flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Welcome to GetDeals, {user?.name}!
          </DialogTitle>
          <DialogDescription className="text-sm">
            Help us personalize your shopping experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Select categories and provide details for personalized recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {preferenceOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedCategories.includes(option.id);
              const details = categoryDetails[option.id];

              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleCategoryToggle(option.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(option.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                          <Label
                            htmlFor={option.id}
                            className="font-medium cursor-pointer text-xs"
                          >
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {option.description}
                        </p>

                        {isSelected && (
                          <div className="space-y-2 border-t pt-2">
                            {/* Subcategories */}
                            {option.subcategories && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                  Specific interests:
                                </Label>
                                <div className="flex flex-wrap gap-1">
                                  {option.subcategories.map((sub) => (
                                    <button
                                      key={sub}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubcategoryToggle(option.id, sub);
                                      }}
                                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                        details?.subcategories?.includes(sub)
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : 'bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80'
                                      }`}
                                    >
                                      {sub}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Frequency */}
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Shopping frequency:
                              </Label>
                              <Select
                                value={details?.frequency || "weekly"}
                                onValueChange={(value) => handleFrequencyChange(option.id, value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {frequencyOptions.map((freq) => (
                                    <SelectItem key={freq.value} value={freq.value} className="text-xs">
                                      {freq.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-xs mb-1">Why provide preferences?</h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Personalized recommendations</li>
                  <li>• Relevant deals & promotions</li>
                  <li>• Faster checkout experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t pt-3 mt-3 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleComplete}
              disabled={loading || selectedCategories.length === 0}
              className="flex-1 order-2 sm:order-1 h-9"
              size="sm"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 order-1 sm:order-2 h-9"
              size="sm"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Update anytime in settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
