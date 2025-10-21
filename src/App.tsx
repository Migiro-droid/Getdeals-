import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { CartProvider } from "@/contexts/CartContext";
import { WalletProvider } from "./contexts/NewWalletContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { OrderNotificationProvider } from "@/contexts/OrderNotificationContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { Header } from "@/components/Header";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AccountProvider } from "./contexts/AccountContext";
import { UserProfileProvider } from "./contexts/UserProfileContext";
import { Footer } from "@/components/Footer";
import HomePage from "./pages/HomePage";
import HomePageRedesign from "./pages/HomePageRedesign";
import BlackFridayPage from "./pages/BlackFridayPage";
import BasketsPage from "./pages/BasketsPage";
import DealsPage from "./pages/DealsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AccountPage from "./pages/AccountPage";
import FAQPage from "./pages/FAQPage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSettings from "./pages/admin/AdminSettings";
import { useAdmin } from "@/contexts/AdminContext";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import InventoryPage from "./pages/admin/InventoryPage";
import OutOfStockPage from "./pages/admin/OutOfStockPage";
import TestProductsPage from "./pages/TestProductsPage";
import WalletPage from "./pages/WalletPage";
import CategoryPage from "./pages/CategoryPage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import { AuthTestPage } from "./components/AuthTestPage";
import { QuickMartDashboard } from "./pages/quickmart/QuickMartDashboard";
import BuildYourBasket from "./pages/BuildYourBasket";
import ConsumerInsightsPage from "./pages/ConsumerInsightsPage";
import WhoWeServe from "./pages/WhoWeServe";

const queryClient = new QueryClient();

const App = () => {

  function AdminGuard({ children }: { children: JSX.Element }) {
    const { isAuthenticated, user } = useAuth();
    const { setIsAdmin, setAdminUser } = useAdmin();
    
    useEffect(() => {
      if (isAuthenticated && user) {
        const allowedRoles = ['admin', 'manager', 'staff'];
        const userRole = user.role?.toLowerCase();
        
        if (userRole && allowedRoles.includes(userRole)) {
          setAdminUser({ name: user.name, email: user.email });
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setAdminUser(null);
        }
      } else {
        setIsAdmin(false);
        setAdminUser(null);
      }
    }, [isAuthenticated, user, setAdminUser, setIsAdmin]);

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Admin Access Required
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please sign in with an admin account to access this area.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const userRole = user?.role?.toLowerCase();
    const allowedRoles = ['admin', 'manager', 'staff'];
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Insufficient Permissions
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You don't have permission to access the admin area. Admin, Manager, or Staff role required.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }

  function QuickMartGuard({ children }: { children: JSX.Element }) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                QuickMart Access Required
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please sign in with a QuickMart account to access this area.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (user?.role !== 'quickmart') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                QuickMart Access Only
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You don't have permission to access the QuickMart dashboard.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }

  function MaintenanceBanner() {
    return null; 
  }

  function AppContent() {
    return (
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <MaintenanceBanner />
            <Routes>
              <Route path="/" element={<HomePageRedesign />} />
              <Route path="/old-home" element={<HomePage />} />
              <Route path="/black-friday" element={<BlackFridayPage />} />
              <Route path="/baskets" element={<BasketsPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/consumer-insights" element={<ConsumerInsightsPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/test-products" element={<TestProductsPage />} />
              <Route path="/test-auth" element={<AuthTestPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
              <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
              <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/inventory" element={<AdminGuard><InventoryPage /></AdminGuard>} />
              <Route path="/admin/inventory/out-of-stock" element={<AdminGuard><OutOfStockPage /></AdminGuard>} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/quickmart" element={<QuickMartDashboard />} />
              <Route path="/build-your-basket" element={<BuildYourBasket />} />
              <Route path="/membership" element={<BuildYourBasket />} />
              <Route path="/who-we-serve" element={<WhoWeServe />} />
              {}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WalletProvider>
            <OrdersProvider>
              <OrderNotificationProvider>
                <AdminProvider>
                  <ProductsProvider>
                    <InventoryProvider>
                      <AuthProvider>
                        <UserProfileProvider>
                          <AccountProvider>
                            <Toaster />
                            <Sonner />
                            <AppContent />
                          </AccountProvider>
                        </UserProfileProvider>
                      </AuthProvider>
                    </InventoryProvider>
                  </ProductsProvider>
                </AdminProvider>
              </OrderNotificationProvider>
            </OrdersProvider>
          </WalletProvider>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
