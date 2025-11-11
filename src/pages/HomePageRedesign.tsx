import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, ShoppingCart, Clock, TrendingUp, Sparkles, 
  Package, Tag, Heart, Eye, Plus, ChevronRight, Star,
  Zap, Award, Users, Shield, Flame, Gift, RefreshCw,
  Check, Truck, ShoppingBag, X, Trophy
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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

// Counter Component with animation
interface CounterProps {
  target: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

function Counter({ target, suffix = "", duration = 2000, className = "" }: CounterProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      const currentCount = Math.floor(easeOutQuad * target);
      
      setCount(currentCount);

      if (progress === 1) {
        clearInterval(interval);
        setCount(target);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [hasStarted, target, duration]);

  useEffect(() => {
    // Trigger animation when component mounts and becomes visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("counter-" + target);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [hasStarted, target]);

  return (
    <span id={"counter-" + target} className={className}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HomePageRedesign() {
  const { all } = useProducts();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { settings } = useAdmin();

  // Define which baskets are sold out
  const soldOutBasketNames = new Set([
    "Smart Family Saver ( Ujanja ni Kusave)",
    "Budget stretch (Kaa steady)"
  ]);

  // Hot Deals - products marked as isHotDeal ONLY (no other promotional flags)
  const promotionalHotDeals = useMemo(() => {
    if (!all || all.length === 0) return [];
    
    const filtered = all.filter(p => 
      (p as any).isHotDeal === true && 
      (p as any).isNewArrival !== true && 
      (p as any).isSpecialDeal !== true && 
      (p as any).isTopBasket !== true
    );
    console.log('🔥 Hot Deals filtered:', filtered.length, 'products with ONLY isHotDeal=true out of', all.length, 'total products');
    
    return filtered
      .map(product => {
        const savings = product.originalPrice ? product.originalPrice - product.price : 0;
        const itemCount = product.items?.length || 1;
        const isBasket = product.items && product.items.length > 0;
        
        const discountPercent = product.originalPrice ? ((savings / product.originalPrice) * 100) : 0;
        let badge = "Hot Deal";
        if (discountPercent >= 30) badge = "Mega Deal";
        else if (discountPercent >= 20) badge = "Great Savings";
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || 'Incredible savings on this item',
          image: product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
          items: product.items?.map((item, idx) => ({ productId: item, quantity: 1 })) || [],
          itemsDetail: (product as any).itemsDetail || [], // Include itemsDetail from product
          totalValue: product.originalPrice || product.price,
          savings: savings,
          finalPrice: product.price,
          itemCount: itemCount,
          badge: badge,
          isBasket: isBasket
        } as ShoppingBasket & { isBasket: boolean };
      })
      .slice(0, 6); // Hot Deals: Show up to 6 items
  }, [all]);

  // New Arrivals - products marked as isNewArrival ONLY (no other promotional flags)
  const promotionalNewArrivals = useMemo(() => {
    if (!all || all.length === 0) return [];
    
    const filtered = all.filter(p => 
      (p as any).isNewArrival === true && 
      (p as any).isHotDeal !== true && 
      (p as any).isSpecialDeal !== true && 
      (p as any).isTopBasket !== true
    );
    
    console.log('✨ New Arrivals filtered:', filtered.length, 'products with ONLY isNewArrival=true');
    console.log('✨ New Arrivals products:', filtered.map(p => ({
      name: p.name,
      isTopBasket: (p as any).isTopBasket,
      isHotDeal: (p as any).isHotDeal,
      isNewArrival: (p as any).isNewArrival,
      isSpecialDeal: (p as any).isSpecialDeal
    })));
    
    return filtered
      .map(product => {
        const savings = product.originalPrice ? product.originalPrice - product.price : 0;
        const itemCount = product.items?.length || 1;
        const isBasket = product.items && product.items.length > 0;
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || 'Latest arrival to our collection',
          image: product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
          items: product.items?.map((item, idx) => ({ productId: item, quantity: 1 })) || [],
          itemsDetail: (product as any).itemsDetail || [], // Include itemsDetail from product
          totalValue: product.originalPrice || product.price,
          savings: savings,
          finalPrice: product.price,
          itemCount: itemCount,
          badge: "New Arrival",
          isBasket: isBasket
        } as ShoppingBasket & { isBasket: boolean };
      })
      .slice(0, 12); // New Arrivals: Show up to 12 items
  }, [all]);

  // Special Deals - products marked as isSpecialDeal ONLY (no other promotional flags)
  const promotionalSpecialDeals = useMemo(() => {
    if (!all || all.length === 0) return [];
    
    return all
      .filter(p => 
        (p as any).isSpecialDeal === true && 
        (p as any).isHotDeal !== true && 
        (p as any).isNewArrival !== true && 
        (p as any).isTopBasket !== true
      )
      .map(product => {
        const savings = product.originalPrice ? product.originalPrice - product.price : 0;
        const itemCount = product.items?.length || 1;
        const isBasket = product.items && product.items.length > 0;
        
        const discountPercent = product.originalPrice ? ((savings / product.originalPrice) * 100) : 0;
        let badge = "Special Deal";
        if (discountPercent >= 25) badge = "Limited Time";
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || 'Special offer available now',
          image: product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
          items: product.items?.map((item, idx) => ({ productId: item, quantity: 1 })) || [],
          itemsDetail: (product as any).itemsDetail || [], // Include itemsDetail from product
          totalValue: product.originalPrice || product.price,
          savings: savings,
          finalPrice: product.price,
          itemCount: itemCount,
          badge: badge,
          isBasket: isBasket
        } as ShoppingBasket & { isBasket: boolean };
      })
      .slice(0, 12); // Special Deals: Show up to 12 items
  }, [all]);

  // Fetch hot deals from database - specific baskets from the request
  const hotBaskets = useMemo(() => {
    if (!all || all.length === 0) return [];
    
    // Target basket names as specified
    const targetBaskets = [
      "Mid month Top-up ( Katikati ya Mwezi)",
      "Jipange Pack (Starter Pack)",
      "Family Refill Basket( Jamii Pack)",
      "Usafi ProMax"
    ];
    
    // Filter for products that match the target basket names
    const deals = all
      .filter(p => {
        // Check if product name matches any of the target baskets or contains "basket/pack"
        return targetBaskets.some(basket => 
          p.name.toLowerCase().includes(basket.toLowerCase())
        ) || (p.items && p.items.length > 0); // Fallback: any product with items
      })
      .map(product => {
        const savings = product.originalPrice ? product.originalPrice - product.price : 0;
        const itemCount = product.items?.length || 1;
        const isBasket = product.items && product.items.length > 0;
        
        // Determine badge based on basket type
        let badge = "";
        if (product.name.includes("Starter")) badge = "Starter Deal";
        else if (product.name.includes("Family")) badge = "Family Choice";
        else if (product.name.includes("Usafi")) badge = "Premium Care";
        else if (product.name.includes("Top-up")) badge = "Mid-Month Special";
        else if (product.originalPrice) {
          const discountPercent = ((savings / product.originalPrice) * 100);
          if (discountPercent >= 30) badge = "Most Popular";
          else if (discountPercent >= 20) badge = "Best Value";
        }
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || 'Curated basket with amazing savings',
          image: product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
          items: product.items?.map((item, idx) => ({ productId: item, quantity: 1 })) || [],
          totalValue: product.originalPrice || product.price,
          savings: savings,
          finalPrice: product.price,
          itemCount: itemCount,
          badge: badge,
          isBasket: isBasket
        } as ShoppingBasket & { isBasket: boolean };
      })
      .slice(0, 4); // Get top 4 baskets
    
    return deals;
  }, [all]);

  const topSellers = useMemo(() => {
    if (!all || all.length === 0) return [];
    return all
      .filter(p => p.featured) 
      .slice(0, 8);
  }, [all]);

  // Fetch basket products for Top Sellers - products marked as isTopBasket ONLY (no other promotional flags)
  const topSellerBaskets = useMemo(() => {
    if (!all || all.length === 0) return [];
    
    // Filter for products that have isTopBasket flag and NO other promotional flags
    const filteredBaskets = all.filter(p => 
      (p as any).isTopBasket === true &&
      (p as any).isHotDeal !== true &&
      (p as any).isNewArrival !== true &&
      (p as any).isSpecialDeal !== true
    );
    
    console.log('🏆 Top Baskets filtered:', filteredBaskets.length, 'products with ONLY isTopBasket=true');
    console.log('🏆 Top Baskets products:', filteredBaskets.map(p => ({
      name: p.name,
      isTopBasket: (p as any).isTopBasket,
      isHotDeal: (p as any).isHotDeal,
      isNewArrival: (p as any).isNewArrival,
      isSpecialDeal: (p as any).isSpecialDeal
    })));
    
    // Sort to prioritize Premium Shopper 2 and Budget Shopper 1 (create new array to avoid mutation)
    const sortedBaskets = [...filteredBaskets].sort((a, b) => {
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
    
    return sortedBaskets.slice(0, 5);
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

  // Force re-render when settings change (brands, enabled status, etc.)
  const [, setSettingsVersion] = useState(0);
  useEffect(() => {
    // Trigger re-render when settings change
    setSettingsVersion(v => v + 1);
  }, [settings.brands, settings.shopByBrandEnabled]);

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

  // Quick view modal state for Top Sellers
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState<ShoppingBasket | null>(null);

  const openQuickViewModal = (basket: ShoppingBasket) => {
    setSelectedBasket(basket);
    setIsQuickViewOpen(true);
  };

  const closeQuickViewModal = () => {
    setIsQuickViewOpen(false);
    setSelectedBasket(null);
  }

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); 
    return () => clearInterval(slideTimer);
  }, [heroSlides.length]);

  const handleAddToCart = (productId: string) => {
    const product = all?.find(p => p.id === productId);
    if (product) {
      // Check if product/basket is sold out - show modal instead
      if (soldOutBasketNames.has(product.name)) {
        openQuickViewModal(topSellerBaskets.find(b => b.id === productId) || {
          id: productId,
          name: product.name,
          description: product.description || '',
          image: product.image,
          items: product.items?.map(item => ({ productId: item, quantity: 1 })) || [],
          totalValue: product.originalPrice || product.price,
          savings: (product.originalPrice || 0) - product.price,
          finalPrice: product.price,
          itemCount: product.items?.length || 1,
          isBasket: (product.items?.length || 0) > 0
        });
        return;
      }
      
      addItem(product);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    }
  };

  const handleAddBasketToCart = (basket: ShoppingBasket) => {
    // Check if basket is sold out
    if (soldOutBasketNames.has(basket.name)) {
      toast({
        title: "Unavailable",
        description: `${basket.name} is currently sold out`,
        variant: "destructive"
      });
      return;
    }

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
    // Backwards-compatible helper - open quick view modal
    openQuickViewModal(basket as ShoppingBasket);
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
                      <Link to="/baskets">
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
              {settings.flashSaleEnabled ? (
              <Link 
                to="/baskets"
                className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500 p-8 text-white group cursor-pointer hover:shadow-2xl transition-all block"
              >
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Zap className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wide">Flash Sale Live</span>
                  </div>
                  <h3 className="text-4xl font-black leading-tight">
                    Save up to<br />
                    <span className="text-6xl text-yellow-300">{settings.flashSaleDiscount}% OFF</span>
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
                
                {}
                <div className="absolute top-4 right-4 text-white/10 text-[120px] font-black transform rotate-12 group-hover:rotate-0 transition-transform">
                  %
                </div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              </Link>
              ) : (
              <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 group hover:shadow-xl transition-all block border border-gray-700 min-h-[340px] flex items-center justify-center">
                {}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-repeat" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.5) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>

                {}
                <div className="absolute left-0 top-0 w-full h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600"></div>

                <div className="relative z-10 space-y-4 text-center w-full">
                  <div className="inline-block bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest border border-gray-600">
                    COMING SOON
                  </div>
                  
                  <h3 className="text-3xl font-black leading-tight text-white">
                    <span className="text-red-500">EXCLUSIVE</span><br />
                    <span className="text-4xl bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent">SALE EVENT</span>
                  </h3>

                  <p className="text-sm font-semibold text-red-400 uppercase tracking-wide mt-4">
                    Stay Tuned for Unbeatable Deals
                  </p>

                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                    We are preparing something extraordinary. Get ready for massive savings across thousands of products.
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-6 font-semibold text-xs uppercase tracking-widest bg-gray-800 hover:bg-gray-700 border border-red-600/40 hover:border-red-500/60 rounded-lg py-3 text-red-400 transition-all cursor-default">
                    <Clock className="h-4 w-4" /> Launching Soon
                  </div>
                </div>

                {/* Side Accent */}
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gray-700/10 rounded-full blur-2xl"></div>
              </div>
              )}

              {/* Customers Trust Card - Stylish Stats Display */}
              <div className="relative overflow-hidden rounded-2xl shadow-lg group cursor-pointer hover:shadow-2xl transition-all block bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
                </div>
                
                <div className="relative h-[240px] flex flex-col justify-center items-center p-6 text-center">
                  {/* Main Stats */}
                  <div className="space-y-4">
                    {/* Number with animation */}
                    <div className="relative">
                      <div className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-2 animate-pulse">
                        🌟 Trusted by millions
                      </div>
                      <h3 className="text-5xl font-black text-white mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300">
                          100,000+
                        </span>
                      </h3>
                      <p className="text-xl font-bold text-white">Customers</p>
                    </div>
                    
                    {/* Subheading */}
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-gray-200">
                        Trusted Nationwide
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-transparent rounded-full"></div>
                        <Trophy className="h-5 w-5 text-amber-400" />
                        <div className="h-1 w-12 bg-gradient-to-l from-cyan-500 to-transparent rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Testimonial hint */}
                    <p className="text-xs text-gray-400 italic">
                      "Your favorite shopping partner across Kenya"
                    </p>
                  </div>
                </div>
              </div>
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
                    <Link to="/black-friday">
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
        {/* 🏆 TOP BASKETS - Featured Baskets */}
        <section className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900">Top Baskets</h2>
              <p className="text-gray-600 mt-1">Most popular curated baskets - flying off the shelves!</p>
            </div>
            <Button variant="ghost" className="text-amber-600 hover:text-amber-700" asChild>
              <Link to="/baskets">
                View All Baskets <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Baskets - 5-Column Layout (Resized Original Design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topSellerBaskets.slice(0, 5).length > 0 ? topSellerBaskets.slice(0, 5).map((basket, index) => {
              const savings = basket.originalPrice ? basket.originalPrice - basket.price : 0;
              const itemCount = basket.items?.length || 0;

              return (
                <Card key={basket.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400 bg-white overflow-hidden cursor-pointer">
                  <div className="flex flex-col" onClick={() => handleQuickView(basket)}>
                    {/* Image Section */}
                    <div className="relative overflow-hidden bg-gray-50 h-40">
                      <img 
                        src={basket.image || 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop'}
                        alt={basket.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Sold Out Badge */}
                      {soldOutBasketNames.has(basket.name) && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs py-1.5 px-2.5 font-bold rounded-md shadow-lg">
                            Sold Out
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-3 flex flex-col justify-between flex-1">
                      <div className="space-y-2">
                        <h3 className="font-black text-sm text-gray-900 line-clamp-2">{basket.name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">{basket.description || 'Curated bundle of essential items'}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-0.5 text-gray-600">
                            <Package className="h-3 w-3 text-blue-600" />
                            <span className="font-semibold">{itemCount} Items</span>
                          </span>
                          {savings > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                              <Tag className="h-3 w-3" />
                              Save KES {savings.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Action */}
                      <div className="mt-2 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-emerald-600">
                            KES {basket.price.toLocaleString()}
                          </span>
                          {basket.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              KES {basket.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-md hover:shadow-lg transition-all text-xs py-1 h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(basket.id);
                            }}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add Basket
                          </Button>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="border-blue-400 hover:bg-blue-50 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuickViewModal(basket as any);
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            }) : (
              // Fallback to hotBaskets if no database baskets found
              hotBaskets.slice(0, 5).map((basket, index) => (
                <Card key={basket.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400 bg-white overflow-hidden">
                  <div className="flex flex-col">
                    {/* Image Section */}
                    <div className="relative overflow-hidden bg-gray-50 h-40">
                      <img 
                        src={basket.image}
                        alt={basket.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-3 flex flex-col justify-between flex-1">
                      <div className="space-y-2">
                        <h3 className="font-black text-sm text-gray-900 line-clamp-2">{basket.name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">{basket.description}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-0.5 text-gray-600">
                            <Package className="h-3 w-3 text-blue-600" />
                            <span className="font-semibold">{basket.itemCount} items</span>
                          </span>
                          <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                            <Tag className="h-3 w-3" />
                            Save KES {basket.savings.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Action */}
                      <div className="mt-2 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-emerald-600">
                            KES {basket.finalPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            KES {basket.totalValue.toLocaleString()}
                          </span>
                        </div>

                        <Button 
                          disabled={soldOutBasketNames.has(basket.name)}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-md hover:shadow-lg transition-all text-xs py-1 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleAddBasketToCart(basket)}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add Basket
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {promotionalHotDeals.length > 0 ? promotionalHotDeals.map((basket) => (
              <Card key={basket.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-rose-400 flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Image with View Icon Overlay */}
                  <div className="relative overflow-hidden bg-gray-50">
                    <img 
                      src={basket.image} 
                      alt={basket.name}
                      className="w-full h-32 object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* View Items Overlay Icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-full bg-white hover:bg-white text-rose-600 hover:text-rose-700 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickViewModal(basket as any);
                        }}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>

                    {basket.badge && (
                      <Badge className="absolute top-1 right-1 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold px-2 py-0.5 text-xs uppercase tracking-wider shadow-lg border border-red-500/20">
                        {basket.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2 flex flex-col flex-grow">
                    <h3 className="font-bold text-xs line-clamp-2 min-h-[32px]">{basket.name}</h3>
                    
                    {basket.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 min-h-[32px] mb-1.5">{basket.description}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-xs mb-1.5">
                      <span className="flex items-center gap-0.5 text-gray-600">
                        <Package className="h-3 w-3" />
                        {basket.itemCount} items
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-1 mb-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-emerald-600">
                          KES {basket.finalPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {(basket.totalValue / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>

                    {/* Actions - Push to bottom */}
                    <div className="mt-auto">
                      <Button 
                        disabled={soldOutBasketNames.has(basket.name)}
                        className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold shadow-md hover:shadow-lg transition-all text-xs py-1 h-7 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleAddBasketToCart(basket)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">No hot deals available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

      {/* Quick View Modal for Top Baskets */}
      <Dialog open={isQuickViewOpen} onOpenChange={(open) => { if (!open) closeQuickViewModal(); setIsQuickViewOpen(open); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedBasket ? selectedBasket.name : 'Basket Preview'}</DialogTitle>
            <DialogDescription>{selectedBasket ? selectedBasket.description : ''}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-gray-50 rounded-lg p-3 flex items-center justify-center">
              <img src={selectedBasket?.image} alt={selectedBasket?.name} className="w-full h-40 object-contain" />
            </div>
            <div className="md:col-span-2">
              {/* Check if this is a basket (has items) or a single product */}
              {selectedBasket && (selectedBasket as any).isBasket !== false && ((selectedBasket as any).itemsDetail?.length > 0 || selectedBasket?.items?.length > 0) ? (
                <>
                  <h4 className="font-bold text-lg mb-3">Items in this basket ({selectedBasket?.itemCount || (selectedBasket as any)?.items?.length || (selectedBasket as any)?.itemsDetail?.length || 0})</h4>
                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-2">
                    {(selectedBasket as any).itemsDetail && (selectedBasket as any).itemsDetail.length > 0 ? (
                  // Use itemsDetail if available (structured data with images)
                  (selectedBasket as any).itemsDetail.map((item: any, idx: number) => {
                    const raw = (item.image || '').trim();
                    const src = raw ? (raw.startsWith('http') ? raw : `/${raw}`) : '/placeholder.svg';
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                        <img 
                          src={src} 
                          alt={item.name} 
                          className="w-14 h-14 rounded border border-gray-100 object-contain flex-shrink-0"
                          onError={(e) => {(e.currentTarget as HTMLImageElement).src = '/placeholder.svg';}}
                        />
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="text-sm font-semibold text-gray-900">{item.name || 'Product'}</div>
                          <div className="text-xs text-gray-500">Qty: 1</div>
                        </div>
                      </div>
                    );
                  })
                ) : selectedBasket?.items && selectedBasket.items.length > 0 ? (
                  // Fallback to items array with search logic
                  selectedBasket.items.map((it: any, idx: number) => {
                    const isObjectItem = typeof it === 'object' && it !== null;
                    
                    let product = null;
                    let itemName = '';
                    let itemQty = 1;
                    
                    if (isObjectItem) {
                      product = all?.find(p => p.id === it.productId);
                      itemName = product?.name || 'Product';
                      itemQty = it.quantity || 1;
                    } else if (typeof it === 'string') {
                      itemName = it.trim();
                      
                      // Enhanced search strategies for string items like "Soko Maize Flour 2Kg"
                      // Strategy 1: Exact name match
                      product = all?.find(p => p.name && p.name.toLowerCase().trim() === itemName.toLowerCase());
                      
                      // Strategy 2: Remove quantity/size info and search (e.g., "Soko Maize Flour" from "Soko Maize Flour 2Kg")
                      if (!product) {
                        const nameWithoutSize = itemName.toLowerCase().replace(/\d+\s*(kg|g|ml|l|lb|oz)\b/gi, '').trim();
                        product = all?.find(p => p.name && p.name.toLowerCase().trim() === nameWithoutSize);
                      }
                      
                      // Strategy 3: Partial match with keywords
                      if (!product) {
                        const keywords = itemName.toLowerCase()
                          .replace(/\d+\s*(kg|g|ml|l|lb|oz)\b/gi, '')
                          .split(/\s+/)
                          .filter((w: string) => w.length > 2);
                        product = all?.find(p => 
                          p.name && keywords.some((kw: string) => p.name.toLowerCase().includes(kw))
                        );
                      }
                      
                      // Strategy 4: Brand name search (first word)
                      if (!product) {
                        const brandName = itemName.split(/\s+/)[0].toLowerCase();
                        product = all?.find(p => 
                          p.name && p.name.toLowerCase().includes(brandName)
                        );
                      }
                    }
                    
                    const itemKey = isObjectItem ? (it.productId + '-' + idx) : (idx);
                    
                    return (
                      <div key={itemKey} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                        {product?.image ? (
                          <img src={product.image} alt={itemName} className="w-14 h-14 rounded border border-gray-100 object-contain flex-shrink-0" onError={(e) => {(e.currentTarget as HTMLImageElement).src = '/placeholder.svg';}} />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="text-sm font-semibold text-gray-900">{itemName || 'Product'}</div>
                          <div className="text-xs text-gray-500">Qty: {itemQty}</div>
                        </div>
                        {product && (
                          <div className="text-sm font-bold text-emerald-600 flex-shrink-0">KES {(product.price * itemQty).toLocaleString()}</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500 p-4 text-center bg-gray-50 rounded-lg">No items available for preview.</div>
                )}
              </div>
              
              {/* Pricing and Savings for Baskets */}
              <div className="mt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      KES {(selectedBasket?.finalPrice ?? (selectedBasket as any)?.price ?? 0).toLocaleString()}
                    </span>
                    {selectedBasket && (
                      (selectedBasket.totalValue ?? (selectedBasket as any).originalPrice ?? 0) > 
                      (selectedBasket.finalPrice ?? (selectedBasket as any).price ?? 0)
                    ) && (
                      <span className="text-lg line-through text-muted-foreground">
                        KES {(selectedBasket.totalValue ?? (selectedBasket as any).originalPrice ?? 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {selectedBasket && (
                    (selectedBasket.totalValue ?? (selectedBasket as any).originalPrice ?? 0) > 
                    (selectedBasket.finalPrice ?? (selectedBasket as any).price ?? 0)
                  ) && (
                    <Badge variant="destructive" className="text-sm">
                      Save {Math.round((((selectedBasket.totalValue ?? (selectedBasket as any).originalPrice ?? 0) - (selectedBasket.finalPrice ?? (selectedBasket as any).price ?? 0)) / (selectedBasket.totalValue ?? (selectedBasket as any).originalPrice ?? 1)) * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
                </>
              ) : (
                // Single product view (not a basket)
                <>
                  <h4 className="font-bold text-lg mb-3">Product Details</h4>
                  <div className="mt-3 space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">Description</div>
                      <div className="text-base text-gray-900">{selectedBasket?.description || 'No description available.'}</div>
                    </div>
                    
                    {/* Pricing for Single Products */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">
                            KES {(selectedBasket?.finalPrice ?? (selectedBasket as any)?.price ?? 0).toLocaleString()}
                          </span>
                          {selectedBasket && (
                            (selectedBasket as any).totalValue ?? (selectedBasket as any).originalPrice ?? 0
                          ) > (
                            (selectedBasket as any).finalPrice ?? (selectedBasket as any).price ?? 0
                          ) && (
                            <span className="text-lg line-through text-muted-foreground">
                              KES {((selectedBasket as any).totalValue ?? (selectedBasket as any).originalPrice ?? 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {selectedBasket && (
                          ((selectedBasket as any).totalValue ?? (selectedBasket as any).originalPrice ?? 0) > 
                          ((selectedBasket as any).finalPrice ?? (selectedBasket as any).price ?? 0)
                        ) && (
                          <Badge variant="destructive" className="text-sm">
                            Save {Math.round(((((selectedBasket as any).totalValue ?? (selectedBasket as any).originalPrice ?? 0) - ((selectedBasket as any).finalPrice ?? (selectedBasket as any).price ?? 0)) / ((selectedBasket as any).totalValue ?? (selectedBasket as any).originalPrice ?? 1)) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {selectedBasket?.badge && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                        <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold rounded-full">
                          {selectedBasket.badge}
                        </div>
                        <div className="text-sm text-gray-700">Special promotional item</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white" onClick={() => {
                  if (selectedBasket) handleAddBasketToCart(selectedBasket);
                  closeQuickViewModal();
                }}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={closeQuickViewModal}>Close</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        {/*  NEW ARRIVALS */}
        <section id="new-arrivals-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                New Arrivals
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Fresh stock just landed. Be the first to grab them!</p>
            </div>
            <Button variant="ghost" className="text-cyan-600 hover:text-cyan-700 text-sm sm:text-base px-2 sm:px-4" asChild>
              <Link to="/baskets">
                View All <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {promotionalNewArrivals.length > 0 ? promotionalNewArrivals.map((basket) => (
              <Card key={basket.id} className="group hover:shadow-xl transition-all border-2 hover:border-cyan-300 bg-white flex flex-col">
                <CardContent className="p-2 flex flex-col h-full">
                  <div className="relative mb-1.5">
                    <img 
                      src={basket.image || '/placeholder.jpg'} 
                      alt={basket.name}
                      className="w-full h-auto aspect-square object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    
                    {/* View Items Overlay Icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-full bg-white hover:bg-white text-cyan-600 hover:text-cyan-700 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickViewModal(basket as any);
                        }}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* NEW Badge - Top Left Corner */}
                    {basket.badge && (
                      <div className="absolute top-1 left-1 bg-gradient-to-br from-blue-600 to-cyan-600 text-white px-1.5 py-0.5 rounded-md font-bold text-xs uppercase tracking-wider shadow-lg border border-blue-500/20">
                        {basket.badge}
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-xs line-clamp-2 mb-1 min-h-[32px]">{basket.name}</h3>
                  
                  {basket.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1.5 min-h-[32px]">{basket.description}</p>
                  )}
                  
                  {basket.isBasket && (
                    <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {basket.itemCount} items
                    </div>
                  )}

                  <div className="flex flex-col gap-1 mb-1.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-cyan-600">
                        KES {basket.finalPrice.toLocaleString()}
                      </span>
                      {basket.totalValue > basket.finalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {(basket.totalValue / 1000).toFixed(0)}K
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Push button to bottom */}
                  <div className="mt-auto">
                    <Button 
                      disabled={basket.isBasket ? soldOutBasketNames.has(basket.name) : false}
                      size="sm" 
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-md hover:shadow-lg transition-all text-xs py-1 h-7 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => basket.isBasket ? handleAddBasketToCart(basket) : handleAddToCart(basket.id)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">No new arrivals available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* 🏷️ SHOP BY BRAND */}
        {settings.shopByBrandEnabled && (
        <section className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900">Shop by Brand</h2>
              <p className="text-gray-600 mt-1">Your favorite brands, all in one place</p>
            </div>
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900" asChild>
              <Link to="/baskets">
                All Brands <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-3">
            {settings.brands.map((brand) => (
              <Link 
                key={brand.id} 
                to="/baskets"
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
        )}

        {/* 💥 SPECIAL DEALS FOR YOU */}
        <section id="special-deals-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2 sm:gap-3">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-rose-600" />
                Special Deals For You
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Personalized offers. Limited time. Act fast!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {promotionalSpecialDeals.length > 0 ? promotionalSpecialDeals.map((basket) => {
              const discount = basket.totalValue > basket.finalPrice
                ? Math.round(((basket.totalValue - basket.finalPrice) / basket.totalValue) * 100)
                : 0;

              return (
                <Card key={basket.id} className="group hover:shadow-lg transition-all bg-white border-2 border-rose-200 hover:border-rose-400 flex flex-col">
                  <CardContent className="p-2 flex flex-col h-full">
                    <div className="relative mb-1.5 bg-gray-50 rounded-lg overflow-hidden">
                      <img 
                        src={basket.image || '/placeholder.jpg'} 
                        alt={basket.name}
                        className="w-full h-auto aspect-square object-contain rounded-lg group-hover:scale-105 transition-transform"
                      />
                      
                      {/* View Items Overlay Icon */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-full bg-white hover:bg-white text-rose-600 hover:text-rose-700 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQuickViewModal(basket as any);
                          }}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {basket.badge && (
                        <Badge className="absolute top-1 right-1 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-lg">
                          {basket.badge}
                        </Badge>
                      )}
                      {discount > 0 && (
                        <Badge className="absolute top-1 left-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 font-bold text-xs shadow-lg">
                          -{discount}%
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-xs line-clamp-2 mb-1 min-h-[32px]">{basket.name}</h3>
                    
                    {basket.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1.5 min-h-[32px]">{basket.description}</p>
                    )}
                    
                    {basket.isBasket && (
                      <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {basket.itemCount} items
                      </div>
                    )}
                    
                    <div className="space-y-0.5 mb-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-rose-600">
                          KES {basket.finalPrice.toLocaleString()}
                        </span>
                        {basket.totalValue > basket.finalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {(basket.totalValue / 1000).toFixed(0)}K
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Push button to bottom */}
                    <div className="mt-auto">
                      <Button 
                        disabled={basket.isBasket ? soldOutBasketNames.has(basket.name) : false}
                        size="sm" 
                        className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs py-1 h-7 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => basket.isBasket ? handleAddBasketToCart(basket) : handleAddToCart(basket.id)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">No special deals available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* Trust Section - Simple & Elegant */}
        <section>
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                <Counter target={100000} suffix="K+" duration={2000} className="text-purple-600 font-bold" /> Customers
              </h3>
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
