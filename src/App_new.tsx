import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Supabase Providers (Primary)
import { SupabaseAuthProvider, useSupabaseAuth } from "./contexts/SupabaseAuthContext";
import { SupabaseProductsProvider } from "./contexts/SupabaseProductsContext";
import { SupabaseAdminProvider } from "./contexts/SupabaseAdminContext";
import { SupabaseWalletProvider } from "./contexts/SupabaseWalletContext";

// Legacy providers for compatibility
import { CartProvider } from "@/contexts/CartContext";

// Pages
import HomePage from "./pages/HomePage";
import BasketsPage from "./pages/BasketsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AccountPage from "./pages/AccountPage";
import FAQPage from "./pages/FAQPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";

// Supabase Admin Pages
import SupabaseAdminProducts from "./pages/admin/SupabaseAdminProducts";
import SupabaseAdminSettings from "./pages/admin/SupabaseAdminSettings";
import SupabaseWalletPage from "./pages/SupabaseWalletPage";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useSupabaseAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to access this area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

function MaintenanceBanner() {
  const { isAuthenticated } = useSupabaseAuth();
  
  return (
    <>
      {/* Authentication Status */}
      {!isAuthenticated && (
        <div className="bg-green-100 text-green-800 text-sm py-2">
          <div className="container mx-auto px-4 text-center">
            🔐 Authentication is now enabled! Please sign in to access all features.
          </div>
        </div>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SupabaseAuthProvider>
        <SupabaseAdminProvider>
          <SupabaseProductsProvider>
            <SupabaseWalletProvider>
              <CartProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">
                      <MaintenanceBanner />
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/baskets" element={<BasketsPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/how-it-works" element={<HowItWorksPage />} />
                        <Route path="/account" element={<AuthGuard><AccountPage /></AuthGuard>} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/wallet" element={<AuthGuard><SupabaseWalletPage /></AuthGuard>} />
                        
                        {/* Admin Routes - All using Supabase */}
                        <Route path="/admin/products" element={<AuthGuard><SupabaseAdminProducts /></AuthGuard>} />
                        <Route path="/admin/settings" element={<AuthGuard><SupabaseAdminSettings /></AuthGuard>} />
                        <Route path="/admin/orders" element={<AuthGuard><AdminOrders /></AuthGuard>} />
                        <Route path="/admin/users" element={<AuthGuard><AdminUsers /></AuthGuard>} />
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </BrowserRouter>
              </CartProvider>
            </SupabaseWalletProvider>
          </SupabaseProductsProvider>
        </SupabaseAdminProvider>
      </SupabaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
