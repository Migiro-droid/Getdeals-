import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Bar, BarChart, PieChart, Pie, Cell } from "recharts";
import { useOrders, OrderStatus } from "@/contexts/OrdersContext";
import { useProducts } from "@/contexts/ProductsContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShoppingBag, Wallet, Settings, AlertTriangle, Truck, CheckCircle, Clock, FileDown } from "lucide-react";

export default function AdminDashboard() {
  const { orders, metrics, seedOrders } = useOrders();
  const { settings, logout } = useAdmin();
  const { all: products } = useProducts();
  const [range, setRange] = useState<"7d" | "30d" | "all">("7d");

  const fmtCurrency = (n: number) => `KES ${n.toLocaleString()}`;

  // Date helpers
  const now = new Date();
  const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 30; // cap chart to 30 days for "all"
  const startDate = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - (range === "all" ? 29 : rangeDays - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [range, rangeDays]);

  const ordersInRange = useMemo(() => {
    if (range === "all") return orders;
    return orders.filter((o) => new Date(o.date) >= startDate);
  }, [orders, startDate, range]);

  // KPIs
  const revenueInRange = useMemo(() => ordersInRange.reduce((s, o) => s + o.total, 0), [ordersInRange]);
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

  // Demo data generator
  // Demo data generator using live products
  const genDemoOrders = () => {
    const statuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"] as const;
    const pay = ["mpesa", "card", "wallet", "cash"] as const;
    const del = ["pickup", "speedy"] as const;
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = <T,>(arr: readonly T[]) => arr[rand(0, arr.length - 1)];
    const prods = products.length > 0 ? products : [];
    const out: any[] = [];
    const today = new Date();
    for (let d = 0; d < 30; d++) { // last 30 days
      const day = new Date(today);
      day.setDate(day.getDate() - d);
      const ordersCount = rand(0, 4);
      for (let k = 0; k < ordersCount; k++) {
        const itemsCount = rand(1, 3);
        const items = prods.length > 0
          ? Array.from({ length: itemsCount }).map(() => {
              const p = pick(prods);
              const qty = rand(1, 3);
              return { id: p.id, name: p.name, price: p.price, quantity: qty, image: p.image };
            })
          : [];
        const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
        const deliveryFee = pick(del) === "speedy" ? 200 : 0;
        const total = subtotal + deliveryFee;
        const date = new Date(day);
        date.setHours(rand(8, 20), rand(0, 59), rand(0, 59), 0);
        out.push({
          id: `DEMO-${date.getTime()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
          date: date.toISOString(),
          items,
          subtotal,
          deliveryFee,
          total,
          deliveryMethod: pick(del),
          paymentMethod: pick(pay),
          customer: {
            firstName: ["Mary", "John", "Alice", "Brian", "Grace"][rand(0,4)],
            lastName: ["W.", "K.", "M.", "N.", "O."][rand(0,4)],
            phone: `+2547${rand(0, 99_999_999).toString().padStart(8, '0')}`,
            email: `demo${rand(1000,9999)}@example.com`,
          },
          status: pick(statuses),
        });
      }
    }
    // bias some delivered
    out.forEach((o) => {
      if (Math.random() < 0.55) o.status = "delivered";
    });
    return out;
  };

  // Chart data: daily revenue for last N days
  const dailyData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    const map: Record<string, number> = {};
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    for (const o of orders) {
      const key = o.date.slice(0, 10);
      if (key in map) map[key] += o.total;
    }
    Object.keys(map).forEach((k) => {
      const d = new Date(k);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      days.push({ label, value: map[k] });
    });
    return days;
  }, [orders, rangeDays]);

  const statusKeys: OrderStatus[] = [
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];
  const statusColors: Record<OrderStatus, string> = {
    pending: "#F59E0B",         // amber-500
    confirmed: "#3B82F6",       // blue-500
    preparing: "#A855F7",       // purple-500
    out_for_delivery: "#F59E0B", // amber-500 (same family)
    delivered: "#22C55E",       // green-500
    cancelled: "#F43F5E",       // rose-500
  };
  const statusDistribution = useMemo(() => {
    const total = Object.values(metrics.byStatus).reduce((a, b) => a + b, 0);
    const row: any = { name: "Orders" };
    statusKeys.forEach((k) => {
      const cnt = metrics.byStatus[k] || 0;
      row[k] = total ? Math.round((cnt / total) * 100) : 0;
    });
    return { data: [row], total };
  }, [metrics.byStatus]);
  const statusLegend = useMemo(() => {
    const total = Object.values(metrics.byStatus).reduce((a, b) => a + b, 0) || 1;
    return statusKeys
      .map((k) => ({
        key: k,
        label: k.replace(/_/g, " "),
        count: metrics.byStatus[k] || 0,
        perc: Math.round(((metrics.byStatus[k] || 0) / total) * 100),
        color: statusColors[k],
      }))
      .sort((a, b) => b.count - a.count);
  }, [metrics.byStatus]);

  // Payment & Delivery breakdowns
  const labelPayment = (m: string) => (m === "mpesa" ? "M-Pesa" : m.charAt(0).toUpperCase() + m.slice(1));
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { mpesa: 0, card: 0, wallet: 0, cash: 0 };
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

  // Ops snapshot (today)
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(() => orders.filter((o) => o.date.slice(0, 10) === todayKey), [orders, todayKey]);
  const todayCounts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, out_for_delivery: 0, cancelled: 0 };
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
    const rows = orders.map((o) => {
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
      case "preparing":
        return `${base} bg-purple-100 text-purple-800`;
      case "out_for_delivery":
        return `${base} bg-amber-100 text-amber-800`;
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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor sales, orders, and site status at a glance.</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" onClick={() => seedOrders(genDemoOrders(), true)}>Load Demo Data</Button>
            <Button variant="outline" onClick={logout}>Exit Admin</Button>
          </div>
        </div>

        {settings.maintenanceMode && (
          <Card className="mb-6 border-yellow-300/50">
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

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Revenue ({range.toUpperCase()})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{fmtCurrency(revenueInRange)}</div>
              {revenueDeltaPct !== null && (
                <div className={`mt-1 flex items-center gap-1 text-sm ${revenueDeltaPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {revenueDeltaPct >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span>{Math.abs(revenueDeltaPct)}% vs prev period</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Orders (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{metrics.todayCount}</div>
              <div className="mt-1 text-sm text-muted-foreground">All-time: {metrics.orderCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Wallet className="h-4 w-4" /> Avg Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{fmtCurrency(Math.round(aov))}</div>
              <div className="mt-1 text-sm text-muted-foreground">Across {ordersInRange.length} orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4" /> Delivered Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{deliveredRate}%</div>
              <div className="mt-1 text-sm text-muted-foreground">of orders delivered</div>
            </CardContent>
          </Card>
        </div>

  {/* Charts */}
        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" } }} className="w-full">
                <LineChart data={dailyData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v/1000)}k` : String(v))} />
                  <ChartTooltip content={<ChartTooltipContent nameKey="revenue" />} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
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
                      preparing: { label: "Preparing", color: statusColors.preparing },
                      out_for_delivery: { label: "Out for delivery", color: statusColors.out_for_delivery },
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
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

        {/* More Insights */}
        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ pm: { label: "Count", color: "hsl(var(--primary))" } }} className="w-full">
                <PieChart>
                  <Pie data={paymentBreakdown} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {paymentBreakdown.map((_, i) => (
                      <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + i * 0.15})`} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="pm" />} />
                </PieChart>
              </ChartContainer>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {paymentBreakdown.map((p) => (
                  <div key={p.key} className="flex items-center justify-between"><span>{p.label}</span><span className="font-mono">{p.value}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Delivery Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ dm: { label: "Count", color: "hsl(var(--primary))" } }} className="w-full">
                <PieChart>
                  <Pie data={deliveryBreakdown} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {deliveryBreakdown.map((_, i) => (
                      <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + i * 0.15})`} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="dm" />} />
                </PieChart>
              </ChartContainer>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {deliveryBreakdown.map((d) => (
                  <div key={d.key} className="flex items-center justify-between"><span>{d.label}</span><span className="font-mono">{d.value}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Top Products Analytics
                <Badge variant="outline" className="font-mono">
                  {range.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((p, index) => (
                    <div key={p.name} className="border rounded-lg p-4 space-y-3">
                      {/* Product header with rank */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium leading-tight">{p.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {p.orders} orders • {p.uniqueCustomers} customers
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{fmtCurrency(Math.round(p.revenue))}</div>
                          <div className="text-xs text-muted-foreground">Total Revenue</div>
                        </div>
                      </div>
                      
                      {/* Metrics grid */}
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-muted">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">×{p.qty}</div>
                          <div className="text-xs text-muted-foreground">Units Sold</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-amber-600">{p.frequency}</div>
                          <div className="text-xs text-muted-foreground">Avg per Order</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{fmtCurrency(p.avgOrderValue)}</div>
                          <div className="text-xs text-muted-foreground">Avg Order Val</div>
                        </div>
                      </div>
                      
                      {/* Top branch info */}
                      {p.topBranch && (
                        <div className="flex items-center justify-between pt-2 border-t border-muted bg-muted/30 -mx-4 px-4 py-2 rounded-b-lg">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            <span className="text-sm font-medium">Top Branch:</span>
                            <span className="text-sm">{p.topBranch[0]}</span>
                          </div>
                          <div className="text-sm font-mono text-muted-foreground">
                            {p.topBranch[1]} units
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No sales data available for this period.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders and Actions */}
        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportCSV}><FileDown className="h-4 w-4 mr-2" /> Export CSV</Button>
                <Button variant="outline" asChild><Link to="/admin/orders">View all</Link></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 6).map((o) => {
                    const d = new Date(o.date);
                    const dateStr = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    const name = `${o.customer.firstName} ${o.customer.lastName}`.trim();
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.id}</TableCell>
                        <TableCell>{dateStr}</TableCell>
                        <TableCell>{name || o.customer.phone}</TableCell>
                        <TableCell className="text-right">{fmtCurrency(o.total)}</TableCell>
                        <TableCell><span className={statusPill(o.status)}>{o.status.replace(/_/g, " ")}</span></TableCell>
                      </TableRow>
                    );
                  })}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No orders yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button asChild><Link to="/admin/products">Add or Edit Products</Link></Button>
                <Button variant="outline" asChild><Link to="/admin/orders">Manage Orders</Link></Button>
                <Button variant="outline" asChild><Link to="/admin/settings">Site Settings</Link></Button>
                {!settings.blackFridayEnabled && <Badge variant="secondary">Black Friday disabled</Badge>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Operations Snapshot (Today)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{todayCounts.pending}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{todayCounts.out_for_delivery}</div>
                    <div className="text-xs text-muted-foreground">Out for delivery</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{todayCounts.cancelled}</div>
                    <div className="text-xs text-muted-foreground">Cancelled</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
