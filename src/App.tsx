import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { Header } from "@/components/Header";
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
import AdminGate from "./pages/admin/AdminGate";
import { useAdmin } from "@/contexts/AdminContext";
import WalletPage from "./pages/WalletPage";

const queryClient = new QueryClient();

const AdminRoutes = () => {
  const { isAdmin } = useAdmin();
  return isAdmin ? (
    <>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </>
  ) : (
    <Route path="/admin/*" element={<AdminGate />} />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <WalletProvider>
        <OrdersProvider>
        <AdminProvider>
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
                <Route path="/wallet" element={<WalletPage />} />
                <AdminRoutes />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
  </AdminProvider>
  </OrdersProvider>
  </WalletProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

function MaintenanceBanner() {
  const { settings } = useAdmin();
  if (!settings.maintenanceMode) return null;
  return (
    <div className="bg-yellow-100 text-yellow-800 text-sm py-2">
      <div className="container mx-auto px-4">Maintenance mode active. Some features may be limited.</div>
    </div>
  );
}
