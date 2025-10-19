import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, ShoppingCart, Clock, TrendingUp, Sparkles, 
  Package, Tag, Heart, Eye, Plus, ChevronRight, Star,
  Zap, Award, Users, Shield, Flame, Gift, RefreshCw,
  Check, Truck, ShoppingBag
} from "lucide-react";
import ChatSupportButton from '@/components/ChatSupportButton';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/contexts/ProductsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

// Basket type definition
interface ShoppingBasket {
  id: string;
  name: string;
  description: string;
  image: string;
  items: Array<{ productId: string; quantity: number }>;
  totalValue: number;
  savings: number;
  finalPrice: number;
  itemCount: number;
  badge?: string;
  isBasket?: boolean; // Track if it's a basket or single item
}

export default function HomePageRedesign() {
  const { all } = useProducts();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { settings } = useAdmin();

  // Fetch hot deals from database - products with good discounts (can be single items or baskets)
  const hotBaskets = useMemo(() => {
    if (!all || all.length === 0) return [];
    
    // Filter for products with significant savings
    const deals = all
      .filter(p => p.originalPrice && p.originalPrice > p.price) // Must have a discount
      .map(product => {
        const savings = product.originalPrice ? product.originalPrice - product.price : 0;
        const itemCount = product.items?.length || 1; // 1 for single items
        const isBasket = product.items && product.items.length > 0;
        
        // Determine badge based on savings percentage or category
        let badge = "";
        if (product.originalPrice) {
          const discountPercent = ((savings / product.originalPrice) * 100);
          if (discountPercent >= 30) badge = "Most Popular";
          else if (discountPercent >= 20) badge = "Best Value";
          else if (product.category === 'family') badge = "Business Favorite";
          else if (product.category === 'essential') badge = "Parent's Choice";
        }
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || 'Amazing deal at unbeatable prices',
          image: product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
          items: product.items?.map((item, idx) => ({ productId: item, quantity: 1 })) || [],
          totalValue: product.originalPrice || product.price,
          savings: savings,
          finalPrice: product.price,
          itemCount: itemCount,
          badge: badge,
          isBasket: isBasket // Track if it's a basket or single item
        } as ShoppingBasket & { isBasket: boolean };
      })
      .sort((a, b) => {
        // Sort by savings percentage (best deals first)
        const aPercent = a.totalValue > 0 ? (a.savings / a.totalValue) * 100 : 0;
        const bPercent = b.totalValue > 0 ? (b.savings / b.totalValue) * 100 : 0;
        return bPercent - aPercent;
      })
      .slice(0, 4); // Get top 4 hot deals
    
    return deals;
  }, [all]);

  const topSellers = useMemo(() => {
    if (!all || all.length === 0) return [];
    return all
      .filter(p => p.featured) 
      .slice(0, 8);
  }, [all]);

  // Fetch basket products for Top Sellers
  const topSellerBaskets = useMemo(() => {
    if (!all || all.length === 0) return [];
    
    // Filter for products that are baskets (contain multiple items)
    const baskets = all.filter(p => p.items && p.items.length > 0);
    
    // Sort to prioritize Premium Shopper 2 and Budget Shopper 1
    const sortedBaskets = baskets.sort((a, b) => {
      // Check if products contain "shopper" in their names
      const aIsShopper = a.name.toLowerCase().includes('shopper');
      const bIsShopper = b.name.toLowerCase().includes('shopper');
      
      // Prioritize shopper baskets
      if (aIsShopper && !bIsShopper) return -1;
      if (!aIsShopper && bIsShopper) return 1;
      
      // If both are shoppers, sort by name to get consistent ordering
      // This will put "Budget Shopper 1" before "Premium Shopper 2" alphabetically
      // But we want Premium first, so we reverse
      if (aIsShopper && bIsShopper) {
        if (a.name.toLowerCase().includes('premium')) return -1;
        if (b.name.toLowerCase().includes('premium')) return 1;
      }
      
      return 0;
    });
    
    return sortedBaskets.slice(0, 2);
  }, [all]);

  const newArrivals = useMemo(() => {
    if (!all || all.length === 0) return [];
    return all
      .filter(p => p.category !== 'alcohol' && p.category !== 'blackfriday')
      .slice(0, 8);
  }, [all]);

  const weeklyEssentials = useMemo(() => {
    if (!all || all.length === 0) return [];
    const essentialCategories = ['food-beverages', 'grocery', 'household'];
    return all
      .filter(p => essentialCategories.includes(p.category))
      .slice(0, 8);
  }, [all]);

  const specialDeals = useMemo(() => {
    if (!all || all.length === 0) return [];
    return all
      .filter(p => p.originalPrice && p.originalPrice > p.price)
      .slice(0, 8);
  }, [all]);

  const [blackFridayTimeLeft, setBlackFridayTimeLeft] = useState({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0 
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!settings.blackFridayCountdownDate) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      const targetDate = new Date(settings.blackFridayCountdownDate).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    setBlackFridayTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setBlackFridayTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.blackFridayCountdownDate]);

  const heroSlides = [
    {
      image: '/assets/IMG-20250913-WA0013.jpg',
      title: 'Fresh Groceries',
      subtitle: 'Delivered Daily',
      description: 'Quality products at unbeatable prices. Shop now!',
      badge: 'SPECIAL OFFER'
    },
    {
      image: '/assets/IMG-20250913-WA0003.jpg',
      title: 'Premium Quality',
      subtitle: 'Best Prices',
      description: 'Get the best deals on all your favorite products!',
      badge: 'BEST DEALS'
    },
    {
      image: '/assets/IMG-20250913-WA0010.jpg',
      title: 'Shop Smart',
      subtitle: 'Save More',
      description: 'Everything you need, all in one place!',
      badge: 'SAVE BIG'
    },
    {
      image: '/assets/IMG-20250913-WA0015.jpg',
      title: 'Weekly Essentials',
      subtitle: 'Stock Up Now',
      description: 'All your household needs in one basket!',
      badge: 'TOP PICKS'
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); 
    return () => clearInterval(slideTimer);
  }, [heroSlides.length]);

  const handleAddToCart = (productId: string) => {
    const product = all?.find(p => p.id === productId);
    if (product) {
      addItem(product);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    }
  };

  const handleAddBasketToCart = (basket: ShoppingBasket) => {
    // Find the actual product from the database
    const product = all?.find(p => p.id === basket.id);
    if (product) {
      addItem(product);
      toast({
        title: "Basket Added!",
        description: `${basket.name} with ${basket.itemCount} items added to cart`,
      });
    } else {
      toast({
        title: "Error",
        description: "Unable to add basket to cart",
        variant: "destructive"
      });
    }
  };

  const handleQuickView = (basket: any) => {
    // Navigate to product detail page or open a modal
    window.location.href = `/product/${basket.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Chat Support */}
      <ChatSupportButton variant="floating" labelPrimary="Chat with us on WhatsApp" />

      {/* BRAND MOTTO BANNER - "Usikwame — Angukia Deals Every Shopping" */}
      <div className="relative bg-black overflow-hidden border-b-2 border-red-600">
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-3 relative z-10">
          <div className="flex flex-col items-center text-center space-y-2">
            {/* Main Motto */}
            <div className="relative">
              {/* Glow Effect Behind Text */}
              <div className="absolute inset-0 blur-xl opacity-40">
                <span className="text-xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  Usikwame — Angukia Deals Every Shopping
                </span>
              </div>
              
              {/* Main Text */}
              <h1 className="relative text-xl md:text-3xl lg:text-4xl font-black leading-tight">
                <span className="text-white drop-shadow-lg">
                  Usikwame
                </span>
                <span className="text-gray-500 mx-2">—</span>
                <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent drop-shadow-lg">
                  Angukia Deals
                </span>
                <span className="text-yellow-400 ml-2 drop-shadow-lg">
                  Every Shopping
                </span>
              </h1>
            </div>

            {/* Accent Line with Icons */}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-red-600 fill-red-600" />
                <span className="text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  Your Shopping Partner
                </span>
                <ShoppingBag className="h-3 w-3 text-rose-600" />
              </div>
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* HERO SECTION - Naivas Inspired Clean Design */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-8">
          {/* Main Hero Carousel/Banner */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Large Featured Banner - Slideshow */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-lg shadow-lg group h-[640px]">
              {/* Slideshow Images */}
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <img 
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
              
              {/* Overlay and Content */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20">
                <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 text-white">
                  <div className="max-w-lg">
                    <p className="text-sm font-semibold text-yellow-400 mb-2 transition-all duration-500">
                      {heroSlides[currentSlide].badge}
                    </p>
                    <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-lg transition-all duration-500">
                      {heroSlides[currentSlide].title}<br />{heroSlides[currentSlide].subtitle}
                    </h2>
                    <p className="text-lg md:text-xl mb-6 text-gray-200 drop-shadow-md transition-all duration-500">
                      {heroSlides[currentSlide].description}
                    </p>
                    <Button 
                      size="lg" 
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                      asChild
                    >
                      <Link to="/products">
                        Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Slide Indicators */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 hover:bg-white/75 w-2'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Side Promotions */}
            <div className="space-y-6">
              {/* Flash Sale Card - Dynamic & Animated */}
              <Link 
                to="/products"
                className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500 p-8 text-white group cursor-pointer hover:shadow-2xl transition-all block"
              >
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Zap className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wide">Flash Sale Live</span>
                  </div>
                  <h3 className="text-4xl font-black leading-tight">
                    Save up to<br />
                    <span className="text-6xl text-yellow-300">50% OFF</span>
                  </h3>
                  <p className="text-lg font-semibold text-white/90">On thousands of products</p>
                  
                  {/* Mini Countdown */}
                  <div className="flex gap-2 mt-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                      <div className="text-2xl font-black">{String(blackFridayTimeLeft.hours).padStart(2, '0')}</div>
                      <div className="text-[10px] font-bold uppercase">Hrs</div>
                    </div>
                    <div className="text-xl self-center">:</div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                      <div className="text-2xl font-black">{String(blackFridayTimeLeft.minutes).padStart(2, '0')}</div>
                      <div className="text-[10px] font-bold uppercase">Min</div>
                    </div>
                    <div className="text-xl self-center">:</div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                      <div className="text-2xl font-black">{String(blackFridayTimeLeft.seconds).padStart(2, '0')}</div>
                      <div className="text-[10px] font-bold uppercase">Sec</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 font-bold text-lg group-hover:gap-3 transition-all">
                    Shop Now <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
                
                {/* Animated Background Elements */}
                <div className="absolute top-4 right-4 text-white/10 text-[120px] font-black transform rotate-12 group-hover:rotate-0 transition-transform">
                  %
                </div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              </Link>

              {/* New Arrivals Card - Image-Based */}
              <a
                href="#new-arrivals-section"
                onClick={(e) => {
                  e.preventDefault();
                  const section = document.getElementById('new-arrivals-section');
                  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="relative overflow-hidden rounded-2xl shadow-lg group cursor-pointer hover:shadow-2xl transition-all block"
              >
                <div className="relative h-[240px]">
                  <img 
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop"
                    alt="New Arrivals"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <div className="inline-flex items-center gap-2 bg-cyan-500 px-4 py-2 rounded-full w-fit mb-3 animate-pulse">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-black uppercase">New Arrivals</span>
                    </div>
                    <h3 className="text-3xl font-black mb-2 leading-tight">
                      Fresh<br />Products Daily
                    </h3>
                    <p className="text-sm font-semibold text-white/90 mb-3">
                      Discover the latest additions to our collection
                    </p>
                    <div className="flex items-center gap-2 font-bold group-hover:gap-3 transition-all">
                      Explore Now <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Black Friday Countdown Banner */}
          {settings.blackFridayEnabled && (
            <div className="relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl p-8 mb-8 shadow-2xl border-2 border-yellow-400">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-3xl animate-pulse delay-75"></div>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left Side - Content */}
                <div className="flex items-center gap-4 text-white">
                  <div className="bg-yellow-400 rounded-2xl p-4">
                    <Tag className="h-10 w-10 text-black" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-black mb-2">
                      🔥 BLACK FRIDAY 2025
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black mb-1">
                      <span className="text-yellow-400">BLACK</span> FRIDAY
                    </h3>
                    <p className="text-lg text-white/90 font-semibold">Up to 70% OFF Everything! 🎉</p>
                  </div>
                </div>

                {/* Right Side - Countdown with Days */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Clock className="h-5 w-5 animate-pulse" />
                    <p className="font-bold text-sm uppercase tracking-wide">Sale Starts In:</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Days */}
                    <div className="bg-yellow-400 rounded-xl px-3 py-3 text-center min-w-[60px] shadow-lg transform hover:scale-110 transition-transform">
                      <div className="text-2xl md:text-3xl font-black text-black">{String(blackFridayTimeLeft.days).padStart(2, '0')}</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-900 uppercase">Days</div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-yellow-400 self-center animate-pulse">:</div>
                    {/* Hours */}
                    <div className="bg-yellow-400 rounded-xl px-3 py-3 text-center min-w-[60px] shadow-lg transform hover:scale-110 transition-transform">
                      <div className="text-2xl md:text-3xl font-black text-black">{String(blackFridayTimeLeft.hours).padStart(2, '0')}</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-900 uppercase">Hours</div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-yellow-400 self-center animate-pulse">:</div>
                    {/* Minutes */}
                    <div className="bg-yellow-400 rounded-xl px-3 py-3 text-center min-w-[60px] shadow-lg transform hover:scale-110 transition-transform">
                      <div className="text-2xl md:text-3xl font-black text-black">{String(blackFridayTimeLeft.minutes).padStart(2, '0')}</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-900 uppercase">Mins</div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-yellow-400 self-center animate-pulse">:</div>
                    {/* Seconds */}
                    <div className="bg-yellow-400 rounded-xl px-3 py-3 text-center min-w-[60px] shadow-lg transform hover:scale-110 transition-transform">
                      <div className="text-2xl md:text-3xl font-black text-black">{String(blackFridayTimeLeft.seconds).padStart(2, '0')}</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-900 uppercase">Secs</div>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-full shadow-xl mt-2"
                    asChild
                  >
                    <Link to="/products">
                      Shop Black Friday <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <div className="container mx-auto px-4 py-8 space-y-12">

        {/* 🔥 HOT DEALS */}
        <section id="hot-deals-section" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3">
                <Flame className="h-8 w-8 text-rose-500" />
                Hot Deals
              </h2>
              <p className="text-gray-600 mt-1">Curated bundles. Maximum savings. One-click checkout.</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/baskets">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotBaskets.map((basket) => (
              <Card key={basket.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-400">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative overflow-hidden bg-gray-50">
                    <img 
                      src={basket.image} 
                      alt={basket.name}
                      className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    {basket.badge && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider shadow-lg border border-red-500/20">
                        {basket.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-lg line-clamp-1">{basket.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{basket.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Package className="h-4 w-4" />
                        {basket.itemCount} items
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600">
                          KES {basket.finalPrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          KES {basket.totalValue.toLocaleString()}
                        </span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <Tag className="h-3 w-3 mr-1" />
                        You Save KES {basket.savings.toLocaleString()}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-md"
                        onClick={() => handleAddBasketToCart(basket)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 🏆 TOP SELLERS - Featured Baskets */}
        <section className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900">Top Sellers</h2>
              <p className="text-gray-600 mt-1">Most popular curated baskets - flying off the shelves!</p>
            </div>
            <Button variant="ghost" className="text-amber-600 hover:text-amber-700" asChild>
              <Link to="/baskets">
                View All Baskets <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Baskets - Linear Professional Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topSellerBaskets.length > 0 ? topSellerBaskets.map((basket, index) => {
              const savings = basket.originalPrice ? basket.originalPrice - basket.price : 0;
              const itemCount = basket.items?.length || 0;

              return (
                <Card key={basket.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400 bg-white overflow-hidden cursor-pointer">
                  <div className="flex flex-col md:flex-row" onClick={() => handleQuickView(basket)}>
                    {/* Image Section */}
                    <div className="relative md:w-2/5 overflow-hidden bg-gray-50">
                      <img 
                        src={basket.image || 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop'}
                        alt={basket.name}
                        className="w-full h-48 md:h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      {index === 0 && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider shadow-lg border border-red-500/20">
                          🏆 #1 Best Seller
                        </Badge>
                      )}
                      {index === 1 && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider shadow-lg border border-red-500/20">
                          Premium
                        </Badge>
                      )}
                    </div>

                    {/* Content Section */}
                    <CardContent className="md:w-3/5 p-6 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-black text-xl text-gray-900 line-clamp-2">{basket.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">{basket.description || 'Curated bundle of essential items'}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold">{itemCount} Items</span>
                          </span>
                          {savings > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <Tag className="h-4 w-4" />
                              Save KES {savings.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Action */}
                      <div className="mt-4 space-y-3">
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-emerald-600">
                            KES {basket.price.toLocaleString()}
                          </span>
                          {basket.originalPrice && (
                            <span className="text-lg text-gray-400 line-through">
                              KES {basket.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black shadow-lg hover:shadow-xl transition-all text-base py-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(basket.id);
                            }}
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Add Basket
                          </Button>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="border-blue-400 hover:bg-blue-50 py-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickView(basket);
                            }}
                          >
                            <Eye className="h-5 w-5 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            }) : (
              // Fallback to hotBaskets if no database baskets found
              hotBaskets.slice(0, 2).map((basket, index) => (
                <Card key={basket.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400 bg-white overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="relative md:w-2/5 overflow-hidden bg-gray-50">
                      <img 
                        src={basket.image}
                        alt={basket.name}
                        className="w-full h-48 md:h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      {index === 0 && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider shadow-lg border border-red-500/20">
                          🏆 #1 Best Seller
                        </Badge>
                      )}
                      {basket.badge && index !== 0 && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider shadow-lg border border-red-500/20">
                          {basket.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Content Section */}
                    <CardContent className="md:w-3/5 p-6 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-black text-xl text-gray-900 line-clamp-2">{basket.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">{basket.description}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold">{basket.itemCount} items</span>
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Tag className="h-4 w-4" />
                            Save KES {basket.savings.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Action */}
                      <div className="mt-4 space-y-3">
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-emerald-600">
                            KES {basket.finalPrice.toLocaleString()}
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            KES {basket.totalValue.toLocaleString()}
                          </span>
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black shadow-lg hover:shadow-xl transition-all text-base py-6"
                          onClick={() => handleAddBasketToCart(basket)}
                        >
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Add Basket
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Additional Baskets - Compact Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {hotBaskets.slice(2, 4).map((basket) => (
              <Card key={basket.id} className="group hover:shadow-lg transition-all border hover:border-amber-300 bg-white">
                <CardContent className="p-4 flex gap-4">
                  {/* Small Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    <img 
                      src={basket.image} 
                      alt={basket.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Compact Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm line-clamp-1 mb-1">{basket.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{basket.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-emerald-600">
                          KES {basket.finalPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          KES {basket.totalValue.toLocaleString()}
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 font-bold"
                        onClick={() => handleAddBasketToCart(basket)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 🆕 NEW ARRIVALS */}
        <section id="new-arrivals-section" className="space-y-6 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900">
                New Arrivals
              </h2>
              <p className="text-gray-600 mt-1">Fresh stock just landed. Be the first to grab them!</p>
            </div>
            <Button variant="ghost" className="text-cyan-600 hover:text-cyan-700" asChild>
              <Link to="/products">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all border-2 hover:border-cyan-300 bg-white">
                <CardContent className="p-4">
                  <div className="relative mb-3">
                    <img 
                      src={product.image || '/placeholder.jpg'} 
                      alt={product.name}
                      className="w-full h-48 object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    {/* NEW Badge - Top Left Corner */}
                    <div className="absolute top-2 left-2 bg-gradient-to-br from-red-600 to-red-700 text-white px-3 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider shadow-lg border border-red-500/20">
                      NEW
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[40px]">{product.name}</h3>
                  
                  <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    In Stock
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-black text-emerald-600">
                      KES {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={() => handleAddToCart(product.id)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 🏷️ SHOP BY BRAND */}
        <section className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900">Shop by Brand</h2>
              <p className="text-gray-600 mt-1">Your favorite brands, all in one place</p>
            </div>
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900" asChild>
              <Link to="/products">
                All Brands <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-3">
            {[
              { 
                name: 'Brookside', 
                image: 'https://www.brookside.co.ke/wp-content/uploads/2022/03/Brookside-Logo.png',
                category: 'Dairy'
              },
              { 
                name: 'Tusker', 
                image: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/48/Tusker_Logo.svg/1200px-Tusker_Logo.svg.png',
                category: 'Beverages'
              },
              { 
                name: 'Kenya Cane', 
                image: 'https://images.unsplash.com/photo-1587049352846-4a222e784720?w=400&h=400&fit=crop',
                category: 'Sugar'
              },
              { 
                name: 'Pembe', 
                image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop',
                category: 'Flour'
              },
              { 
                name: 'Elianto', 
                image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
                category: 'Cooking Oil'
              },
              { 
                name: 'Ketepa', 
                image: 'https://www.ketepa.co.ke/wp-content/uploads/2020/01/Ketepa-Logo.png',
                category: 'Tea'
              },
              { 
                name: 'KCC', 
                image: 'https://upload.wikimedia.org/wikipedia/en/8/84/New_KCC_Logo.png',
                category: 'Dairy'
              },
              { 
                name: 'Mumias Sugar', 
                image: 'https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=400&h=400&fit=crop',
                category: 'Sugar'
              },
              { 
                name: 'Omo', 
                image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop',
                category: 'Detergent'
              },
              { 
                name: 'Soko', 
                image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
                category: 'Maize Meal'
              },
              { 
                name: 'Fresh Fri', 
                image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
                category: 'Cooking Oil'
              },
              { 
                name: 'Safaricom', 
                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Safaricom_Logo.svg/2560px-Safaricom_Logo.svg.png',
                category: 'Airtime'
              }
            ].map((brand) => (
              <Link 
                key={brand.name} 
                to={`/products?brand=${brand.name}`}
                className="group flex justify-center"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-white shadow-sm hover:shadow-md transition-all p-2">
                  <img 
                    src={brand.image} 
                    alt={brand.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 💥 SPECIAL DEALS FOR YOU */}
        <section id="special-deals-section" className="space-y-6 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3">
                <Zap className="h-8 w-8 text-rose-600" />
                Special Deals For You
              </h2>
              <p className="text-gray-600 mt-1">Personalized offers. Limited time. Act fast!</p>
            </div>
            
            {/* Countdown Timer */}
            <div className="flex gap-2 items-center">
              <Clock className="h-5 w-5 text-rose-600" />
              <div className="flex gap-1 text-center font-mono">
                <div className="bg-white px-2 py-1 rounded shadow-md border border-rose-200">
                  <span className="text-xl font-bold text-rose-600">{String(blackFridayTimeLeft.hours).padStart(2, '0')}</span>
                  <p className="text-xs text-gray-500">hrs</p>
                </div>
                <span className="text-2xl text-rose-600">:</span>
                <div className="bg-white px-2 py-1 rounded shadow-md border border-rose-200">
                  <span className="text-xl font-bold text-rose-600">{String(blackFridayTimeLeft.minutes).padStart(2, '0')}</span>
                  <p className="text-xs text-gray-500">min</p>
                </div>
                <span className="text-2xl text-rose-600">:</span>
                <div className="bg-white px-2 py-1 rounded shadow-md border border-rose-200">
                  <span className="text-xl font-bold text-rose-600">{String(blackFridayTimeLeft.seconds).padStart(2, '0')}</span>
                  <p className="text-xs text-gray-500">sec</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specialDeals.map((product) => {
              const discount = product.originalPrice 
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <Card key={product.id} className="group hover:shadow-lg transition-all bg-white border-2 border-rose-200 hover:border-rose-400">
                  <CardContent className="p-3">
                    <div className="relative mb-2 bg-gray-50 rounded-lg">
                      <img 
                        src={product.image || '/placeholder.jpg'} 
                        alt={product.name}
                        className="w-full h-40 object-contain rounded-lg group-hover:scale-105 transition-transform"
                      />
                      {discount > 0 && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-lg shadow-lg">
                          -{discount}%
                        </Badge>
                      )}
                      {isAuthenticated && (
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 font-bold shadow-lg">
                          Member Price
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-gray-900">
                          KES {product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {product.originalPrice && (
                        <p className="text-xs text-emerald-600 font-semibold">
                          You Save KES {(product.originalPrice - product.price).toLocaleString()}!
                        </p>
                      )}
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Grab Deal Now!
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Trust Section - Simple & Elegant */}
        <section className="p-12 md:p-16">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Why Choose Us
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 mx-auto rounded-full"></div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Secure Payments */}
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl mb-4 group-hover:bg-blue-100 transition-colors">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                M-Pesa, Cards & Wallet
              </p>
            </div>

            {/* Fast Delivery */}
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-2xl mb-4 group-hover:bg-emerald-100 transition-colors">
                <Truck className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                30 mins or free pickup
              </p>
            </div>

            {/* Quality Products */}
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 rounded-2xl mb-4 group-hover:bg-amber-100 transition-colors">
                <Award className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                100% authentic products
              </p>
            </div>

            {/* Trusted Community */}
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 rounded-2xl mb-4 group-hover:bg-purple-100 transition-colors">
                <Users className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">100K+ Customers</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Trusted nationwide
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 mb-1">24/7</p>
                <p className="text-sm text-gray-600">Support</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600 mb-1">10K+</p>
                <p className="text-sm text-gray-600">Products</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600 mb-1">30min</p>
                <p className="text-sm text-gray-600">Delivery</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600 mb-1">99%</p>
                <p className="text-sm text-gray-600">Satisfaction</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
