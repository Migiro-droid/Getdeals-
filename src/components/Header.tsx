import { useState } from "react";
import logo from "../assets/logo.png";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModals } from "./AuthModals";
import { WalletActivationModal } from "./WalletActivationModal";
import { useWalletKyc } from "../hooks/useWalletKyc";
import { KycStatusDisplay } from "./KycStatusDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const { balance } = useWallet();
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [kycStatusModalOpen, setKycStatusModalOpen] = useState(false);
  
  // Get KYC status for authenticated users
  const { kycData, loading: kycLoading, hasKycData, refetch: refetchKyc } = useWalletKyc();

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Handle wallet button click - check KYC status first
  const handleWalletClick = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    // If user has already submitted KYC, show status instead of form
    if (hasKycData) {
      setKycStatusModalOpen(true);
    } else {
      // No KYC data, show the activation modal
      setWalletModalOpen(true);
    }
  };

  const handleContactSupport = () => {
    // You can implement this to open a support modal or redirect to support page
    window.open('mailto:support@getdeals.co.ke', '_blank');
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Baskets", href: "/baskets" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
  <header className="sticky top-0 z-[200] pointer-events-auto w-full border-b bg-white dark:bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" className="h-12 w-auto max-h-14 object-contain" style={{background: 'none'}} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.name}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                  }}
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                    active ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Wallet Button */}
          {isAuthenticated && (
            <button
              onClick={handleWalletClick}
              className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-muted-foreground hover:text-primary"
            >
              Wallet
            </button>
          )}

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Wallet quick pill */}
            {isAuthenticated && (
              <button 
                onClick={handleWalletClick}
                className="hidden md:flex px-3 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
              >
                Wallet: KES {balance.toLocaleString()}
              </button>
            )}
            
            {/* Mobile Search Button */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* User Account / Authentication */}
            {isAuthenticated ? (
              <Link to="/account">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAuthOpen(true)}
                className="hidden md:flex"
              >
                Sign In
              </Button>
            )}

            {/* Shopping Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-white border-t">
            <div className="space-y-1 pb-3 pt-2">
              <div className="px-3 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary cursor-pointer w-full text-left ${
                    isActive(item.href) ? "text-primary bg-primary/5" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              
              {/* Mobile Wallet Button */}
              {isAuthenticated && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleWalletClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-medium transition-colors hover:text-primary cursor-pointer w-full text-left text-muted-foreground hover:text-primary"
                >
                  Wallet
                </button>
              )}
              
              {/* Mobile Authentication */}
              {!isAuthenticated && (
                <div className="px-3 py-2 border-t">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      setAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    
    {/* Authentication Modals */}
    <AuthModals open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" />
    
    {/* Wallet Activation Modal - only for users without KYC data */}
    <WalletActivationModal 
      open={walletModalOpen} 
      onOpenChange={(open) => {
        setWalletModalOpen(open);
        // Refetch KYC data when modal closes to update status
        if (!open) {
          refetchKyc();
        }
      }} 
    />

    {/* KYC Status Modal - for users who have already submitted KYC */}
    <Dialog open={kycStatusModalOpen} onOpenChange={setKycStatusModalOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wallet KYC Status</DialogTitle>
        </DialogHeader>
        <KycStatusDisplay 
          kycData={kycData} 
          loading={kycLoading}
          onRetry={refetchKyc}
          onContactSupport={handleContactSupport}
        />
      </DialogContent>
    </Dialog>
    </>
  );
}