import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { LogOut, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { QuickMartAdminOrders } from './QuickMartAdminOrders';
import { QuickMartAdminProducts } from './QuickMartAdminProducts';
import { QuickMartAdminAnalytics } from './QuickMartAdminAnalytics';

export const QuickMartAdminDashboard: React.FC = () => {
  const { user, isAuthenticated, signOut, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Check if user is Quickmart or Global admin
  const isQuickMartAdmin = user?.role === 'quickmart' || user?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated || !isQuickMartAdmin) {
      // User is not authorized - component will show access denied
    }
  }, [isAuthenticated, isQuickMartAdmin]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMsg);
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        {/* Modal Container */}
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
            {/* Header with Logo */}
            <div className="flex flex-col items-center space-y-4">
              <img 
                src="https://tse2.mm.bing.net/th/id/OIP.JJK7Zh2Cg1CVxA98q6FZUwHaE8?cb=12&pid=ImgDet&w=178&h=118&c=7&dpr=1.5&o=7&rm=3" 
                alt="Quickmart Logo" 
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '';
                }}
              />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Quickmart Admin</h1>
                <p className="text-sm text-gray-600 mt-2">Secure Access Portal</p>
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-10 px-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-10 px-4 pr-12 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-blue-700">Admin Access:</span> This portal is restricted to authorized Quickmart administrators only. If you don't have credentials, please contact your system administrator.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            GetDeals Kenya © 2025 • Quickmart Management System
          </p>
        </div>
      </div>
    );
  }

  if (!isQuickMartAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <Shield className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access the Quickmart Admin Dashboard. 
              Only Quickmart and Global admins can access this area.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Your Role: <span className="font-semibold">{user?.role || 'Unknown'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <img 
                src="https://tse2.mm.bing.net/th/id/OIP.JJK7Zh2Cg1CVxA98q6FZUwHaE8?cb=12&pid=ImgDet&w=178&h=118&c=7&dpr=1.5&o=7&rm=3" 
                alt="Quickmart Logo" 
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  // Fallback if logo doesn't load
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-right">
                <div className="font-medium text-gray-900">
                  {user?.name || user?.email}
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  {user?.role === 'admin' ? 'Global Admin' : 'Quickmart Admin'}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 flex items-center gap-4 border-b">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="orders"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none py-3 px-1 font-medium"
              >
                📋 Orders
              </TabsTrigger>
              <TabsTrigger 
                value="products"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none py-3 px-1 font-medium"
              >
                📦 Products
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none py-3 px-1 font-medium"
              >
                📊 Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <QuickMartAdminOrders />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <QuickMartAdminProducts />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <QuickMartAdminAnalytics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuickMartAdminDashboard;
