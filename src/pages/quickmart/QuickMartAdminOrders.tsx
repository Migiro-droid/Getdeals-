import { useMemo, useState, useEffect } from "react";
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

export const QuickMartAdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<QuickMartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "total_desc" | "total_asc">("newest");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QuickMartOrder | null>(null);

  const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  // Fetch Quickmart-specific orders from database
  const fetchQuickMartOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '500',
        offset: '0',
        ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
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

  const counts = useMemo(() => {
    const base = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    } as Record<"all" | OrderStatus, number>;
    for (const o of orders) {
      const status = o.status.toLowerCase() as OrderStatus;
      if (status in base) base[status]++;
    }
    return base;
  }, [orders]);

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

  const visible = useMemo(() => {
    let list = orders.slice();
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status.toLowerCase() === statusFilter);
    }
    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "total_desc":
        list.sort((a, b) => b.total_amount_kes - a.total_amount_kes);
        break;
      case "total_asc":
        list.sort((a, b) => a.total_amount_kes - b.total_amount_kes);
        break;
      default:
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [orders, statusFilter, sortBy]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold">📋 Orders Management</h2>
          </div>
          <p className="text-sm text-gray-600">View and manage all Quickmart orders in one place</p>
        </div>
        <Button onClick={fetchQuickMartOrders} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <div>Loading orders...</div>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && !loading && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
              {(["all", ...statuses] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                    statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                  }`}
                >
                  <span>{s === "all" ? "All" : statusLabel(s as OrderStatus)}</span>
                  <span className="ml-2 text-xs opacity-80">{(counts as any)[s]}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="total_desc">Total: High → Low</SelectItem>
                  <SelectItem value="total_asc">Total: Low → High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No orders yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((o) => {
                  const d = new Date(o.created_at);
                  const dateStr = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                  return (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => { setActive(o); setOpen(true); }}>
                      <TableCell className="font-medium">{o.order_reference}</TableCell>
                      <TableCell>{dateStr}</TableCell>
                      <TableCell>
                        {o.customer_name || o.customer_phone}
                      </TableCell>
                      <TableCell>{o.branch || 'N/A'}</TableCell>
                      <TableCell className="text-right">KES {(o.total_amount_kes || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={statusPill(o.status)}>{statusLabel(o.status.toLowerCase() as OrderStatus)}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No matching orders.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
                            <TableCell>{it.name}</TableCell>
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
