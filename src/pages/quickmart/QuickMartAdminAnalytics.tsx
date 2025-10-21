import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { useOrders } from '@/contexts/OrdersContext';
import { useProducts } from '@/contexts/ProductsContext';

interface BranchMetrics {
  name: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

interface ProductMetrics {
  name: string;
  sold: number;
  revenue: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const QuickMartAdminAnalytics: React.FC = () => {
  const { orders } = useOrders();
  const { all: products } = useProducts();

  // Filter Quickmart-specific data
  const quickmartOrders = useMemo(() => 
    orders.filter(o => 
      (o.id as string).includes('QM') || 
      (o as any).vendor === 'quickmart'
    ),
    [orders]
  );

  const quickmartProducts = useMemo(() =>
    products.filter(p => 
      p.category === 'quickmart' || p.category?.toLowerCase().includes('quickmart')
    ),
    [products]
  );

  // Branch Performance Metrics
  const branchMetrics = useMemo<BranchMetrics[]>(() => {
    const branchMap = new Map<string, { orders: number; revenue: number }>();

    quickmartOrders.forEach(order => {
      const branch = (order as any).branch || 'Default Branch';
      const current = branchMap.get(branch) || { orders: 0, revenue: 0 };
      branchMap.set(branch, {
        orders: current.orders + 1,
        revenue: current.revenue + (order.total || 0)
      });
    });

    return Array.from(branchMap.entries()).map(([name, data]) => ({
      name,
      orders: data.orders,
      revenue: data.revenue,
      avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [quickmartOrders]);

  // Top Selling Products
  const topProducts = useMemo<ProductMetrics[]>(() => {
    const productMap = new Map<string, { sold: number; revenue: number }>();

    quickmartOrders.forEach(order => {
      order.items?.forEach(item => {
        const current = productMap.get(item.name) || { sold: 0, revenue: 0 };
        productMap.set(item.name, {
          sold: current.sold + (item.quantity || 1),
          revenue: current.revenue + ((item.price || 0) * (item.quantity || 1))
        });
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        sold: data.sold,
        revenue: data.revenue
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);
  }, [quickmartOrders]);

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = quickmartOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = quickmartOrders.length;
    const totalProducts = quickmartProducts.length;
    const lowStockProducts = quickmartProducts.filter(p => (p as any).stock < 10).length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      lowStockProducts,
      avgOrderValue,
      topBranch: branchMetrics[0]?.name || 'N/A',
      topBranchRevenue: branchMetrics[0]?.revenue || 0
    };
  }, [quickmartOrders, quickmartProducts, branchMetrics]);

  // Daily Revenue Chart Data
  const dailyRevenueData = useMemo(() => {
    const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();

    quickmartOrders.forEach(order => {
      const date = new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const current = dayMap.get(date) || { date, revenue: 0, orders: 0 };
      dayMap.set(date, {
        date,
        revenue: current.revenue + (order.total || 0),
        orders: current.orders + 1
      });
    });

    return Array.from(dayMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [quickmartOrders]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold">📊 Performance Analytics</h2>
        </div>
        <p className="text-sm text-gray-600">View your Quickmart business metrics, trends, and branch performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">KES {(kpis.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{kpis.totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">KES {kpis.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{kpis.lowStockProducts}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Branches by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {branchMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `KES ${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No branch data available</p>
            )}
          </CardContent>
        </Card>

        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `KES ${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No revenue data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="sold" fill="#10b981" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Branch Performance Table */}
      {branchMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Branch Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {branchMetrics.map((branch, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{branch.name}</p>
                      <p className="text-sm text-muted-foreground">{branch.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">KES {branch.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Avg: KES {branch.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
