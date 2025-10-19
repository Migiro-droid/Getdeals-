import { useState } from "react";
import logo from "../assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, Heart, ChevronDown, Zap, ShoppingBag, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWallet } from "@/contexts/NewWalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModals } from "./AuthModals";
import { WalletActivationModal } from "./WalletActivationModal";
import { useWalletKyc } from "../hooks/useWalletKyc";
import { KycStatusDisplay } from "./KycStatusDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NavigationItem {
  name: string;
  href: string;
  comingSoon?: boolean;
  icon?: React.ReactNode;
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [categoryDropdown, setCategoryDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const { balance } = useWallet();
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [kycStatusModalOpen, setKycStatusModalOpen] = useState(false);
  
  // Get KYC status for authenticated users
  const { kycData, loading: kycLoading, hasKycData, isVerified, refetch: refetchKyc } = useWalletKyc();

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Handle wallet button click - check KYC status first
  const handleWalletClick = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    // If user is verified, navigate directly to wallet page
    if (isVerified) {
      navigate('/wallet');
      return;
    }

    // If user has KYC data but not verified (pending/rejected), show status modal
    if (hasKycData) {
      setKycStatusModalOpen(true);
    } else {
      // No KYC data, show the activation modal
      setWalletModalOpen(true);
    }
  };

  const categories = [
    { name: "Groceries", href: "/baskets?category=groceries" },
    { name: "Household", href: "/baskets?category=household" },
    { name: "Fresh & Natural", href: "/baskets?category=fresh" },
    { name: "Health & Beauty", href: "/baskets?category=health" },
    { name: "Electronics", href: "/baskets?category=electronics" },
    { name: "Appliances", href: "/baskets?category=appliances" },
    { name: "Cleaning", href: "/baskets?category=cleaning" },
    { name: "Furnishing & Furniture", href: "/baskets?category=furniture" },
    { name: "Automotive", href: "/baskets?category=automotive" },
    { name: "Accessories", href: "/baskets?category=accessories" },
  ];

  const mainNavigation: NavigationItem[] = [
    { name: "Shop", href: "/baskets" },
    { name: "Deals", href: "/deals", icon: <Zap className="h-4 w-4" /> },
    { name: "Insights", href: "/consumer-insights" },
    { name: "Who GET DEALS Is For", href: "/who-we-serve", icon: <ShoppingBag className="h-4 w-4" /> },
    { name: "How It Works", href: "/how-it-works" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("?")[0]);
  };

  // Handle smooth scroll to deals section on homepage
  const handleDealsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If we're already on homepage, just scroll to the deals section
    if (location.pathname === "/") {
      e.preventDefault();
      const dealsSection = document.getElementById("special-deals-section");
      if (dealsSection) {
        dealsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    // Otherwise, let navigation happen normally and scroll will happen on page load
  };

  // Handle category clicks with smooth transition
  const handleCategoryClick = () => {
    // Close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    // Scroll to top smoothly on destination page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  return (
    <>
      {/* CONTACT INFORMATION BANNER - RED TOP - STICKY */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 w-full shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 text-xs md:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <a href="tel:+254728322355" className="text-white/90 hover:text-white transition-colors">+254 728 322 355</a>
          </div>
          <div className="hidden md:block text-white/50">|</div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:support@getdeals.co.ke" className="text-white/90 hover:text-white transition-colors">support@getdeals.co.ke</a>
          </div>
          <div className="hidden md:block text-white/50">|</div>
          <div className="text-white/80">24/7 • Mon-Sun 8am-10pm</div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-[36px] z-40 pointer-events-auto w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top Row - Logo & Search & Icons */}
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src={logo} alt="GET DEALS" className="h-14 w-auto object-contain" />
            </Link>

            {/* Desktop Search Bar - Center Prominent */}
            <div className="hidden lg:flex flex-1 max-w-md mx-6">
              <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search products, deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 border-0 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Right Icons - Cart, Wishlist, Account */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Search */}
              <Button 
                variant="ghost" 
                size="icon"
                className="lg:hidden text-gray-600 hover:text-primary"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Wallet - Desktop */}
              {isAuthenticated && (
                <button 
                  onClick={handleWalletClick}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  💰 KES {balance.toLocaleString()}
                </button>
              )}

              {/* Wishlist */}
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-600 hover:text-red-600 relative"
              >
                <Heart className="h-5 w-5" />
              </Button>

              {/* Shopping Cart */}
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-primary">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-600"
                    >
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <Link to="/account">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="default"
                  size="sm"
                  onClick={() => setAuthOpen(true)}
                  className="hidden md:flex bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Bottom Row - Desktop Navigation Menu */}
          <div className="hidden md:flex items-center justify-between h-12 border-t border-gray-100">
            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-700 hover:text-primary group-hover:bg-gray-50 rounded-md">
                <ShoppingBag className="h-4 w-4" />
                Shop by Category
                <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-48">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    to={cat.href}
                    onClick={handleCategoryClick}
                    className="px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary font-medium border-b last:border-0"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex items-center gap-6 flex-1 ml-6">
              {mainNavigation.map((item) => {
                const active = isActive(item.href);
                // Special handling for Deals link to scroll on homepage
                if (item.name === "Deals") {
                  return (
                    <a
                      key={item.name}
                      href="#special-deals-section"
                      onClick={handleDealsClick}
                      className={`flex items-center gap-1 py-2 px-3 text-sm font-bold transition-colors rounded-md cursor-pointer ${
                        active
                          ? "text-primary bg-primary/10 border-b-2 border-primary"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-1 py-2 px-3 text-sm font-bold transition-colors rounded-md ${
                      active
                        ? "text-primary bg-primary/10 border-b-2 border-primary"
                        : "text-gray-700 hover:text-primary hover:bg-gray-50"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <Link to="/contact" className="text-sm font-semibold text-gray-700 hover:text-primary">
                Contact
              </Link>
              <Link to="/faq" className="text-sm font-semibold text-gray-700 hover:text-primary">
                FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Mobile Navigation */}
              <nav className="space-y-2">
                {mainNavigation.map((item) => {
                  // Special handling for Deals link on mobile
                  if (item.name === "Deals") {
                    return (
                      <a
                        key={item.name}
                        href="#special-deals-section"
                        onClick={(e) => {
                          handleDealsClick(e);
                          setIsMobileMenuOpen(false);
                        }}
                        className="block px-3 py-2 text-sm font-bold text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md"
                      >
                        {item.name}
                      </a>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md"
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Categories */}
              <div className="border-t pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Categories</p>
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    to={cat.href}
                    onClick={() => {
                      handleCategoryClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Wallet */}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleWalletClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100"
                >
                  💰 Wallet: KES {balance.toLocaleString()}
                </button>
              )}

              {/* Mobile Auth */}
              {!isAuthenticated && (
                <Button 
                  onClick={() => {
                    setAuthOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Contact Links */}
              <div className="border-t pt-3 space-y-2">
                <Link to="/contact" className="block px-3 py-2 text-sm text-gray-700 hover:text-primary">
                  Contact Us
                </Link>
                <Link to="/faq" className="block px-3 py-2 text-sm text-gray-700 hover:text-primary">
                  FAQ
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modals */}
      <AuthModals open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" />
      <WalletActivationModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />

      {/* KYC Status Modal */}
      <Dialog open={kycStatusModalOpen} onOpenChange={setKycStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Status</DialogTitle>
          </DialogHeader>
          <KycStatusDisplay kycData={kycData} loading={kycLoading} />
        </DialogContent>
      </Dialog>
    </>
  );
}
