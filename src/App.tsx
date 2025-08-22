import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { Header } from "@/components/Header";
import { AuthProvider } from "./contexts/AuthContext";
import { AccountProvider } from "./contexts/AccountContext";
import { Footer } from "@/components/Footer";
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
import AuthPage from "./pages/AuthPage";
import { QuickMartDashboard } from "./pages/quickmart/QuickMartDashboard";

const queryClient = new QueryClient();

import { useAuth } from "./contexts/AuthContext";


function AdminGuard({ children }: { children: JSX.Element }) {
  const { isAuthenticated, user } = useAuth();
  const { setIsAdmin, setAdminUser } = useAdmin();
  
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      setAdminUser({ name: user.name, email: user.email });
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      setAdminUser(null);
    }
  }, [isAuthenticated, user, setAdminUser, setIsAdmin]);

  // Require authentication and admin role
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

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Insufficient Permissions
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access the admin area.
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <WalletProvider>
          <OrdersProvider>
            <AdminProvider>
              <ProductsProvider>
                <InventoryProvider>
                  <AuthProvider>
                    <AccountProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <div className="min-h-screen flex flex-col">
                          <Header />
                          <main className="flex-1">
                            {/* Maintenance banner */}
                            <MaintenanceBanner />
                            <Routes>
                              <Route path="/" element={<HomePage />} />
                              <Route path="/baskets" element={<BasketsPage />} />
                              <Route path="/cart" element={<CartPage />} />
                              <Route path="/checkout" element={<CheckoutPage />} />
                              <Route path="/contact" element={<ContactPage />} />
                              <Route path="/about" element={<AboutPage />} />
                              <Route path="/how-it-works" element={<HowItWorksPage />} />
                              <Route path="/account" element={<AccountPage />} />
                              <Route path="/faq" element={<FAQPage />} />
                              <Route path="/test-products" element={<TestProductsPage />} />
                              <Route path="/wallet" element={<WalletPage />} />
                              <Route path="/auth" element={<AuthPage />} />
                              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                              <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
                              <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
                              <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
                              <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
                              <Route path="/admin/inventory" element={<AdminGuard><InventoryPage /></AdminGuard>} />
                              <Route path="/admin/inventory/out-of-stock" element={<AdminGuard><OutOfStockPage /></AdminGuard>} />
                              <Route path="/quickmart" element={<QuickMartDashboard />} />
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </main>
                          <Footer />
                        </div>
                      </BrowserRouter>
                    </AccountProvider>
                  </AuthProvider>
                </InventoryProvider>
              </ProductsProvider>
            </AdminProvider>
          </OrdersProvider>
        </WalletProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

function MaintenanceBanner() {
  const { isAuthenticated } = useAuth();
  
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
