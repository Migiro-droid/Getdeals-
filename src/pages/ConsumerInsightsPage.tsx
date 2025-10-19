import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Home,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TabVariant {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

interface ConsumerData {
  buyingFrequency: string;
  categories: string[];
  spendingPattern: string;
  incomeRange: string;
  location: string;
  occupation: string;
  sourceAwareness: string;
}

const tabVariants: TabVariant[] = [
  {
    id: 'build-basket',
    label: 'Build Your Own Basket',
    description: 'Curate your perfect shopping bundle tailored to your needs',
    emoji: '',
  },
  {
    id: 'what-you-buy',
    label: 'What Do You Always Buy?',
    description: 'Tell us about your essentials and favorites',
    emoji: '',
  },
  {
    id: 'future-basket',
    label: 'Your Future Basket',
    description: 'Shape your deals based on your lifestyle',
    emoji: '',
  },
];

const buyingFrequencies = ['Weekly', 'Monthly', 'Seasonal', 'Festive', 'As Needed'];
const categoryOptions = [
  'Groceries',
  'Household',
  'Fresh & Natural',
  'Health & Beauty',
  'Electronics',
  'Appliances',
  'Cleaning',
  'Furnishing & Furniture',
  'Automotive',
  'Accessories',
];
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
  'Kajiado',
  'Machakos',
  'Kisii',
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

interface EnrollmentStep {
  id: string;
  title: string;
  description: string;
}

const enrollmentSteps: EnrollmentStep[] = [
  { id: 'intro', title: 'Welcome', description: 'Choose your journey' },
  { id: 'buying-frequency', title: 'Shopping Rhythm', description: 'How often do you shop?' },
  { id: 'categories', title: 'What You Love', description: 'Select your categories' },
  { id: 'spending-pattern', title: 'Your Pattern', description: 'When do you spend?' },
  { id: 'income-range', title: 'Budget Range', description: 'Your spending capacity' },
  { id: 'location', title: 'Your Area', description: 'Where are you located?' },
  { id: 'occupation', title: 'Your Role', description: 'What do you do?' },
  { id: 'source-awareness', title: 'How You Found Us', description: 'Where did you hear about us?' },
];

export default function ConsumerInsightsPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTabVariant, setSelectedTabVariant] = useState<string>('build-basket');
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-black text-gray-900 mb-3">
              Personalize Your Experience
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in to unlock personalized deals tailored to your lifestyle
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
                Sign In to GET DEALS
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const validateCurrentStep = (): boolean => {
    const step = enrollmentSteps[currentStep].id;

    switch (step) {
      case 'intro':
        return true;
      case 'buying-frequency':
        return !!formData.buyingFrequency;
      case 'categories':
        return formData.categories.length > 0;
      case 'spending-pattern':
        return !!formData.spendingPattern;
      case 'income-range':
        return !!formData.incomeRange;
      case 'location':
        return !!formData.location;
      case 'occupation':
        return !!formData.occupation;
      case 'source-awareness':
        return !!formData.sourceAwareness;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast({
        title: 'Please complete this field',
        description: 'All fields are required to proceed',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep < enrollmentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
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
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : (result.error as any)?.message || 'Failed to save preferences';
        throw new Error(errorMessage);
      }

      setIsCompleted(true);
      toast({
        title: 'Welcome to GET DEALS!',
        description: 'Your preferences are saved. Expect personalized deals!',
      });

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error saving preferences',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3">You're All Set!</h2>
            <p className="text-gray-600 mb-8">
              Your preferences are saved. Check your inbox for personalized deals!
            </p>
            <p className="text-sm text-gray-500">Redirecting to home in 3 seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = enrollmentSteps[currentStep];
  const progress = ((currentStep + 1) / enrollmentSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <span className="text-sm font-semibold text-gray-600">
            Step {currentStep + 1} of {enrollmentSteps.length}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Step Content */}
        <div className="max-w-3xl mx-auto">
          {/* Introduction Step */}
          {currentStepData.id === 'intro' && (
            <div className="text-center mb-12">
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                  Welcome to GET DEALS
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Help us understand your shopping needs to deliver deals that truly matter to you
                </p>
              </div>

              {/* Tab Variants */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-600">
                  Choose your shopping journey
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-12">
                  {tabVariants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedTabVariant(variant.id);
                        setCurrentStep(1);
                      }}
                      className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        selectedTabVariant === variant.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <h3 className="font-bold text-gray-900 mb-2">{variant.label}</h3>
                      <p className="text-sm text-gray-600">{variant.description}</p>
                    </button>
                  ))}
                </div>

                {/* Benefits Preview */}
                <div className="grid md:grid-cols-3 gap-4 mt-12 pt-12 border-t">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-3">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Personalized Deals</h4>
                    <p className="text-sm text-gray-600">
                      Offers tailored to your lifestyle
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-3">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Smart Recommendations</h4>
                    <p className="text-sm text-gray-600">
                      Discover products you'll love
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-3">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Exclusive Rewards</h4>
                    <p className="text-sm text-gray-600">
                      Earn points on purchases
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Steps */}
          {currentStepData.id !== 'intro' && (
            <Card className="border-0 shadow-xl mb-8">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {currentStepData.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 text-lg py-2 px-3">
                    {currentStep + 1}/{enrollmentSteps.length}
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
                {currentStepData.id === 'buying-frequency' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {buyingFrequencies.map(freq => (
                      <button
                        key={freq}
                        onClick={() =>
                          setFormData(prev => ({ ...prev, buyingFrequency: freq }))
                        }
                        className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                          formData.buyingFrequency === freq
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                )}

                {/* Categories */}
                {currentStepData.id === 'categories' && (
                  <div>
                    <p className="text-sm text-gray-600 mb-6">
                      Select all that apply (minimum 1 required)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {categoryOptions.map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategoryToggle(category)}
                          className={`p-4 rounded-lg border-2 font-semibold text-sm transition-all ${
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
                {currentStepData.id === 'spending-pattern' && (
                  <div className="space-y-3">
                    {spendingPatterns.map(pattern => (
                      <button
                        key={pattern}
                        onClick={() =>
                          setFormData(prev => ({ ...prev, spendingPattern: pattern }))
                        }
                        className={`w-full p-4 rounded-lg border-2 text-left font-semibold transition-all ${
                          formData.spendingPattern === pattern
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 text-gray-900 hover:border-gray-300'
                        }`}
                      >
                        {pattern}
                      </button>
                    ))}
                  </div>
                )}

                {/* Income Range */}
                {currentStepData.id === 'income-range' && (
                  <div className="space-y-3">
                    {incomeRanges.map(range => (
                      <button
                        key={range}
                        onClick={() =>
                          setFormData(prev => ({ ...prev, incomeRange: range }))
                        }
                        className={`w-full p-4 rounded-lg border-2 text-left font-semibold transition-all ${
                          formData.incomeRange === range
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 text-gray-900 hover:border-gray-300'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                )}

                {/* Location */}
                {currentStepData.id === 'location' && (
                  <div className="space-y-4">
                    <Select
                      value={formData.location}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, location: value }))
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
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
                        className="h-12 text-base"
                      />
                    )}
                  </div>
                )}

                {/* Occupation */}
                {currentStepData.id === 'occupation' && (
                  <div className="space-y-4">
                    <Input
                      placeholder='e.g., "Teacher", "Driver", "Nurse", "Business Owner"'
                      value={formData.occupation}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, occupation: e.target.value }))
                      }
                      className="h-12 text-base"
                    />
                    <p className="text-xs text-gray-500">
                      This helps us understand your lifestyle and shopping patterns
                    </p>
                  </div>
                )}

                {/* Source Awareness */}
                {currentStepData.id === 'source-awareness' && (
                  <div className="space-y-4">
                    <Select
                      value={formData.sourceAwareness}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, sourceAwareness: value }))
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
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
                  onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))}
                  disabled={currentStep === 0}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {currentStep === enrollmentSteps.length - 1 ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
