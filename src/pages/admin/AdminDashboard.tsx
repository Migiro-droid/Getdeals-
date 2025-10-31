import { useMemo, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"; // remaining charts
import RevenueTrendChart from '@/components/admin/RevenueTrendChart';
import AdvancedRevenueTrend from '@/components/admin/AdvancedRevenueTrend';
import { useOrders, OrderStatus, Order } from "@/contexts/OrdersContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, AlertTriangle, Truck, Clock, FileDown, User, Shield, Crown, MapPin, Phone, LogOut } from "lucide-react";

export default function AdminDashboard() {
  const { orders, metrics } = useOrders();
  const { settings, logout, role, user } = useAdmin();
  const navigate = useNavigate();
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "ytd" | "all">("7d");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Hide any lingering demo orders from admin analytics/views (extra safety)
  const isDemoOrder = (o: Order) => {
    const email = o.customer?.email || "";
    return o.demoSeed === true || o.id.startsWith("DEMO-") || email.endsWith("@example.com");
  };
  const safeOrders = useMemo(() => orders.filter(o => !isDemoOrder(o)), [orders]);
  
  // Memoize revenue orders to prevent chart flickering
  const revenueOrders = useMemo(() => 
    safeOrders.map(o => ({ date: o.date, total: o.total })), 
    [safeOrders]
  );

  // User display component
  const UserDisplay = () => {
    const getRoleIcon = () => {
      switch (role) {
        case "admin": return <Crown className="h-4 w-4 text-amber-600" />;
        case "staff": return <Shield className="h-4 w-4 text-blue-600" />;
        default: return <User className="h-4 w-4 text-gray-600" />;
      }
    };

    const getRoleColor = () => {
      switch (role) {
        case "admin": return "bg-amber-50 text-amber-800 border-amber-200";
        case "staff": return "bg-blue-50 text-blue-800 border-blue-200";
        default: return "bg-gray-50 text-gray-800 border-gray-200";
      }
    };

    const displayName = user?.name || user?.email || "Unknown User";
    const hasUserInfo = user?.name || user?.email;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${getRoleColor()}`}>
        {getRoleIcon()}
        <div className="flex flex-col">
          <span className="font-medium capitalize">{role}</span>
          {hasUserInfo && (
            <span className="text-xs opacity-75 truncate max-w-[120px]" title={displayName}>
              {displayName}
            </span>
          )}
        </div>
      </div>
    );
  };

  const fmtCurrency = (n: number) => `KES ${n.toLocaleString()}`;

  // Date helpers (stabilize base day to prevent chart flicker)
  const todayBase = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d; // stable for lifetime of component
  }, []);
  const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 30; // cap chart to 30 days for "all"
  const startDate = useMemo(() => {
    const d = new Date(todayBase);
    d.setDate(d.getDate() - (range === "all" ? 29 : rangeDays - 1));
    return d;
  }, [range, rangeDays, todayBase]);

  const ordersInRange = useMemo(() => {
    if (range === "all") return safeOrders;
    return safeOrders.filter((o) => new Date(o.date) >= startDate);
  }, [safeOrders, startDate, range]);

  // KPIs - Calculate revenue from all orders AND confirmed revenue from delivered orders
  const revenueInRange = useMemo(() => ordersInRange.reduce((s, o) => s + o.total, 0), [ordersInRange]);
  const confirmedRevenue = useMemo(() => 
    ordersInRange.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0), 
    [ordersInRange]
  );
  const aov = useMemo(() => (ordersInRange.length ? revenueInRange / ordersInRange.length : 0), [revenueInRange, ordersInRange]);
  const deliveredRate = useMemo(() => {
    const total = ordersInRange.length || 1;
    const delivered = ordersInRange.filter((o) => o.status === "delivered").length;
    return Math.round((delivered / total) * 100);
  }, [ordersInRange]);

  // Trend vs previous period
  const prevRevenue = useMemo(() => {
    const startPrev = new Date(startDate);
    const endPrev = new Date(startDate);
    endPrev.setDate(endPrev.getDate() - 1);
    startPrev.setDate(startPrev.getDate() - (rangeDays));
    const prev = orders.filter((o) => {
      const d = new Date(o.date);
      return d >= startPrev && d <= endPrev;
    });
    return prev.reduce((s, o) => s + o.total, 0);
  }, [orders, startDate, rangeDays]);

  const revenueDeltaPct = useMemo(() => {
    if (prevRevenue === 0) return null;
    return Math.round(((revenueInRange - prevRevenue) / prevRevenue) * 100);
  }, [revenueInRange, prevRevenue]);

  // Demo orders generator (used only when admin explicitly loads demo data)
  const genDemoOrders = useCallback((): Order[] => {
    const names = [
      { fn: "James", ln: "Mwangi" },
      { fn: "Aisha", ln: "Khan" },
      { fn: "Peter", ln: "Otieno" },
      { fn: "Grace", ln: "Wanjiru" },
      { fn: "John", ln: "Kamau" },
    ];
    const itemsPool = [
      { name: "Essential Basket", price: 3000 },
      { name: "Family Basket", price: 5000 },
      { name: "Rice", price: 450 },
      { name: "Sugar", price: 280 },
      { name: "Cooking Oil", price: 980 },
    ];
    const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    const pay: Order["paymentMethod"][] = ["mpesa", "card", "wallet"];
    const del: Order["deliveryMethod"][] = ["pickup", "speedy"];
    const out: Order[] = [];
    const nowTs = Date.now();
    const count = 12;
    for (let i = 0; i < count; i++) {
      const customer = names[i % names.length];
      const lineCount = 1 + (i % 3);
      const items = Array.from({ length: lineCount }).map((_, j) => {
        const p = itemsPool[(i + j) % itemsPool.length];
        const qty = ((i + j) % 3) + 1;
        return { id: `${p.name}-${j}`, name: p.name, price: p.price, quantity: qty };
      });
      const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
      const deliveryFee = del[i % del.length] === "speedy" ? 250 : 0;
      const total = subtotal + deliveryFee;
      const d = new Date(nowTs - i * 36_00_000); // space orders by 1h
      out.push({
        id: `DEMO-${nowTs}-${i}`,
        date: d.toISOString(),
        items,
        subtotal,
        deliveryFee,
        total,
        deliveryMethod: del[i % del.length],
        paymentMethod: pay[i % pay.length],
        customer: {
          firstName: customer.fn,
          lastName: customer.ln,
          phone: `07${(10000000 + (i * 1379)) % 99999999}`,
          email: `${customer.fn.toLowerCase()}.${customer.ln.toLowerCase()}@example.com`,
          address: i % 2 ? "Nairobi CBD, Kenyatta Ave" : undefined,
          pickupLocation: i % 2 ? undefined : "Quickmart Westlands",
        },
        status: statuses[i % statuses.length],
        note: i % 5 === 0 ? "Leave at reception" : undefined,
        demoSeed: true,
      });
    }
    return out;
  }, []);

  // Chart data: daily revenue for last N days
  // Stable daily series to prevent flicker: reuse point object references if label & value unchanged
  const dailyDataPrevRef = useRef<{ label: string; value: number }[] | null>(null);
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(todayBase);
      d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    for (const o of safeOrders) {
      const key = o.date.slice(0, 10);
      if (key in map) map[key] += o.total;
    }
    const next: { label: string; value: number }[] = [];
    const prev = dailyDataPrevRef.current || [];
    const keys = Object.keys(map); // already chronological based on construction order
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const d = new Date(k);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const value = map[k];
      const prevPoint = prev[i];
      if (prevPoint && prevPoint.label === label && prevPoint.value === value) {
        next.push(prevPoint); // reuse reference
      } else {
        next.push({ label, value });
      }
    }
    dailyDataPrevRef.current = next;
    return next;
  }, [safeOrders, rangeDays, todayBase]);

  // Memoized chart config object so child components don't re-render needlessly
  const revenueChartConfig = useMemo(() => ({
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  }), []);

  // Updated to match database constraint: pending, confirmed, shipped, delivered, cancelled
  const statusKeys: OrderStatus[] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const statusColors: Record<OrderStatus, string> = {
    pending: "#F59E0B",         // amber-500
    confirmed: "#3B82F6",       // blue-500
    shipped: "#A855F7",         // purple-500
    delivered: "#22C55E",       // green-500
    cancelled: "#F43F5E",       // rose-500
  };
  const statusDistribution = useMemo(() => {
    const byStatus = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    } as Record<OrderStatus, number>;
    for (const o of ordersInRange) byStatus[o.status]++;
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const row: any = { name: "Orders" };
    statusKeys.forEach((k) => {
      const cnt = byStatus[k] || 0;
      row[k] = total ? Math.round((cnt / total) * 100) : 0;
    });
    return { data: [row], total };
  }, [ordersInRange]);
  const statusLegend = useMemo(() => {
    const byStatus = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    } as Record<OrderStatus, number>;
    for (const o of ordersInRange) byStatus[o.status]++;
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
    return statusKeys
      .map((k) => ({
        key: k,
        label: k.replace(/_/g, " "),
        count: byStatus[k] || 0,
        perc: Math.round(((byStatus[k] || 0) / total) * 100),
        color: statusColors[k],
      }))
      .sort((a, b) => b.count - a.count);
  }, [ordersInRange]);

  // Payment & Delivery breakdowns
  const labelPayment = (m: string) => (m === "mpesa" ? "M-Pesa" : m.charAt(0).toUpperCase() + m.slice(1));
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { mpesa: 0, card: 0, wallet: 0 };
    for (const o of ordersInRange) map[o.paymentMethod] = (map[o.paymentMethod] || 0) + 1;
    return Object.entries(map).map(([k, v]) => ({ key: k, label: labelPayment(k), value: v }));
  }, [ordersInRange]);

  const deliveryBreakdown = useMemo(() => {
    const map: Record<string, number> = { pickup: 0, speedy: 0 };
    for (const o of ordersInRange) map[o.deliveryMethod] = (map[o.deliveryMethod] || 0) + 1;
    return Object.entries(map).map(([k, v]) => ({ key: k, label: k === "speedy" ? "Speedy" : "Pickup", value: v }));
  }, [ordersInRange]);

  // Enhanced top products with detailed analytics
  const topProducts = useMemo(() => {
    const map: Record<string, { 
      qty: number; 
      revenue: number; 
      orders: number; 
      customers: Set<string>;
      branches: Record<string, number>;
      avgOrderValue: number;
    }> = {};
    
    // Mock branch data - in real app this would come from order location data
    const branches = ["Karen Branch", "Westlands Branch", "CBD Branch", "Kilimani Branch"];
    const getBranch = (orderId: string) => branches[orderId.length % branches.length];
    
    for (const o of ordersInRange) {
      const branch = getBranch(o.id);
      for (const it of o.items) {
        if (!map[it.name]) {
          map[it.name] = { 
            qty: 0, 
            revenue: 0, 
            orders: 0, 
            customers: new Set(), 
            branches: {},
            avgOrderValue: 0
          };
        }
        map[it.name].qty += it.quantity;
        map[it.name].revenue += it.quantity * it.price;
        map[it.name].customers.add(o.customer.phone);
        map[it.name].branches[branch] = (map[it.name].branches[branch] || 0) + it.quantity;
      }
    }
    
    // Calculate orders per product and avg order value
    for (const o of ordersInRange) {
      const productNames = o.items.map(it => it.name);
      for (const name of productNames) {
        if (map[name]) {
          map[name].orders++;
        }
      }
    }
    
    return Object.entries(map)
      .map(([name, vals]) => ({
        name,
        qty: vals.qty,
        revenue: vals.revenue,
        orders: vals.orders,
        uniqueCustomers: vals.customers.size,
        topBranch: Object.entries(vals.branches).sort(([,a], [,b]) => b - a)[0],
        avgOrderValue: vals.orders > 0 ? Math.round(vals.revenue / vals.orders) : 0,
        frequency: vals.orders > 0 ? Math.round(vals.qty / vals.orders * 10) / 10 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [ordersInRange]);

  // Customer analytics for modal
  const customerAnalytics = useMemo(() => {
    const customerMap: Record<string, {
      phone: string;
      name: string;
      email: string;
      orders: number;
      totalSpent: number;
      lastOrder: string;
      preferredLocation: string;
      orderFrequency: number;
    }> = {};

    // Mock QuickMart locations
    const locations = ["Karen Branch", "Westlands Branch", "CBD Branch", "Kilimani Branch", "Lavington Branch"];
    
    for (const order of ordersInRange) {
      const phone = order.customer.phone;
      const name = `${order.customer.firstName} ${order.customer.lastName}`.trim() || phone;
      
      if (!customerMap[phone]) {
        customerMap[phone] = {
          phone,
          name,
          email: order.customer.email || `${phone}@quickmart.co.ke`,
          orders: 0,
          totalSpent: 0,
          lastOrder: order.date,
          preferredLocation: locations[phone.length % locations.length], // Mock location based on phone
          orderFrequency: 0
        };
      }
      
      customerMap[phone].orders += 1;
      customerMap[phone].totalSpent += order.total;
      
      // Update last order if this one is more recent
      if (new Date(order.date) > new Date(customerMap[phone].lastOrder)) {
        customerMap[phone].lastOrder = order.date;
      }
    }

    // Calculate order frequency (orders per month based on date range)
    const rangeMonths = range === "7d" ? 0.25 : range === "30d" ? 1 : 12;
    Object.values(customerMap).forEach(customer => {
      customer.orderFrequency = customer.orders / rangeMonths;
    });

    return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [ordersInRange, range]);

  // Ops snapshot (today) - Updated for new status values
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(() => safeOrders.filter((o) => o.date.slice(0, 10) === todayKey), [safeOrders, todayKey]);
  const todayCounts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, shipped: 0, cancelled: 0 };
    for (const o of todayOrders) {
      if (o.status in c) c[o.status]++;
    }
    return c;
  }, [todayOrders]);

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "id",
      "date",
      "customer_name",
      "phone",
      "email",
      "delivery_method",
      "payment_method",
      "status",
      "subtotal",
      "delivery_fee",
      "total",
      "items",
    ];
  const rows = safeOrders.map((o) => {
      const name = `${o.customer.firstName} ${o.customer.lastName}`.trim();
      const items = o.items.map((i) => `${i.name} x${i.quantity}`).join("; ");
      return [
        o.id,
        o.date,
        name,
        o.customer.phone,
        o.customer.email,
        o.deliveryMethod,
        o.paymentMethod,
        o.status,
        String(o.subtotal),
        String(o.deliveryFee),
        String(o.total),
        items,
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
  a.download = `orders_export_${todayKey}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusPill = (s: string) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs";
    switch (s) {
      case "pending":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "confirmed":
        return `${base} bg-blue-100 text-blue-800`;
      case "shipped":
        return `${base} bg-purple-100 text-purple-800`;
      case "delivered":
        return `${base} bg-green-100 text-green-800`;
      case "cancelled":
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor sales, orders, and site status at a glance.</p>
          </div>
          <div className="flex items-center gap-3">
            <UserDisplay />
            <div className="inline-flex rounded-md border p-1">
              {(["7d", "30d", "all"] as const).map((r) => (
                <button
                  key={r}
                  className={`px-3 py-1 text-sm rounded ${r === range ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  onClick={() => setRange(r)}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Unified demo data toggle: loads/clears both orders & inventory */}
            <Button variant="outline" onClick={logout} title="Sign out of admin area">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>

        {/* System Alerts */}
  {settings.maintenanceMode && (
          <Card className="border-yellow-300/50">
            <CardContent className="py-4 flex items-center gap-3 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="font-medium">Maintenance mode is ON</div>
                <div className="text-sm">Customers see a maintenance banner. Turn it off in Settings when ready.</div>
              </div>
              <div className="ml-auto">
                <Button variant="outline" asChild><Link to="/admin/settings">Go to Settings</Link></Button>
              </div>
            </CardContent>
          </Card>
  )}

        {/* Main Analytics Charts */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Trend - Takes 2 columns */}
            <div className="lg:col-span-2">
              <AdvancedRevenueTrend initialRange={range === 'all' ? 'total' : range as any} orders={revenueOrders} />
            </div>

            {/* Order Pipeline - Takes 1 column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Order Pipeline
                  <Badge variant="outline" className="font-mono">
                    {statusDistribution.total} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Donut chart with center metric */}
                  <div className="relative mx-auto w-48 h-48">
                    <ChartContainer
                      config={{
                        delivered: { label: "Delivered", color: statusColors.delivered },
                        pending: { label: "Pending", color: statusColors.pending },
                        confirmed: { label: "Confirmed", color: statusColors.confirmed },
                        shipped: { label: "Shipped", color: statusColors.shipped },
                        cancelled: { label: "Cancelled", color: statusColors.cancelled },
                      }}
                      className="w-full h-full"
                    >
                      <PieChart>
                        <Pie
                          data={statusLegend.filter(s => s.count > 0)}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          startAngle={90}
                          endAngle={450}
                        >
                          {statusLegend.filter(s => s.count > 0).map((s) => (
                            <Cell key={s.key} fill={s.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg shadow-lg p-3">
                                  <div className="font-medium capitalize">{data.label}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {data.count} orders ({data.perc}%)
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ChartContainer>
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-2xl font-bold text-green-600">
                        {statusLegend.find(s => s.key === "delivered")?.perc || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground text-center leading-tight">
                        Success<br />Rate
                      </div>
                    </div>
                  </div>

                  {/* Status breakdown with progress bars */}
                  <div className="space-y-3">
                    {statusLegend
                      .filter(s => s.count > 0)
                      .slice(0, 4)
                      .map((s) => (
                      <div key={s.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: s.color }} 
                            />
                            <span className="capitalize font-medium">{s.label}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-muted-foreground">{s.count}</span>
                            <span className="min-w-[3ch] text-right">{s.perc}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              backgroundColor: s.color, 
                              width: `${s.perc}%`,
                              opacity: 0.8
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Show remaining statuses as compact list if any */}
                    {statusLegend.filter(s => s.count > 0).length > 4 && (
                      <div className="pt-2 border-t border-muted">
                        <div className="text-xs text-muted-foreground mb-2">Other statuses:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {statusLegend
                            .filter(s => s.count > 0)
                            .slice(4)
                            .map((s) => (
                            <div key={s.key} className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div 
                                  className="h-1 w-1 rounded-full" 
                                  style={{ backgroundColor: s.color }} 
                                />
                                <span className="capitalize truncate">{s.label}</span>
                              </div>
                              <span className="font-mono">{s.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Business Intelligence */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Business Intelligence</h2>
          
          {/* Top Row - Key Business Metrics */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Top Products Analytics - Full width showcase */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  🏆 Top Performing Products
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{range.toUpperCase()}</Badge>
                    <Badge variant="secondary" className="font-mono">{topProducts.length} products</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length > 0 ? (
                    topProducts.map((p, index) => (
                      <div key={p.name} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/20">
                        {/* Left side: Rank, Product info, and key metrics */}
                        <div className="flex items-center gap-4 flex-1">
                          {/* Rank badge */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                            #{index + 1}
                          </div>
                          
                          {/* Product details */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base leading-tight mb-1">{p.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <span className="font-mono text-blue-600">×{p.qty}</span>
                                <span>units sold</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className="font-mono text-amber-600">{p.frequency}</span>
                                <span>avg per order</span>
                              </span>
                              <span>•</span>
                              <span>{p.orders} orders from {p.uniqueCustomers} customers</span>
                            </div>
                            {/* Branch performance */}
                            {p.topBranch && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-emerald-700 font-medium">
                                  Best at {p.topBranch[0]} ({p.topBranch[1]} units)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Right side: Revenue and avg order value */}
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Avg Order Value</div>
                            <div className="font-semibold text-purple-600">{fmtCurrency(p.avgOrderValue)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Revenue</div>
                            <div className="font-bold text-xl text-green-600">{fmtCurrency(Math.round(p.revenue))}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <div>No sales data available for this period.</div>
                      <div className="text-sm">Try changing the time range or load demo data.</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Customer & Operations Insights */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Payment Methods with enhanced insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💳 Payment Insights
                  <Badge variant="outline" className="text-xs">{paymentBreakdown.reduce((sum, p) => sum + p.value, 0)} orders</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Payment method breakdown */}
                  <div className="space-y-3">
                    {paymentBreakdown
                      .sort((a, b) => b.value - a.value)
                      .map((p, index) => {
                        const total = paymentBreakdown.reduce((sum, method) => sum + method.value, 0);
                        const percentage = total > 0 ? Math.round((p.value / total) * 100) : 0;
                        const isTop = index === 0;
                        return (
                          <div key={p.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isTop && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                                <span className={`text-sm ${isTop ? 'font-medium' : ''}`}>{p.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">{p.value}</span>
                                <span className="text-xs text-muted-foreground w-8 text-right">{percentage}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${isTop ? 'bg-green-500' : 'bg-primary/60'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Methods with insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚚 Delivery Insights
                  <Badge variant="outline" className="text-xs">{deliveryBreakdown.reduce((sum, d) => sum + d.value, 0)} orders</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Delivery preference */}
                  <div className="space-y-3">
                    {deliveryBreakdown
                      .sort((a, b) => b.value - a.value)
                      .map((d, index) => {
                        const total = deliveryBreakdown.reduce((sum, method) => sum + method.value, 0);
                        const percentage = total > 0 ? Math.round((d.value / total) * 100) : 0;
                        const isPreferred = index === 0;
                        return (
                          <div key={d.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isPreferred && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                                <span className={`text-sm ${isPreferred ? 'font-medium' : ''}`}>{d.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">{d.value}</span>
                                <span className="text-xs text-muted-foreground w-8 text-right">{percentage}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${isPreferred ? 'bg-blue-500' : 'bg-primary/60'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Delivery insights */}
                  <div className="pt-3 border-t border-muted">
                    <div className="text-xs text-muted-foreground mb-2">Insights</div>
                    {deliveryBreakdown.find(d => d.key === 'speedy')?.value > deliveryBreakdown.find(d => d.key === 'pickup')?.value ? (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        📈 Customers prefer speedy delivery
                      </div>
                    ) : (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        🏪 Most customers choose pickup
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Behavior Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Customer Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Customer metrics */}
                  <div className="space-y-3">
                    <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
                      <DialogTrigger asChild>
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                          <span className="text-sm">Unique Customers</span>
                          <span className="font-bold text-blue-600">
                            {new Set(ordersInRange.map(o => o.customer.phone)).size}
                          </span>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Customer Analytics - {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}</DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[60vh]">
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="bg-blue-50 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">{customerAnalytics.length}</div>
                                <div className="text-sm text-blue-800">Total Customers</div>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {customerAnalytics.length > 0 ? Math.round(customerAnalytics.reduce((sum, c) => sum + c.totalSpent, 0) / customerAnalytics.length) : 0}
                                </div>
                                <div className="text-sm text-green-800">Avg Customer Value</div>
                              </div>
                              <div className="bg-purple-50 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {customerAnalytics.length > 0 ? Math.round(customerAnalytics.reduce((sum, c) => sum + c.orders, 0) / customerAnalytics.length * 10) / 10 : 0}
                                </div>
                                <div className="text-sm text-purple-800">Avg Orders/Customer</div>
                              </div>
                            </div>
                            
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Contact</TableHead>
                                  <TableHead>Orders</TableHead>
                                  <TableHead>Total Spent</TableHead>
                                  <TableHead>Preferred Location</TableHead>
                                  <TableHead>Last Order</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customerAnalytics.map((customer) => (
                                  <TableRow key={customer.phone}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{customer.name}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          Customer ID: {customer.phone.slice(-4)}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-sm">
                                          <Phone className="h-3 w-3" />
                                          {customer.phone}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{customer.orders}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {customer.orderFrequency.toFixed(1)}/month
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">KES {customer.totalSpent.toLocaleString()}</div>
                                        <div className="text-sm text-muted-foreground">
                                          Avg: KES {Math.round(customer.totalSpent / customer.orders).toLocaleString()}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-orange-600" />
                                        <span className="text-sm">{customer.preferredLocation}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {new Date(customer.lastOrder).toLocaleDateString()}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">Repeat Rate</span>
                      <span className="font-bold text-green-600">
                        {Math.round((ordersInRange.length / Math.max(new Set(ordersInRange.map(o => o.customer.phone)).size, 1) - 1) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm">Avg Items/Order</span>
                      <span className="font-bold text-purple-600">
                        {ordersInRange.length > 0 ? Math.round((ordersInRange.reduce((sum, o) => sum + o.items.length, 0) / ordersInRange.length) * 10) / 10 : 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Customer insight */}
                  <div className="pt-3 border-t border-muted">
                    <div className="text-xs text-muted-foreground mb-2">Insight</div>
                    {ordersInRange.length / Math.max(new Set(ordersInRange.map(o => o.customer.phone)).size, 1) > 1.5 ? (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        💚 High customer loyalty
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        📈 Focus on retention
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-emerald-50 rounded">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-bold text-emerald-600">
                        {deliveredRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-indigo-50 rounded">
                      <span className="text-sm">Orders/Day</span>
                      <span className="font-bold text-indigo-600">
                        {Math.round(ordersInRange.length / (rangeDays || 1) * 10) / 10}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-rose-50 rounded">
                      <span className="text-sm">Revenue/Day</span>
                      <span className="font-bold text-rose-600">
                        {fmtCurrency(Math.round(revenueInRange / (rangeDays || 1)))}
                      </span>
                    </div>
                  </div>
                  
                  {/* Performance trend */}
                  <div className="pt-3 border-t border-muted">
                    <div className="text-xs text-muted-foreground mb-2">Trend</div>
                    {revenueDeltaPct !== null ? (
                      <div className={`text-sm p-2 rounded ${
                        revenueDeltaPct >= 10 ? 'text-green-600 bg-green-50' :
                        revenueDeltaPct >= 0 ? 'text-blue-600 bg-blue-50' :
                        revenueDeltaPct >= -10 ? 'text-amber-600 bg-amber-50' :
                        'text-red-600 bg-red-50'
                      }`}>
                        {revenueDeltaPct >= 10 ? '🚀 Strong growth' :
                         revenueDeltaPct >= 0 ? '📈 Growing' :
                         revenueDeltaPct >= -10 ? '📊 Stable' :
                         '📉 Needs attention'}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        📊 No trend data available
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Operations & Management */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Operations & Management</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Orders - Takes 2 columns */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={exportCSV}><FileDown className="h-4 w-4 mr-2" /> Export CSV</Button>
                  <Button variant="outline" asChild><Link to="/admin/orders">View all</Link></Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap min-w-[120px]">Order</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[140px]">Date</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[160px]">Customer</TableHead>
                      <TableHead className="text-right whitespace-nowrap min-w-[100px]">Total</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeOrders.slice(0, 6).map((o) => {
                      const d = new Date(o.date);
                      const dateStr = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                      const name = `${o.customer.firstName} ${o.customer.lastName}`.trim();
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium whitespace-nowrap py-6">{o.id}</TableCell>
                          <TableCell className="whitespace-nowrap py-6">{dateStr}</TableCell>
                          <TableCell className="whitespace-nowrap py-6">{name || o.customer.phone}</TableCell>
                          <TableCell className="text-right whitespace-nowrap py-6">{fmtCurrency(o.total)}</TableCell>
                          <TableCell className="whitespace-nowrap py-6"><span className={statusPill(o.status)}>{o.status.replace(/_/g, " ")}</span></TableCell>
                        </TableRow>
                      );
                    })}
                    {safeOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No orders yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Management Panel - Takes 1 column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full"><a href="/admin/products">Add or Edit Products</a></Button>
                  <Button asChild variant="outline" className="w-full"><a href="/admin/orders">Manage Orders</a></Button>
                  <Button asChild variant="outline" className="w-full"><a href="/admin/users">User Management</a></Button>
                  <Button asChild variant="outline" className="w-full"><a href="/admin/inventory">View Inventory</a></Button>
                  <Button asChild variant="outline" className="w-full"><a href="/admin/inventory/out-of-stock">Out of Stock Items</a></Button>
                  <Button asChild variant="outline" className="w-full"><a href="/admin/settings">Site Settings</a></Button>
                  { !settings.blackFridayEnabled && (
                    <div className="pt-2">
                      <Badge variant="secondary" className="w-full justify-center py-2">Black Friday disabled</Badge>
                    </div>
                  ) }
                </CardContent>
              </Card>

              {/* Today's Operations Snapshot */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium">Pending</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-600">{todayCounts.pending}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Out for Delivery</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{todayCounts.out_for_delivery}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-medium">Cancelled</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">{todayCounts.cancelled}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
