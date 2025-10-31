import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Circle, CheckCircle, Clock, Truck, Package, ChevronRight, MapPin, CreditCard, Calendar, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickMartOrder {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount_kes: number;
  subtotal_kes: number;
  delivery_fee_kes: number;
  status: string;
  payment_status: string;
  payment_method: string;
  delivery_method: string;
  delivery_address?: string;
  pickup_location?: string;
  created_at: string;
  items: any[];
  branch?: string; // Branch information
}

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
type SortOption = "newest" | "oldest" | "total_desc" | "total_asc" | "priority" | "branch";
type GroupByOption = "none" | "status" | "branch" | "date" | "delivery";

export const QuickMartAdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<QuickMartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [groupBy, setGroupBy] = useState<GroupByOption>("status");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QuickMartOrder | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<"all" | OrderStatus, number>>({
    all: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  // Helper function to get product images
  const getProductImage = (productName: string, existingImage?: string) => {
    if (existingImage && !existingImage.includes('placeholder') && !existingImage.startsWith('src/')) {
      return existingImage;
    }
    
    const imageMap: Record<string, string> = {
      'milk': '/src/assets/products/milk.jpg',
      'milk 1l': '/src/assets/products/milk.jpg',
      'bread': '/src/assets/products/bread.jpg',
      'fresh bread': '/src/assets/products/bread.jpg',
      'butter': '/src/assets/products/butter.jpg',
      'eggs': '/src/assets/products/eggs.jpg',
      'eggs (dozen)': '/src/assets/products/eggs.jpg',
      'cheese': '/src/assets/products/cheese.jpg',
      'yogurt': '/src/assets/products/yogurt.jpg',
      'rice': '/src/assets/products/rice.jpg',
      'flour': '/src/assets/products/flour.jpg',
      'wheat flour': '/src/assets/products/flour.jpg',
      'sugar': '/src/assets/products/sugar.jpg',
      'cooking oil': '/src/assets/products/oil.jpg',
      'oil': '/src/assets/products/oil.jpg',
      'essential basket': '/src/assets/essential-basket.jpg',
      'family basket': '/src/assets/family-basket.jpg',
    };
    
    const exactMatch = imageMap[productName.toLowerCase()];
    if (exactMatch) return exactMatch;
    
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('milk')) return '/src/assets/products/milk.jpg';
    if (lowerName.includes('bread')) return '/src/assets/products/bread.jpg';
    if (lowerName.includes('butter')) return '/src/assets/products/butter.jpg';
    if (lowerName.includes('egg')) return '/src/assets/products/eggs.jpg';
    if (lowerName.includes('cheese')) return '/src/assets/products/cheese.jpg';
    if (lowerName.includes('yogurt')) return '/src/assets/products/yogurt.jpg';
    if (lowerName.includes('rice')) return '/src/assets/products/rice.jpg';
    if (lowerName.includes('flour')) return '/src/assets/products/flour.jpg';
    if (lowerName.includes('sugar')) return '/src/assets/products/sugar.jpg';
    if (lowerName.includes('oil')) return '/src/assets/products/oil.jpg';
    
    return '/src/assets/essential-basket.jpg';
  };

  // Fetch Quickmart-specific orders from database
  const fetchQuickMartOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '500',
        offset: '0',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search })
      });

      console.log('Fetching orders with params:', params.toString());
      
      // Use the existing orders API endpoint
      const response = await fetch(`/api/orders/list?${params}`);
      const data = await response.json();

      console.log('Orders API Response:', data);

      if (data.success) {
        const fetchedOrders = data.orders || [];
        console.log(`✓ Fetched ${fetchedOrders.length} orders from database`);
        console.log('First few orders:', fetchedOrders.slice(0, 2));
        setOrders(fetchedOrders);
        
        // Update status counts from API statistics
        if (data.statistics) {
          const stats = data.statistics;
          setStatusCounts({
            all: stats.total_orders || 0,
            pending: stats.pending || 0,
            confirmed: stats.confirmed || 0,
            shipped: stats.shipped || 0,
            delivered: stats.delivered || 0,
            cancelled: stats.cancelled || 0,
          });
          console.log('Updated status counts:', stats);
        }
      } else {
        console.error('❌ Failed to fetch orders:', data.error);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickMartOrders();
  }, [statusFilter, search]);

  // ============ HELPER FUNCTIONS (defined before useMemos) ============
  
  const statusLabel = (s: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled"
    };
    return labels[s];
  };

  const statusPill = (s: string) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs";
    switch (s.toLowerCase()) {
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

  // Priority calculation: pending/confirmed orders that are older get higher priority
  const getPriority = (order: QuickMartOrder) => {
    const status = order.status.toLowerCase() as OrderStatus;
    const ageMs = Date.now() - new Date(order.created_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    // Priority scoring: lower = higher priority
    let score = 0;
    if (status === "pending") score = 0;
    else if (status === "confirmed") score = 10;
    else if (status === "shipped") score = 20;
    else if (status === "delivered") score = 100;
    else if (status === "cancelled") score = 200;

    // Add age weight (older orders get lower score = higher priority)
    score += Math.max(0, 30 - ageHours);
    
    return score;
  };

  // Get relative time (e.g., "2 hours ago", "today", "yesterday")
  const getTimeGroup = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateOnly.getTime() === today.getTime()) return "Today";
    if (dateOnly.getTime() === yesterday.getTime()) return "Yesterday";
    if (dateOnly >= weekAgo) return "This Week";
    return "Older";
  };

  // ============ USEMEMOS ============

  const counts = useMemo(() => {
    // Use the statusCounts from API, which always shows totals across all filters
    return statusCounts;
  }, [statusCounts]);

  // Group and sort logic
  const grouped = useMemo(() => {
    let list = orders.slice();

    // Apply status filter
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status.toLowerCase() === statusFilter);
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_reference.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_phone?.includes(q) ||
          o.customer_email?.toLowerCase().includes(q)
      );
    }

    // Sort by selected option
    switch (sortBy) {
      case "priority":
        list.sort((a, b) => getPriority(a) - getPriority(b));
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "total_desc":
        list.sort((a, b) => b.total_amount_kes - a.total_amount_kes);
        break;
      case "total_asc":
        list.sort((a, b) => a.total_amount_kes - b.total_amount_kes);
        break;
      case "branch":
        list.sort((a, b) => (a.branch || "").localeCompare(b.branch || ""));
        break;
      default: // newest
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Group by selected option
    const groupMap: Record<string, QuickMartOrder[]> = {};

    for (const order of list) {
      let key = "All Orders";
      switch (groupBy) {
        case "status":
          key = `${statusLabel(order.status.toLowerCase() as OrderStatus)}`;
          break;
        case "branch":
          key = order.branch || "No Branch";
          break;
        case "date":
          key = getTimeGroup(new Date(order.created_at));
          break;
        case "delivery":
          key = order.delivery_method === "speedy" ? "Speedy Delivery" : "Store Pickup";
          break;
        case "none":
        default:
          key = "All Orders";
      }

      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(order);
    }

    return groupMap;
  }, [orders, statusFilter, search, sortBy, groupBy]);

  // Flatten grouped data for rendering
  const visible = useMemo(() => {
    return Object.values(grouped).flat();
  }, [grouped]);

  const setStatusForActive = async (next: OrderStatus) => {
    if (!active) return;
    
    try {
      const response = await fetch('/api/orders/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: active.order_reference,
          status: next
        })
      });

      const result = await response.json();

      if (result.success) {
        setActive({ ...active, status: next });
        await fetchQuickMartOrders();
      } else {
        alert('Failed to update order status:\n' + (result.error || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Error updating order status:\n' + (error.message || 'Network error'));
    }
  };

  const statusSequence: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];
  
  const statusIcon = (s: OrderStatus) => {
    switch (s) {
      case "pending": return Circle;
      case "confirmed": return Package;
      case "shipped": return Truck;
      case "delivered": return CheckCircle;
      default: return Circle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Orders</h1>
                <p className="text-slate-600 text-sm">Manage and track QuickMart orders</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchQuickMartOrders} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <p className="text-slate-600 text-xs font-medium">Total</p>
            <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 shadow-sm">
            <p className="text-yellow-700 text-xs font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">{counts.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
            <p className="text-blue-700 text-xs font-medium">Confirmed</p>
            <p className="text-2xl font-bold text-blue-900">{counts.confirmed}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 shadow-sm">
            <p className="text-purple-700 text-xs font-medium">Shipped</p>
            <p className="text-2xl font-bold text-purple-900">{counts.shipped}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 shadow-sm">
            <p className="text-green-700 text-xs font-medium">Delivered</p>
            <p className="text-2xl font-bold text-green-900">{counts.delivered}</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <Input
                placeholder="Search by order #, customer, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
            </div>

            {/* Filter and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Buttons */}
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-slate-600 block mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", ...statuses] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        statusFilter === s 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {s === "all" ? "All" : statusLabel(s as OrderStatus)}
                      <span className="ml-1 opacity-80">({(counts as any)[s]})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Sort By</label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="total_desc">Highest Value</SelectItem>
                    <SelectItem value="total_asc">Lowest Value</SelectItem>
                    <SelectItem value="branch">Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Group By</label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 font-medium">Loading orders...</p>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {orders.length === 0 && !loading && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-slate-200">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">No orders found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters or check back later</p>
          </div>
        </div>
      )}

      {/* ORDERS DISPLAY */}
      {!loading && orders.length > 0 && (
        <div className="max-w-7xl mx-auto">
          {Object.entries(grouped).map(([groupKey, groupOrders]) => (
            <div key={groupKey} className="mb-8">
              {/* GROUP HEADER */}
              {groupBy !== "none" && (
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{groupKey}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {groupOrders.length} {groupOrders.length === 1 ? "order" : "orders"}
                  </Badge>
                </div>
              )}

              {/* MODERN CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groupOrders.map((order) => {
                  const status = order.status.toLowerCase() as OrderStatus;
                  const isPriority = status === "pending" || status === "confirmed";
                  const d = new Date(order.created_at);
                  const timeStr = d.toLocaleString(undefined, { 
                    month: "short", 
                    day: "numeric", 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  });
                  const ageMs = Date.now() - d.getTime();
                  const ageHours = ageMs / (1000 * 60 * 60);
                  const ageStr = ageHours < 1 
                    ? `${Math.round(ageMs / 60000)}m ago`
                    : ageHours < 24
                    ? `${Math.round(ageHours)}h ago`
                    : `${Math.round(ageHours / 24)}d ago`;

                  const statusConfig: Record<OrderStatus, { bg: string; text: string; icon: string }> = {
                    pending: { bg: "bg-gradient-to-br from-yellow-50 to-yellow-100", text: "text-yellow-700", icon: "" },
                    confirmed: { bg: "bg-gradient-to-br from-blue-50 to-blue-100", text: "text-blue-700", icon: "" },
                    shipped: { bg: "bg-gradient-to-br from-purple-50 to-purple-100", text: "text-purple-700", icon: "" },
                    delivered: { bg: "bg-gradient-to-br from-green-50 to-green-100", text: "text-green-700", icon: "" },
                    cancelled: { bg: "bg-gradient-to-br from-red-50 to-red-100", text: "text-red-700", icon: "" },
                  };

                  const config = statusConfig[status];

                  return (
                    <div
                      key={order.id}
                      onClick={() => { setActive(order); setOpen(true); }}
                      className="group relative bg-white border border-slate-200 hover:border-slate-400 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                    >
                      {/* Header: Status + Time */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                        <span className={`${config.text} font-semibold text-sm`}>
                          {statusLabel(status)}
                        </span>
                        <span className="text-xs text-slate-500">{ageStr}</span>
                      </div>

                      {/* List Items */}
                      <div className="space-y-2.5">
                        {/* Order Reference */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Order ID</span>
                          <span className="text-sm font-mono text-slate-900">{order.order_reference || order.id?.slice(0, 8)}</span>
                        </div>

                        {/* Customer */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Customer</span>
                          <span className="text-sm font-semibold text-slate-900">{order.customer_name}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Phone</span>
                          <span className="text-sm text-slate-700">{order.customer_phone}</span>
                        </div>

                        {/* Branch */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Branch</span>
                          <span className="text-sm text-slate-700">{order.branch || "N/A"}</span>
                        </div>

                        {/* Delivery */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Delivery</span>
                          <span className="text-sm text-slate-700 capitalize">{order.delivery_method}</span>
                        </div>

                        {/* Amount */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-medium">Total</span>
                          <span className="text-lg font-bold text-slate-900">KES {(order.total_amount_kes || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Hover Arrow */}
                      <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDER DETAILS MODAL - keeping existing implementation */}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setActive(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 pr-10 overflow-hidden flex flex-col">
          {active && (
            <div className="flex flex-col">
              <div className="px-6 pt-5 pb-4 border-b bg-muted/30">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between gap-4">
                    <span className="font-mono text-sm">Order {active.order_reference}</span>
                    <span className={statusPill(active.status)}>{statusLabel(active.status.toLowerCase() as OrderStatus)}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(active.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>{active.payment_method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{active.branch || 'N/A'}</span>
                  </div>
                  <div className="font-medium text-foreground">KES {(active.total_amount_kes || 0).toLocaleString()}</div>
                </div>
              </div>
              <ScrollArea className="max-h-[80vh]">
                <div className="p-6 space-y-5">
                  {/* Order Status Workflow */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Order Status</h3>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 overflow-x-auto flex-1">
                        {(() => {
                          const currIdx = Math.max(0, statusSequence.indexOf(active.status.toLowerCase() as OrderStatus));
                          return statusSequence.map((s, i) => {
                            const Icon = statusIcon(s);
                            const isCurrent = s === active.status.toLowerCase();
                            const isDone = i < currIdx || active.status === "delivered";
                            return (
                              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition ${
                                    isCurrent
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : isDone
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                                  }`}
                                  onClick={() => setStatusForActive(s)}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">{statusLabel(s)}</span>
                                </button>
                                {i < statusSequence.length - 1 && (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                      {active.status.toLowerCase() !== "delivered" && active.status.toLowerCase() !== "cancelled" && (
                        <Button size="sm" variant="destructive" onClick={() => setStatusForActive("cancelled")}>Cancel</Button>
                      )}
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div><span className="text-muted-foreground">Customer:</span> <span>{active.customer_name}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span> <span>{active.customer_phone}</span></div>
                      <div><span className="text-muted-foreground">Email:</span> <span className="break-all">{active.customer_email}</span></div>
                    </div>
                    <div className="space-y-1">
                      <div><span className="text-muted-foreground">Delivery:</span> <span>{active.delivery_method === "speedy" ? "Speedy" : "Pickup"}</span></div>
                      <div><span className="text-muted-foreground">Location:</span> <span>{active.delivery_address || active.pickup_location || 'N/A'}</span></div>
                      <div><span className="text-muted-foreground">Branch:</span> <span>{active.branch || 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {active.items.map((it) => (
                          <TableRow key={`${it.id}-${it.name}`}>
                            <TableCell>
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={getProductImage(it.name, it.image)} 
                                  alt={it.name} 
                                  className="h-10 w-10 rounded object-contain bg-muted flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/src/assets/essential-basket.jpg';
                                  }}
                                />
                                <div className="truncate max-w-[280px]" title={it.name}>{it.name}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{it.quantity}</TableCell>
                            <TableCell className="text-right">KES {(it.price || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">KES {((it.price || 0) * (it.quantity || 0)).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                          <TableCell className="text-right">KES {(active.subtotal_kes || 0).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Delivery</TableCell>
                          <TableCell className="text-right">KES {(active.delivery_fee_kes || 0).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                          <TableCell className="text-right font-bold">KES {(active.total_amount_kes || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
