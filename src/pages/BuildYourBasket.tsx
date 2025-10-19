import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Calendar, Package, DollarSign, MapPin, 
  Briefcase, Radio, Gift, ArrowRight, ArrowLeft, Check,
  Sparkles, Heart, TrendingUp, Home, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserBasketPreferences } from '@/lib/basketPreferences';
import { useToast } from '@/hooks/use-toast';

interface BasketPreferences {
  shoppingFrequency: string[];
  categories: string[];
  spendingPattern: string;
  incomeRange: string;
  county: string;
  town: string;
  estate: string;
  occupation: string;
  sourceAwareness: string;
}

const STEPS = [
  { id: 1, title: "Shopping Habits", icon: ShoppingCart, color: "emerald" },
  { id: 2, title: "Your Interests", icon: Heart, color: "rose" },
  { id: 3, title: "When You Shop", icon: Calendar, color: "violet" },
  { id: 4, title: "Your Budget", icon: DollarSign, color: "amber" },
  { id: 5, title: "Location & More", icon: MapPin, color: "blue" },
];

const BuildYourBasket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState<BasketPreferences>({
    shoppingFrequency: [],
    categories: [],
    spendingPattern: '',
    incomeRange: '',
    county: '',
    town: '',
    estate: '',
    occupation: '',
    sourceAwareness: '',
  });

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const handleMultiSelect = (field: keyof BasketPreferences, value: string) => {
    const currentValues = preferences[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setPreferences({ ...preferences, [field]: newValues });
  };

  const handleSingleSelect = (field: keyof BasketPreferences, value: string) => {
    setPreferences({ ...preferences, [field]: value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Save to localStorage for now (will migrate to Supabase once table is created)
      const preferencesData = {
        userId: user?.id || 'guest',
        preferences,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem('user_basket_preferences', JSON.stringify(preferencesData));

      // If user is logged in, also try to save to database
      if (user?.id) {
        try {
          await saveUserBasketPreferences(user.id, {
            shopping_frequency: preferences.shoppingFrequency,
            categories: preferences.categories,
            spending_pattern: preferences.spendingPattern,
            income_range: preferences.incomeRange,
            county: preferences.county,
            town: preferences.town,
            estate: preferences.estate,
            occupation: preferences.occupation,
            source_awareness: preferences.sourceAwareness,
          });
        } catch (dbError) {
          // Silent fail - localStorage backup is working
          console.warn('Database save failed, using localStorage:', dbError);
        }
      }

      toast({
        title: "🎉 Asante sana!",
        description: "You've unlocked 10% off your next basket! Your personalized deals are ready.",
        className: "bg-emerald-600 text-white",
      });
      
      // Redirect to personalized homepage
      setTimeout(() => {
        navigate('/?personalized=true');
      }, 1500);

    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.shoppingFrequency.length > 0;
      case 2:
        return preferences.categories.length > 0;
      case 3:
        return preferences.spendingPattern !== '';
      case 4:
        return preferences.incomeRange !== '';
      case 5:
        return preferences.county !== '' && preferences.sourceAwareness !== '';
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-full font-bold mb-4 shadow-lg">
            <Sparkles className="inline h-5 w-5 mr-2" />
            Personalized Shopping Experience
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
            Build Your Own Basket 🧺
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tuone kama tunakujua vizuri — tell us what you love buying, and we'll create deals just for you!
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            {STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep === step.id
                        ? `bg-${step.color}-600 text-white shadow-lg scale-110`
                        : currentStep > step.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <p className="absolute top-14 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-600 whitespace-nowrap hidden md:block">
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-2 mx-2 rounded-full ${currentStep > step.id ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8 md:mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-2 border-gray-100">
          <CardContent className="p-8 md:p-12">
            
            {/* Step 1: Shopping Frequency */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-8">
                  <ShoppingCart className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    How often do you shop?
                  </h2>
                  <p className="text-gray-600">Select all that apply — we'll tailor your deals accordingly</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['Weekly', 'Monthly', 'Seasonal', 'Festive', 'Emergency', 'Bulk'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => handleMultiSelect('shoppingFrequency', freq)}
                      className={`p-6 rounded-2xl border-2 transition-all text-center font-bold ${
                        preferences.shoppingFrequency.includes(freq)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                      }`}
                    >
                      <Calendar className={`h-8 w-8 mx-auto mb-2 ${preferences.shoppingFrequency.includes(freq) ? 'text-emerald-600' : 'text-gray-400'}`} />
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Categories */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-8">
                  <Heart className="h-16 w-16 text-rose-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    What do you love buying?
                  </h2>
                  <p className="text-gray-600">Pick your favorite shopping categories</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Essentials', icon: Home },
                    { name: 'Appliances', icon: Package },
                    { name: 'Electronics', icon: TrendingUp },
                    { name: 'Fashion', icon: Star },
                    { name: 'Back-to-School', icon: Briefcase },
                    { name: 'Baby & Kids', icon: Heart },
                  ].map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleMultiSelect('categories', cat.name)}
                      className={`p-6 rounded-2xl border-2 transition-all text-center font-bold ${
                        preferences.categories.includes(cat.name)
                          ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-rose-300 hover:bg-gray-50'
                      }`}
                    >
                      <cat.icon className={`h-8 w-8 mx-auto mb-2 ${preferences.categories.includes(cat.name) ? 'text-rose-600' : 'text-gray-400'}`} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Spending Pattern */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-8">
                  <Calendar className="h-16 w-16 text-violet-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    When do you usually shop?
                  </h2>
                  <p className="text-gray-600">This helps us time our best deals for you</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: 'end-month', label: '📅 End of Month', desc: 'Salary days are shopping days' },
                    { value: 'mid-month', label: '📆 Mid-Month', desc: 'Spread your shopping' },
                    { value: 'weekend', label: '🎉 Weekends', desc: 'Saturday/Sunday shopper' },
                    { value: 'anytime', label: '⚡ Anytime', desc: 'When deals are hot!' },
                  ].map((pattern) => (
                    <button
                      key={pattern.value}
                      onClick={() => handleSingleSelect('spendingPattern', pattern.value)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        preferences.spendingPattern === pattern.value
                          ? 'border-violet-600 bg-violet-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-xl font-black mb-1">{pattern.label}</p>
                      <p className="text-sm text-gray-600">{pattern.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Income Range */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-8">
                  <DollarSign className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    What's your monthly budget?
                  </h2>
                  <p className="text-gray-600">Don't worry — this stays private and helps us show relevant deals</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: '<20k', label: 'Under KES 20,000', icon: '💰' },
                    { value: '20k-50k', label: 'KES 20,000 - 50,000', icon: '💵' },
                    { value: '50k-100k', label: 'KES 50,000 - 100,000', icon: '💸' },
                    { value: '100k+', label: 'Over KES 100,000', icon: '🤑' },
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() => handleSingleSelect('incomeRange', range.value)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        preferences.incomeRange === range.value
                          ? 'border-amber-600 bg-amber-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-3xl mb-2">{range.icon}</p>
                      <p className="text-lg font-black">{range.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Location & More */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-8">
                  <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    Almost done! Just a few more details
                  </h2>
                  <p className="text-gray-600">Help us serve you better</p>
                </div>

                <div className="space-y-4">
                  {/* County */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📍 Your County</label>
                    <select
                      value={preferences.county}
                      onChange={(e) => handleSingleSelect('county', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none font-semibold"
                    >
                      <option value="">Select your county...</option>
                      <option value="nairobi">Nairobi</option>
                      <option value="mombasa">Mombasa</option>
                      <option value="kisumu">Kisumu</option>
                      <option value="nakuru">Nakuru</option>
                      <option value="kiambu">Kiambu</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Town */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🏙️ Your Town/Area</label>
                    <input
                      type="text"
                      value={preferences.town}
                      onChange={(e) => handleSingleSelect('town', e.target.value)}
                      placeholder="e.g., Westlands, CBD, Kilimani..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none font-semibold"
                    />
                  </div>

                  {/* Occupation */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">💼 What do you do?</label>
                    <input
                      type="text"
                      value={preferences.occupation}
                      onChange={(e) => handleSingleSelect('occupation', e.target.value)}
                      placeholder="e.g., Teacher, Driver, Business Owner..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none font-semibold"
                    />
                  </div>

                  {/* Source Awareness */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📢 How did you hear about us?</label>
                    <select
                      value={preferences.sourceAwareness}
                      onChange={(e) => handleSingleSelect('sourceAwareness', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none font-semibold"
                    >
                      <option value="">Select one...</option>
                      <option value="work">Work/Office</option>
                      <option value="church">Church</option>
                      <option value="social-media">Social Media</option>
                      <option value="referral">Friend/Family Referral</option>
                      <option value="billboard">Billboard/Ad</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t-2 border-gray-100">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="font-bold"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  size="lg"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-lg"
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black shadow-lg"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Finish & Unlock Offers'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>🔒 Your data is safe and will only be used to personalize your shopping experience.</p>
          <p className="mt-1">You can edit these preferences anytime in your account settings.</p>
        </div>
      </div>
    </div>
  );
};

export default BuildYourBasket;
