import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
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
import { initializeLetaClient } from "@/services/leta";
import { AddressRequiredModal } from "./components/AddressRequiredModal";
import { useAddressOnboarding } from "./hooks/useAddressOnboarding";
import { useAdmin } from "@/contexts/AdminContext";

// Lazy load route components
const HomePageRedesign = lazy(() => import("./pages/HomePageRedesign"));
const HomePage = lazy(() => import("./pages/HomePage"));
const BlackFridayPage = lazy(() => import("./pages/BlackFridayPage"));
const BasketsPage = lazy(() => import("./pages/BasketsPage"));
const DealsPage = lazy(() => import("./pages/DealsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const InventoryPage = lazy(() => import("./pages/admin/InventoryPage"));
const OutOfStockPage = lazy(() => import("./pages/admin/OutOfStockPage"));
const TestProductsPage = lazy(() => import("./pages/TestProductsPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const ReturnPolicyPage = lazy(() => import("./pages/ReturnPolicyPage"));
const AuthTestPage = lazy(() => import("./components/AuthTestPage").then(m => ({ default: m.AuthTestPage })));
const QuickMartAdminDashboard = lazy(() => import("./pages/quickmart/QuickMartAdminDashboard"));
const BuildYourBasket = lazy(() => import("./pages/BuildYourBasket"));
const ConsumerInsightsPage = lazy(() => import("./pages/ConsumerInsightsPage"));
const WhoWeServe = lazy(() => import("./pages/WhoWeServe"));

// Initialize Leta Client on app startup
const letaApiUrl = import.meta.env.VITE_LETA_API_URL || 'https://integrations.leta.ai';
const letaToken = import.meta.env.VITE_LETA_TOKEN;

if (letaToken) {
  try {
    initializeLetaClient({
      baseUrl: letaApiUrl,
      token: letaToken,
      timeout: 30000,
      retries: 3
    });
    console.log('[App] ✅ Leta client initialized successfully');
  } catch (error) {
    console.error('[App] ❌ Failed to initialize Leta client:', error);
  }
} else {
  console.warn('[App] ⚠️ Leta token not found in environment variables');
}

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



  function MaintenanceBanner() {
    return null; 
  }

  // Loading fallback component
  function PageLoader() {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  function AppContent() {
    const { showAddressModal, closeModal } = useAddressOnboarding();

    return (
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <MaintenanceBanner />
            <Suspense fallback={<PageLoader />}>
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
              <Route path="/return-policy" element={<ReturnPolicyPage />} />
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
              <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
              <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/inventory" element={<AdminGuard><InventoryPage /></AdminGuard>} />
              <Route path="/admin/inventory/out-of-stock" element={<AdminGuard><OutOfStockPage /></AdminGuard>} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/quickmart" element={<QuickMartAdminDashboard />} />
              <Route path="/build-your-basket" element={<BuildYourBasket />} />
              <Route path="/membership" element={<BuildYourBasket />} />
              <Route path="/who-we-serve" element={<WhoWeServe />} />
              {}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />

          {/* Address Onboarding Modal - shown after login if no address exists */}
          <AddressRequiredModal
            open={showAddressModal}
            onOpenChange={closeModal}
          />
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
