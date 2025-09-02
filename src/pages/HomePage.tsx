import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Clock, Shield, Truck, LogIn, UserPlus, Megaphone, X, Star, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import { AuthModals } from "@/components/AuthModals";
import { useProducts } from "@/contexts/ProductsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/franki-chamaki-ivfp_yxZuYQ-unsplash.jpg";
import { electronicsProducts, automotiveProducts } from "@/data/products";
const deliveryImage = "https://gulfbusiness.com/wp-content/uploads/2024/04/GettyImages-1824077027-800x534.jpg";

function TimePill({ label, value }: { label: string; value: number }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="min-w-[72px] text-center rounded-md bg-background/70 backdrop-blur px-3 py-2 border shadow-sm">
      <div className="text-3xl font-extrabold leading-none font-mono tracking-tight">{display}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { all } = useProducts();
  const { isAuthenticated, signOut } = useAuth();
  const featuredProducts = all.filter(p => p.category !== 'alcohol' && p.category !== 'blackfriday').slice(0, 3);
  const discountedProducts = all.filter(p => p.originalPrice && p.originalPrice > p.price);
  const alcoholProducts = all.filter(p => p.category === 'alcohol');
  const blackFridayProducts = all.filter(p => p.category === 'blackfriday');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0, ended: false });
  const [showSticky, setShowSticky] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const categories = [
    { name: 'Fashion', slug: 'fashion', icon: '👕' },
    { name: 'Home & Garden', slug: 'home-garden', icon: '🏠' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽' },
    { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄' },
    { name: 'Books & Media', slug: 'books-media', icon: '📚' },
    { name: 'Toys & Games', slug: 'toys-games', icon: '🎮' },
    { name: 'Food & Beverages', slug: 'food-beverages', icon: '🍕' },
    { name: 'Office Supplies', slug: 'office-supplies', icon: '📎' }
  ];

  // Function to get products by category
  const getProductsByCategory = (categoryName: string) => {
    return all.filter(p => p.category === categoryName).slice(0, 6); // Show max 6 products per category
  };

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return all.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 12); // Limit to 12 results
  }, [all, searchQuery]);

  // Clear search function
  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  // Handle search with keyboard support
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e.target.value);
  };

  useEffect(() => {
    // Set target to 45 days from now
    const target = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    const tick = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0, ended: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, mins, secs, ended: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (dismissed || countdown.ended) return setShowSticky(false);
      setShowSticky(window.scrollY > 180);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed, countdown.ended]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchSection = document.getElementById('search-section');
      if (searchSection && !searchSection.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);
  const features = [
    {
      icon: CheckCircle,
      title: "Curated Baskets",
      description: "Carefully selected products for your family's needs"
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "2-hour speedy drop or convenient pickup options"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Multiple payment options including M-Pesa and cards"
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "No more long shopping trips - we've got you covered"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Create Account",
      description: "Sign up with your phone number and basic information"
    },
    {
      number: "2", 
      title: "Choose Basket",
      description: "Browse our curated baskets and select what fits your needs"
    },
    {
      number: "3",
      title: "Select Pickup Point", 
      description: "Choose speedy drop or pickup at your nearest Quickmart"
    },
    {
      number: "4",
      title: "Make Payment",
  description: "Pay securely using M-Pesa, Card, GetDeals Wallet, or Cash"
    }
  ];

  return (
    <div className="min-h-screen">
      {}
  <section 
        className="relative py-20 lg:py-32 min-h-[600px]"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-balance text-white drop-shadow-lg">
                Smart Shopping
                <span className="text-primary block">Made Easy</span>
              </h1>
              <p className="text-xl text-white max-w-xl drop-shadow-md">
                Get curated grocery baskets delivered to your doorstep or pickup at your nearest Quickmart. Save time, save money.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link to="/baskets">
                    Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 bg-white/20 border-white text-white hover:bg-white hover:text-black" asChild>
                  <Link to="/how-it-works">How It Works</Link>
                </Button>
              </div>
              {!isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="bg-white/20 border-white text-white hover:bg-white hover:text-black"
                    onClick={() => {
                      setAuthModalTab("signin");
                      setAuthModalOpen(true);
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-white/20 border-white text-white hover:bg-white hover:text-black"
                    onClick={() => {
                      setAuthModalTab("signup");
                      setAuthModalOpen(true);
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-white/20 border-white text-white hover:bg-white hover:text-black"
                    onClick={() => {
                      signOut();
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {}
        {!countdown.ended && (
          <div className="absolute right-4 top-4 md:right-8 md:top-8 z-10">
            <div className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur text-white text-sm font-medium flex items-center gap-2">
              Black Friday in {countdown.days}d {countdown.hours}h
            </div>
          </div>
        )}
      </section>

      {}
      {showSticky && !dismissed && (
        <div className="fixed left-0 right-0 top-16 z-50">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-lg border bg-background shadow flex items-center justify-between gap-3 px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Megaphone className="h-4 w-4 text-primary" />
                <span>
                  Black Friday early access in {countdown.days}d {countdown.hours}h —
                </span>
                <a href="#bf-promo" className="text-primary hover:underline">Get notified</a>
              </div>
              <button aria-label="Dismiss" onClick={() => setDismissed(true)} className="p-1 hover:text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <section id="search-section" className="py-12 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">Find What You're Looking For</h2>
              <p className="text-muted-foreground">Search our wide range of products, baskets, and deals</p>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for products, baskets, electronics, automotive..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-12 pr-12 py-6 text-lg"
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-6 bg-background border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                <div className="p-4 border-b bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
                <div className="grid gap-2 p-2">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      onClick={() => setShowSearchResults(false)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg border"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{product.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-primary">
                            KES {product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              KES {product.originalPrice.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xs bg-muted px-2 py-1 rounded">{product.category}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                {searchResults.length >= 12 && (
                  <div className="p-4 border-t bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Showing first 12 results. Try a more specific search for better results.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div className="mt-6 bg-background border rounded-lg shadow-lg p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any products matching "{searchQuery}"
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }} variant="outline">
                  Clear Search
                </Button>
              </div>
            )}

            {/* Popular Searches */}
            {!searchQuery && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Electronics', 'Automotive', 'Rice', 'Cooking Oil', 'Black Friday'].map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {}
  <section id="bf-promo" className="py-10 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <Card className="border-primary/20">
            <CardContent className="p-8 flex flex-col lg:flex-row gap-8 items-center justify-between">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-medium">
                  Black Friday 2025
                </div>
                <h3 className="mt-3 text-3xl lg:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  {countdown.days} Days — Early Access is coming
                </h3>
                {countdown.ended ? (
                  <p className="text-muted-foreground">It’s live now — check out the deals below.</p>
                ) : (
                  <p className="text-muted-foreground">Get notified and don’t miss the biggest savings of the year.</p>
                )}
                {!countdown.ended && (
                  <div className="mt-4 flex items-center gap-3 justify-center lg:justify-start">
                    <TimePill label="Days" value={countdown.days} />
                    <TimePill label="Hours" value={countdown.hours} />
                    <TimePill label="Mins" value={countdown.mins} />
                    <TimePill label="Secs" value={countdown.secs} />
                  </div>
                )}
                {!countdown.ended && (
                  <ul className="mt-4 grid sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> 24h early access</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Limited doorbusters</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> +5% with Wallet</li>
                  </ul>
                )}
              </div>
              <div className="w-full max-w-md">
                {countdown.ended ? (
                  <div className="flex gap-2">
                    <Button className="w-full" asChild>
                      <a href="#black-friday">Shop Black Friday Deals</a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/baskets">View All Baskets</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email for early access"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          toast({ title: "Enter a valid email" });
                          return;
                        }
                        toast({ title: "You're on the list!", description: "We’ll email you when early access starts." });
                        setEmail("");
                      }}
                    >
                      Get Notified
                    </Button>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2 text-center lg:text-left">
                  No spam. Unsubscribe anytime.
                </div>
                {!countdown.ended && (
                  <div className="mt-3 text-xs text-muted-foreground text-center lg:text-left">
                    Tip: Top up your <Link to="/wallet" className="text-primary hover:underline">GetDeals Wallet</Link> for an extra +5% during Black Friday.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {}
      {!countdown.ended && (
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Sneak Peek</h3>
              <a href="#black-friday" className="text-sm text-primary hover:underline">See all deals</a>
            </div>
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]" style={{ scrollbarWidth: 'none' }}>
              <div className="flex gap-4 min-w-max pr-2">
                {blackFridayProducts.slice(0, 8).map((p) => {
                  const pct = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                  return (
                    <Link key={p.id} to="#black-friday" className="group w-48 shrink-0">
                      <div className="rounded-lg border bg-background overflow-hidden">
                        <div className="aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                          <img src={p.image} alt={p.name} loading="eager" decoding="sync" className="max-w-full max-h-full object-contain transition-transform" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                          {p.originalPrice && (
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <span className="font-semibold text-primary">KES {p.price.toLocaleString()}</span>
                              <span className="line-through text-muted-foreground">KES {p.originalPrice.toLocaleString()}</span>
                              <span className="text-emerald-600">-{pct}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose GetDeals?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make grocery shopping effortless with our carefully curated baskets and convenient delivery options.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Bundle Baskets</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Save more with our curated bundles designed for different family sizes and needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/baskets">
                View All Baskets <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

  {}
  <section id="black-friday" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Black Friday Mega Deals</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Limited-time discounts across baskets and essentials. Don't miss out!
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blackFridayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Alcohol Deals</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore discounted beer, wine, and spirits deals.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {alcoholProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Electronics Section */}
      {electronicsProducts.length > 0 && (
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Electronics</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover the latest electronic appliances and gadgets.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {electronicsProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center">
              <Button size="lg" variant="outline" asChild>
                <Link to="/category/electronics">
                  View All Electronics <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Automotive Section */}
      {automotiveProducts.length > 0 && (
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Automotive</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Quality automotive parts, accessories, and maintenance products.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {automotiveProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center">
              <Button size="lg" variant="outline" asChild>
                <Link to="/category/automotive">
                  View All Automotive <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Category Sections */}
      {categories.map((category) => {
        const categoryProducts = getProductsByCategory(category.name);
        if (categoryProducts.length === 0) return null;

        return (
          <section key={category.slug} className="py-16 bg-muted/20">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <h2 className="text-2xl lg:text-3xl font-bold">{category.name}</h2>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/category/${category.slug}`}>
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting your groceries has never been easier. Follow these simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 h-6 w-6 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Flexible Delivery & Pickup Options
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Speedy Drop</h3>
                    <p className="text-muted-foreground">Fast delivery to your doorstep within 2 hours for just KES 200</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Pickup Point</h3>
                    <p className="text-muted-foreground">Collect from your nearest Quickmart at your convenience - completely free</p>
                  </div>
                </div>
              </div>
              <Button size="lg" asChild>
                <Link to="/delivery">Learn More About Delivery</Link>
              </Button>
            </div>
            <div className="relative">
              <img
                src={deliveryImage}
                alt="Delivery service"
                loading="eager"
                decoding="sync"
                className="rounded-2xl shadow-strong w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
              />
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="mt-3 text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to smart. Start shopping better.
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Join thousands of satisfied customers who save time and money with GetDeals Kenya.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/baskets">Browse Baskets <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-5 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /><span>4.9/5 satisfaction</span></div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" /><span>2-hour delivery</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><span>Secure checkout</span></div>
            </div>
          </div>
        </div>
      </section>
      
      <AuthModals 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
      />
    </div>
  );
}