import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  Sparkles,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ConsumerData {
  buyingFrequency: string;
  categories: string[];
  spendingPattern: string;
  incomeRange: string;
  location: string;
  occupation: string;
  sourceAwareness: string;
}

const tabVariants = [
  {
    id: 'build-basket',
    label: 'Build Your Own Basket',
    description: 'Create your perfect shopping bundle',
  },
  {
    id: 'what-you-buy',
    label: 'What Do You Always Buy?',
    description: 'Tell us your essentials',
  },
  {
    id: 'future-basket',
    label: 'Your Future Basket',
    description: 'Shape your deals',
  },
];

const categoryOptions = [
  'Essentials',
  'Appliances',
  'Electronics',
  'Back-to-School',
  'Home & Garden',
  'Personal Care',
  'Baby Products',
  'Sports & Fitness',
];

const buyingFrequencies = ['Weekly', 'Monthly', 'Seasonal', 'Festive', 'As Needed'];

const spendingPatterns = [
  'End-Month',
  'Mid-Month',
  'Weekend',
  'Crunch Time',
  'Whenever I Need',
];

const incomeRanges = [
  'Under KES 20,000',
  'KES 20,000 - 50,000',
  'KES 50,000 - 100,000',
  'KES 100,000 - 200,000',
  'Above KES 200,000',
];

const counties = [
  'Nairobi',
  'Kiambu',
  'Nakuru',
  'Kisumu',
  'Mombasa',
  'Eldoret',
  'Nyeri',
  'Other',
];

const sourceOptions = [
  'Work',
  'Church',
  'Social Media',
  'Referral',
  'Online Search',
  'Advertisement',
  'Friends & Family',
  'Other',
];

export function ConsumerInsightsEnrollment() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [selectedTabVariant, setSelectedTabVariant] = useState<string>('build-basket');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [formData, setFormData] = useState<ConsumerData>({
    buyingFrequency: '',
    categories: [],
    spendingPattern: '',
    incomeRange: '',
    location: '',
    occupation: '',
    sourceAwareness: '',
  });

  const steps = [
    { id: 'frequency', label: 'Shopping Rhythm', field: 'buyingFrequency' },
    { id: 'categories', label: 'What You Love', field: 'categories' },
    { id: 'spending', label: 'Your Pattern', field: 'spendingPattern' },
    { id: 'income', label: 'Budget Range', field: 'incomeRange' },
    { id: 'location', label: 'Your Area', field: 'location' },
    { id: 'occupation', label: 'Your Role', field: 'occupation' },
    { id: 'source', label: 'How You Found Us', field: 'sourceAwareness' },
  ];

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleNext = () => {
    const currentField = steps[currentStep].field as keyof ConsumerData;
    let isValid = false;

    if (currentField === 'categories') {
      isValid = formData.categories.length > 0;
    } else {
      isValid = !!(formData[currentField]);
    }

    if (!isValid) {
      toast({
        title: 'Please complete this field',
        description: 'All fields are required to proceed',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: 'Please sign in first',
        description: 'You need to be logged in to complete enrollment',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const preferencesData = {
        ...formData,
        tabVariant: selectedTabVariant,
        enrolledAt: new Date().toISOString(),
      };

      const result = await updateProfile({
        preferences: JSON.stringify(preferencesData),
        onboarding_completed: true,
      } as any);

      if (!result.ok) {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : (result.error as any)?.message || 'Failed to save preferences';
        throw new Error(errorMessage);
      }

      setIsCompleted(true);
      toast({
        title: 'Welcome to GET DEALS!',
        description: 'Your preferences are saved. Check your inbox for personalized deals!',
      });

      setTimeout(() => {
        setCurrentStep(0);
        setFormData({
          buyingFrequency: '',
          categories: [],
          spendingPattern: '',
          incomeRange: '',
          location: '',
          occupation: '',
          sourceAwareness: '',
        });
        setIsCompleted(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error saving preferences',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Personalize Your Experience
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sign in to unlock personalized deals and recommendations tailored to your lifestyle
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Join thousands of customers getting deals that match their lifestyle
            </p>
            <Button size="lg" className="w-full">
              Sign In to Continue
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (isCompleted) {
    return (
      <section className="py-12 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h3>
            <p className="text-gray-600">
              Your preferences are saved. Check your inbox for personalized deals!
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentStep_ = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <section className="py-12 bg-gradient-to-b from-primary/5 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            {selectedTabVariant === 'build-basket' && 'Build Your Own Basket'}
            {selectedTabVariant === 'what-you-buy' && 'What Do You Always Buy?'}
            {selectedTabVariant === 'future-basket' && 'Your Future Basket'}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Help us understand your shopping needs to deliver deals that truly matter to you
          </p>
        </div>

        {/* Tab Variants - A/B Testing */}
        {currentStep === 0 && (
          <div className="mb-8">
            <p className="text-center text-sm font-semibold text-gray-600 mb-4">
              Choose your shopping journey
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {tabVariants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedTabVariant(variant.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTabVariant === variant.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-bold text-gray-900 mb-1">{variant.label}</h3>
                  <p className="text-sm text-gray-600">{variant.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <Card className="max-w-2xl mx-auto border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-xl">
                  {currentStep_.label}
                </CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {steps.length}
                </CardDescription>
              </div>
              <Badge variant="outline">
                {currentStep + 1} / {steps.length}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </CardHeader>

          <CardContent className="pt-8">
            {/* Buying Frequency */}
            {currentStep_.id === 'frequency' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {buyingFrequencies.map(freq => (
                    <button
                      key={freq}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          buyingFrequency: freq,
                        }))
                      }
                      className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        formData.buyingFrequency === freq
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {currentStep_.id === 'categories' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select all that apply (at least 1 required)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categoryOptions.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        formData.categories.includes(category)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Spending Pattern */}
            {currentStep_.id === 'spending' && (
              <div className="space-y-3">
                {spendingPatterns.map(pattern => (
                  <button
                    key={pattern}
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        spendingPattern: pattern,
                      }))
                    }
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      formData.spendingPattern === pattern
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{pattern}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Income Range */}
            {currentStep_.id === 'income' && (
              <div className="space-y-3">
                {incomeRanges.map(range => (
                  <button
                    key={range}
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        incomeRange: range,
                      }))
                    }
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      formData.incomeRange === range
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{range}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Location */}
            {currentStep_.id === 'location' && (
              <div className="space-y-3">
                <Select
                  value={formData.location}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, location: value }))
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your county..." />
                  </SelectTrigger>
                  <SelectContent>
                    {counties.map(county => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.location === 'Other' && (
                  <Input
                    placeholder="Please specify your location"
                    className="h-12"
                  />
                )}
              </div>
            )}

            {/* Occupation */}
            {currentStep_.id === 'occupation' && (
              <div className="space-y-3">
                <Input
                  placeholder='e.g., "Teacher", "Driver", "Nurse", "Business Owner"'
                  value={formData.occupation}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      occupation: e.target.value,
                    }))
                  }
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-500">
                  This helps us understand your lifestyle and shopping patterns
                </p>
              </div>
            )}

            {/* Source Awareness */}
            {currentStep_.id === 'source' && (
              <div className="space-y-3">
                <Select
                  value={formData.sourceAwareness}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      sourceAwareness: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Where did you hear about us?" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>

          {/* Footer Actions */}
          <div className="px-6 py-6 bg-gray-50 border-t flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1 gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Complete & Save <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Benefits Preview */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-3">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Personalized Deals</h3>
            <p className="text-sm text-gray-600">
              Get offers tailored to your lifestyle
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-3">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Smart Recommendations</h3>
            <p className="text-sm text-gray-600">
              Discover products you'll actually love
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Exclusive Rewards</h3>
            <p className="text-sm text-gray-600">
              Earn points on every purchase
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
