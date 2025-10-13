import { useMemo, useState, useEffect } from "react";
import { useOrders, OrderStatus } from "@/contexts/OrdersContext";
import { useOrderNotification } from "@/contexts/OrderNotificationContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Circle, CheckCircle, Clock, Truck, Package, ChevronRight, MapPin, CreditCard, Calendar, User, Shield, Crown, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DatabaseOrder {
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
  mpesa_receipt_number?: string;
  payment_reference?: string;
  created_at: string;
  items: any[];
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

export default function AdminOrders() {
  const { orders: localOrders, updateStatus } = useOrders();
  const { acknowledgeOrders } = useOrderNotification();
  const { role, user } = useAdmin();
  const [databaseOrders, setDatabaseOrders] = useState<DatabaseOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const statuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "total_desc" | "total_asc">("newest");

  const fetchDatabaseOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
        ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
        ...(search && { search })
      });

      const response = await fetch(`/api/orders/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setDatabaseOrders(data.orders);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseOrders();
  }, [statusFilter, search]);

  useEffect(() => {
    acknowledgeOrders();
  }, [acknowledgeOrders]);

  const convertDatabaseOrderToLocal = (dbOrder: DatabaseOrder) => ({
    id: dbOrder.order_reference,
    date: dbOrder.created_at,
    status: dbOrder.status.toLowerCase() as OrderStatus,
    items: dbOrder.items || [],
    subtotal: dbOrder.subtotal_kes || 0,
    deliveryFee: dbOrder.delivery_fee_kes || 0,
    total: dbOrder.total_amount_kes || 0,
    deliveryMethod: dbOrder.delivery_method === 'speedy' ? 'speedy' : 'pickup',
    paymentMethod: dbOrder.payment_method,
    customer: {
      firstName: dbOrder.customer_name?.split(' ')[0] || '',
      lastName: dbOrder.customer_name?.split(' ').slice(1).join(' ') || '',
      phone: dbOrder.customer_phone,
      email: dbOrder.customer_email,
      address: dbOrder.delivery_address,
      pickupLocation: dbOrder.pickup_location
    }
  });

  const orders = databaseOrders.length > 0
    ? databaseOrders.map(convertDatabaseOrderToLocal)
    : localOrders;

  const counts = useMemo(() => {
    const base = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    } as Record<"all" | OrderStatus, number>;
    for (const o of orders) base[o.status]++;
    return base;
  }, [orders]);

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

  const pickDeterministic = (arr: string[], key: string) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return arr[h % arr.length];
  };
  const getDisplayLocation = (o: { deliveryMethod: string; customer: { pickupLocation?: string; address?: string } }) => {
    const pickupPool = ["Quickmart Westlands", "Quickmart Karen", "Quickmart TRM", "Quickmart CBD"];
    const addressPool = [
      "Nairobi CBD, Kenyatta Ave",
      "Westlands, Waiyaki Way",
      "Kilimani, Lenana Rd",
      "South B, Mombasa Rd",
      "Roysambu, TRM Drive",
    ];
    if (o.deliveryMethod === "pickup") return o.customer.pickupLocation || pickDeterministic(pickupPool, JSON.stringify(o));
    return o.customer.address || pickDeterministic(addressPool, JSON.stringify(o));
  };

  const getProductImage = (productName: string, existingImage?: string) => {
    if (existingImage && !existingImage.includes('placeholder') && !existingImage.startsWith('src/')) {
      return existingImage;
    }
    
    const imageMap: Record<string, string> = {
      'essential basket': '/src/assets/essential-basket.jpg',
      'mini essential basket': '/src/assets/essential-basket.jpg',
      'mega essential basket': '/src/assets/essential-basket.jpg',
      'family basket': '/src/assets/family-basket.jpg',
      'premium family basket': '/src/assets/family-basket.jpg',
      'luxury family basket': '/src/assets/family-basket.jpg',
      'back to school basket': '/src/assets/essential-basket.jpg',
      'holiday feast basket': '/src/assets/family-basket.jpg',
      'essentials plus basket': '/src/assets/essential-basket.jpg',
      'essentials max basket': '/src/assets/essential-basket.jpg',
      'christmas special basket': '/src/assets/family-basket.jpg',
      'easter family basket': '/src/assets/family-basket.jpg',
      'school lunch basket': '/src/assets/essential-basket.jpg',
      'student essential basket': '/src/assets/essential-basket.jpg',
      'weekend spirits pack': '/src/assets/family-basket.jpg',
      'wine collection pack': '/src/assets/family-basket.jpg',
      'black friday mega deal': '/src/assets/family-basket.jpg',
      'black friday family pack': '/src/assets/family-basket.jpg',
      'rice': '/src/assets/products/rice.jpg',
      'bread': '/src/assets/products/bread.jpg',
      'flour': '/src/assets/products/flour.jpg',
      'wheat flour': '/src/assets/products/flour.jpg',
      'sugar': '/src/assets/products/sugar.jpg',
      'cooking oil': '/src/assets/products/oil.jpg',
      'oil': '/src/assets/products/oil.jpg',
    };
    
    const exactMatch = imageMap[productName.toLowerCase()];
    if (exactMatch) return exactMatch;
    
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('basket')) {
      if (lowerName.includes('family') || lowerName.includes('premium') || lowerName.includes('luxury')) {
        return '/src/assets/family-basket.jpg';
      }
      return '/src/assets/essential-basket.jpg';
    }
    if (lowerName.includes('rice')) return '/src/assets/products/rice.jpg';
    if (lowerName.includes('bread')) return '/src/assets/products/bread.jpg';
    if (lowerName.includes('flour')) return '/src/assets/products/flour.jpg';
    if (lowerName.includes('sugar')) return '/src/assets/products/sugar.jpg';
    if (lowerName.includes('oil')) return '/src/assets/products/oil.jpg';
    
    return '/src/assets/essential-basket.jpg';
  };

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ReturnType<typeof useOrders>["orders"][number] | null>(null);

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

  const setStatusForActive = async (next: OrderStatus) => {
    if (!active) return;
    
    if (databaseOrders.length > 0) {
      try {
        console.log('Updating order status:', { orderId: active.id, newStatus: next });
        
        const response = await fetch('/api/orders/update-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: active.id,
            status: next
          })
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);

        if (result.success) {
          setActive({ ...active, status: next });
          await fetchDatabaseOrders();
          console.log('Order status updated successfully');
        } else {
          console.error('Failed to update order status:', result.error);
          alert('Failed to update order status:\n' + (result.error || 'Unknown error'));
        }
      } catch (error: any) {
        console.error('Error updating order status:', error);
        alert('Error updating order status:\n' + (error.message || 'Network error. Please try again.'));
      }
    } else {
      updateStatus(active.id, next);
      setActive({ ...active, status: next });
    }
  };

  const statusSequence: OrderStatus[] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
  ];
  const statusLabel = (s: OrderStatus) => {
    switch (s) {
      case "pending": return "Pending";
      case "confirmed": return "Confirmed";
      case "shipped": return "Shipped";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
    }
  };
  
  const statusLabelShort = (s: OrderStatus) => {
    switch (s) {
      case "pending": return "Pending";
      case "confirmed": return "Confirmed";
      case "shipped": return "Shipped";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
    }
  };
  const statusIcon = (s: OrderStatus) => {
    switch (s) {
      case "pending":
        return Circle;
      case "confirmed":
        return Package;
      case "shipped":
        return Truck;
      case "delivered":
        return CheckCircle;
      default:
        return Circle;
    }
  };

  const labelPayment = (m: string) => (m === "mpesa" ? "M-Pesa" : m.charAt(0).toUpperCase() + m.slice(1));

  const visible = useMemo(() => {
    let list = orders.slice();
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "total_desc":
        list.sort((a, b) => b.total - a.total);
        break;
      case "total_asc":
        list.sort((a, b) => a.total - b.total);
        break;
      default:
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return list;
  }, [orders, statusFilter, sortBy]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
          <UserDisplay />
        </div>

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <div>Loading orders...</div>
          </div>
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
                      <span>{s === "all" ? "All" : statusLabelShort(s as OrderStatus)}</span>
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
            <CardContent className="p-6 text-muted-foreground">No orders yet.</CardContent>
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
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((o) => {
                    const d = new Date(o.date);
                    const dateStr = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    const loc = getDisplayLocation(o);
                    return (
                      <TableRow key={o.id} className="cursor-pointer" onClick={() => { setActive(o); setOpen(true); }}>
                        <TableCell className="font-medium">{o.id}</TableCell>
                        <TableCell>{dateStr}</TableCell>
                        <TableCell>
                          {(o.customer.firstName || o.customer.lastName) ? 
                            `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : 
                            o.customer.phone
                          }
                        </TableCell>
                        <TableCell>{loc}</TableCell>
                        <TableCell className="text-right">KES {(o.total || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={statusPill(o.status)}>{statusLabelShort(o.status)}</span>
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
          <DialogContent className="max-w-3xl p-0 pr-10">
            {active && (
              <div className="flex flex-col">
                <div className="px-6 pt-5 pb-4 border-b bg-muted/30 pr-6">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-4 pr-6">
                      <span className="font-mono text-sm truncate max-w-[65%]">Order {active.id}</span>
                      <span className={statusPill(active.status)}>{statusLabel(active.status)}</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-4 w-4" />
                      <span className="truncate">{new Date(active.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <CreditCard className="h-4 w-4" />
                      <span className="truncate">{labelPayment(active.paymentMethod)}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate" title={getDisplayLocation(active)}>{getDisplayLocation(active)}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-foreground">KES {(active.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {}
                  {(() => {
                    const dbOrder = databaseOrders.find(db => db.order_reference === active.id);
                    if (!dbOrder) return null;
                    return (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs font-medium text-blue-800 mb-2">Payment Details</div>
                        <div className="grid sm:grid-cols-2 gap-2 text-xs">
                          {dbOrder.mpesa_receipt_number && (
                            <div><span className="text-muted-foreground">M-Pesa Receipt:</span> <span className="font-mono">{dbOrder.mpesa_receipt_number}</span></div>
                          )}
                          {dbOrder.payment_reference && (
                            <div><span className="text-muted-foreground">Payment Ref:</span> <span className="font-mono text-xs">{dbOrder.payment_reference}</span></div>
                          )}
                          <div><span className="text-muted-foreground">Payment Status:</span> <Badge variant={dbOrder.payment_status === 'paid' ? 'default' : 'secondary'}>{dbOrder.payment_status}</Badge></div>
                          <div><span className="text-muted-foreground">Order Status:</span> <Badge className={dbOrder.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-yellow-500'}>{dbOrder.status}</Badge></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <ScrollArea className="max-h-[80vh]">
                  <div className="p-6 space-y-5">
                    {/* Status controls - stepper */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Order Status</h3>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
                          {(() => {
                            const currIdx = Math.max(0, statusSequence.indexOf(active.status as OrderStatus));
                            return statusSequence.map((s, i) => {
                              const Icon = statusIcon(s);
                              const isCurrent = s === active.status;
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
                                    aria-label={`Set status to ${statusLabel(s)}`}
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
                        {active.status !== "delivered" && active.status !== "cancelled" && (
                          <div className="flex-shrink-0">
                            <Button size="sm" variant="destructive" onClick={() => setStatusForActive("cancelled")}>Cancel order</Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Customer:</span> 
                          <span className="truncate inline-block max-w-full align-bottom">
                            {(active.customer.firstName || active.customer.lastName) ? 
                              `${active.customer.firstName || ''} ${active.customer.lastName || ''}`.trim() : 
                              'No name provided'
                            }
                          </span>
                        </div>
                        <div className="min-w-0"><span className="text-muted-foreground">Phone:</span> <span className="truncate inline-block max-w-full align-bottom">{active.customer.phone}</span></div>
                        <div className="min-w-0"><span className="text-muted-foreground">Email:</span> <span className="break-all inline-block align-bottom">{active.customer.email}</span></div>
                      </div>
                      <div className="space-y-1">
                        <div className="min-w-0"><span className="text-muted-foreground">Delivery:</span> <span className="truncate inline-block max-w-full align-bottom">{active.deliveryMethod === "speedy" ? "Speedy" : "Pickup"}</span></div>
                        <div className="min-w-0"><span className="text-muted-foreground">Location:</span> <span className="break-words inline-block align-bottom" title={getDisplayLocation(active)}>{getDisplayLocation(active)}</span></div>
                        <div className="min-w-0"><span className="text-muted-foreground">Payment:</span> <span className="truncate inline-block max-w-full align-bottom">{labelPayment(active.paymentMethod)}</span></div>
                      </div>
                    </div>
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
                            <TableCell className="text-right">KES {(active.subtotal || 0).toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Delivery</TableCell>
                            <TableCell className="text-right">KES {(active.deliveryFee || 0).toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">KES {(active.total || 0).toLocaleString()}</TableCell>
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
    </div>
  );
}
