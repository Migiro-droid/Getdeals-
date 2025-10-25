import { useEffect, useState, type ReactNode } from "react";
import { User, Package, MapPin, Bell, Shield, LogOut, Truck, Phone, Mail, CalendarClock, CircleDot, Check, Star, Trash2, Plus, Power, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { Order, OrderStatus } from "@/contexts/OrdersContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLocation } from "react-router-dom";
import { useAccount, type Address } from "@/contexts/AccountContext";
import { AddressForm } from "@/components/AddressForm";
import { AddressCard } from "@/components/AddressCard";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeliveryProgressBar } from "@/components/DeliveryProgressBar";
import { createClient } from "@supabase/supabase-js";

type DashboardOrder = Order & {
  order_reference: string;
  total_amount: number;
  delivery_method: string;
  delivery_address?: string | null;
  delivery_address_raw?: unknown;
  payment_reference?: string | null;
  mpesa_receipt_number?: string | null;
  leta_status?: string | null;
  leta_tracking_url?: string | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  estimated_delivery_time?: string | null;
};

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [active, setActive] = useState<DashboardOrder | null>(null);
  const location = useLocation();
  const { toast } = useToast();
  const { profile, setProfile, notifications, setNotifications, addresses, addAddress, updateAddress, removeAddress, setDefaultAddress } = useAccount();
  const { signOut, user, changePassword } = useAuth();
  const [busy, setBusy] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  
  // Password change modal state
  const [pwOpen, setPwOpen] = useState(false);
  const [currPw, setCurrPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  
  // 2FA modal state
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  
  // Database orders state
  const [databaseOrders, setDatabaseOrders] = useState<DashboardOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Placeholder 2FA function (to be implemented)
  const verifyTwoFactor = async (code: string) => {
    // TODO: Implement actual 2FA verification
    console.log('2FA verification not yet implemented:', code);
    return { ok: false, error: '2FA not yet implemented' };
  };

  // Calculate real user stats from DATABASE orders only
  const totalOrders = databaseOrders.length;
  const totalSaved = databaseOrders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => {
      // Calculate savings based on subtotal vs total difference (excluding delivery fee)
      // Assuming savings come from discounts applied during checkout
      // For now, we'll show 0 until we add a savings/discount field to Order interface
      return sum + 0;
    }, 0);
  const urlParams = new URLSearchParams(location.search);
  const defaultTab = urlParams.get("tab") || (location.state as any)?.tab || "profile";
  const queryOrderId = urlParams.get("orderId") ?? undefined;
  
  console.log('[AccountPage] Page loaded with params:', { queryOrderId, defaultTab, userId: user?.id });
  const statusPill = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      delivered: "bg-emerald-100 text-emerald-800",
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${map[s]}`;
  };
  const statusLabel = (s: OrderStatus) => s.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
  const orderToHighlight = (queryOrderId as string | undefined) ?? (location.state as any)?.orderId;
  useEffect(() => {
    if (orderToHighlight && databaseOrders.length) {
      console.log(`[AccountPage] Looking for order: ${orderToHighlight}`);
      const matched = databaseOrders.find(o => o.id === orderToHighlight);
      if (matched) {
        console.log('[AccountPage] Found order, setting active:', matched);
        setActive(matched);
      } else {
        console.warn(`[AccountPage] Order not found. Available IDs: ${databaseOrders.map(o => o.id).join(', ')}`);
      }
    }
  }, [orderToHighlight, databaseOrders]);

  // Fetch orders from Supabase database via API
  useEffect(() => {
    if (!user) return;

    const fetchDatabaseOrders = async () => {
      try {
        setLoadingOrders(true);
        
        console.log(`[AccountPage] Fetching orders for user ${user.id} via API...`);
        
        const response = await fetch(`/api/orders/get-user-orders?userId=${user.id}`);
        if (!response.ok) {
          console.error('Error fetching orders from API:', response.statusText);
          return;
        }

        const result = await response.json();
        
        if (!result.success) {
          console.error('API returned error:', result.error);
          return;
        }

        const data = result.orders ?? [];
        console.log(`[AccountPage] Fetched ${data.length} orders for user ${user.id}`);
        console.log('[AccountPage] Order IDs:', data.map((o: any) => o.id));
        
        const normalizedOrders: DashboardOrder[] = (data ?? []).map((row: any) => {
          // Handle order_items stored in the orders table (JSONB column with full item objects)
          let items: any[] = [];
          
          if (row.order_items) {
            if (Array.isArray(row.order_items)) {
              items = row.order_items;
            } else if (typeof row.order_items === 'object') {
              items = [row.order_items];
            }
          }
          
          const normalizedItems = items.map((item: any, index: number) => {
            const priceCents = typeof item.price === 'number' ? item.price : 0;
            return {
              id: item.product_id?.toString() ?? item.id?.toString() ?? `item-${index}`,
              name: item.product_name ?? item.name ?? 'Item',
              price: priceCents / 100,
              quantity: item.quantity ?? 1,
              image: item.image ?? undefined,
            };
          });

          const subtotal = typeof row.subtotal === 'number' ? row.subtotal / 100 : row.subtotal ?? 0;
          const deliveryFee = typeof row.delivery_fee === 'number' ? row.delivery_fee / 100 : row.delivery_fee ?? 0;
          const totalAmount = typeof row.total_amount === 'number' ? row.total_amount / 100 : row.total_amount ?? 0;

          const nameParts = (row.customer_name ?? '').trim().split(/\s+/).filter(Boolean);
          const firstName = nameParts.shift() ?? row.customer_name ?? 'Customer';
          const lastName = nameParts.join(' ');

          const deliveryAddressRaw = (typeof row.delivery_address === 'object' && row.delivery_address !== null)
            ? (row.delivery_address as Record<string, any>)
            : row.delivery_address
              ? { address: row.delivery_address } as Record<string, any>
              : null;

          const paymentMethodValue = (row.payment_method ?? '').toString().toLowerCase();
          const paymentMethod: Order['paymentMethod'] = (() => {
            switch (paymentMethodValue) {
              case 'wallet':
                return 'wallet';
              case 'cash':
                return 'cash';
              case 'card':
              case 'credit-card':
              case 'debit-card':
                return 'card';
              case 'mobile_money':
              case 'mobile-money':
              case 'mpesa':
              default:
                return 'mpesa';
            }
          })();

          return {
            id: row.id,
            order_reference: row.order_reference ?? row.id,
            delivery_method: row.delivery_method ?? 'pickup',
            deliveryMethod: row.delivery_method === 'speedy' ? 'speedy' : 'pickup',
            delivery_address: deliveryAddressRaw?.address ?? deliveryAddressRaw?.pickup_location ?? null,
            delivery_address_raw: deliveryAddressRaw,
            date: row.created_at ?? new Date().toISOString(),
            status: (row.status ?? 'pending') as OrderStatus,
            items,
            subtotal,
            deliveryFee,
            total: totalAmount,
            total_amount: totalAmount,
            paymentMethod,
            payment_reference: row.payment_reference ?? null,
            mpesa_receipt_number: row.mpesa_receipt_number ?? null,
            leta_status: row.leta_status ?? null,
            leta_tracking_url: row.leta_tracking_url ?? null,
            rider_name: row.rider_name ?? null,
            rider_phone: row.rider_phone ?? null,
            estimated_delivery_time: row.estimated_delivery_time ?? null,
            customer: {
              firstName,
              lastName,
              phone: row.customer_phone ?? '',
              email: row.customer_email ?? '',
              address: deliveryAddressRaw?.address ?? undefined,
              pickupLocation: deliveryAddressRaw?.pickup_location ?? undefined,
            },
            note: row.notes ?? undefined,
          } satisfies DashboardOrder;
        });

        setDatabaseOrders(normalizedOrders);
      } catch (err) {
        console.error('Failed to fetch database orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchDatabaseOrders();
  }, [user, defaultTab]);

  return (
    <>
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-8">
          {}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={profile.avatarUrl} alt={`${profile.firstName} ${profile.lastName}`} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {profile.firstName?.charAt(0) || ''}{profile.lastName?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{profile.firstName} {profile.lastName}</h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Member since</span>
                    <span>{profile.memberSince || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Total orders</span>
                    <span>{totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Total saved</span>
                    <span className="text-green-600 font-medium">KES {totalSaved.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {}
          <div className="lg:col-span-3">
            <Tabs defaultValue={defaultTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Profile Information
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex justify-center">
                      <ProfilePictureUpload
                        currentImageUrl={profile.avatarUrl}
                        onImageUpdate={(imageUrl) => setProfile({ ...profile, avatarUrl: imageUrl || undefined })}
                        userInitials={`${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        type="text"
                        value={profile.organization || ''}
                        onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Your company or organization"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="organizationNumber">Organization Number</Label>
                      <Input
                        id="organizationNumber"
                        type="text"
                        value={profile.organizationNumber || ''}
                        onChange={(e) => setProfile({ ...profile, organizationNumber: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g. REG123456789"
                      />
                    </div>
                    
                    {isEditing && (
                      <div className="flex space-x-4">
                        <Button onClick={() => { toast({ title: 'Profile updated' }); setIsEditing(false); }}>
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <div className="space-y-6">
                  {loadingOrders ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <div className="text-sm text-muted-foreground">Loading your orders...</div>
                      </CardContent>
                    </Card>
                  ) : databaseOrders.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <h3 className="font-semibold text-lg mb-2">No Orders Yet</h3>
                        <p className="text-muted-foreground text-sm">
                          Start shopping to see your orders here!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Truck className="h-6 w-6" />
                        Your Orders
                      </h2>
                      <div className="space-y-6">
                        {databaseOrders.map((o) => (
                          <div key={o.id}>
                            {/* Delivery Progress Bar for Speedy Orders */}
                            {o.delivery_method === 'speedy' && (
                              <div className="mb-4">
                                <DeliveryProgressBar
                                  orderId={o.id}
                                  deliveryStatus={o.leta_status || 'pending'}
                                  riderName={o.rider_name}
                                  riderPhone={o.rider_phone}
                                  deliveryAddress={o.delivery_address}
                                  estimatedDeliveryTime={o.estimated_delivery_time}
                                  trackingUrl={o.leta_tracking_url}
                                />
                              </div>
                            )}

                            {/* Order Details Card */}
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h3 className="font-bold text-lg">
                                      Order #{o.order_reference}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(o.date).toLocaleString()}
                                    </p>
                                  </div>
                                  <Badge className={`${
                                    o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    o.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                    o.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {o.status ? o.status.replace(/_/g, ' ').replace(/^./, (c: string) => c.toUpperCase()) : 'Pending'}
                                  </Badge>
                                </div>

                                <Separator className="my-3" />

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Items</p>
                                    {o.items && Array.isArray(o.items) ? (
                                      <ul className="text-sm space-y-1">
                                        {o.items.map((item: any, idx: number) => (
                                          <li key={idx} className="text-gray-700">
                                            {item.name || item.product_name} ×{item.quantity}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-500">No items</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Delivery Method</p>
                                    <p className="text-sm font-medium">
                                      {o.delivery_method === 'speedy' ? '🚚 Speedy' : '🏪 Pickup'}
                                    </p>
                                    <p className="text-xs font-semibold text-gray-600 mb-1 mt-2">Total</p>
                                    <p className="text-lg font-bold text-green-600">
                                      KES {(o.total_amount || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {o.delivery_method === 'speedy' && o.delivery_address && (
                                  <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-gray-700 flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                    <span>{o.delivery_address}</span>
                                  </div>
                                )}

                                <Button variant="outline" size="sm" className="w-full" onClick={() => setActive(o)}>
                                  View Full Details
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">Saved Addresses</h2>
                      <p className="text-muted-foreground">
                        Manage your delivery addresses with precise location tracking
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressModalOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Address
                    </Button>
                  </div>

                  {addresses.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No addresses saved yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Add your first address to enable fast delivery to your location
                        </p>
                        <Button 
                          onClick={() => {
                            setEditingAddress(null);
                            setAddressModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Address
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <AddressCard
                          key={address.id}
                          address={address}
                          onEdit={(addr) => {
                            setEditingAddress(addr);
                            setAddressModalOpen(true);
                          }}
                          onDelete={removeAddress}
                          onSetDefault={setDefaultAddress}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bell className="h-5 w-5 mr-2" />
                        Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified about order status changes
                          </p>
                        </div>
                        <Switch checked={notifications.orderUpdates} onCheckedChange={(v) => setNotifications({ ...notifications, orderUpdates: v })} />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Promotional Offers</p>
                          <p className="text-sm text-muted-foreground">
                            Receive offers and discount notifications
                          </p>
                        </div>
                        <Switch checked={notifications.promos} onCheckedChange={(v) => setNotifications({ ...notifications, promos: v })} />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">New Products</p>
                          <p className="text-sm text-muted-foreground">
                            Be first to know about new basket options
                          </p>
                        </div>
                        <Switch checked={notifications.newProducts} onCheckedChange={(v) => setNotifications({ ...notifications, newProducts: v })} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Account Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Account security and session management
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" className="justify-start" onClick={() => setPwOpen(true)}>
                          <Shield className="h-4 w-4 mr-2" /> Change Password
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => setTwoFAOpen(true)}>
                          <Shield className="h-4 w-4 mr-2" /> Setup 2FA
                        </Button>
                        <Button variant="destructive" className="justify-start" onClick={() => setSignOutModalOpen(true)}>
                          <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
    <OrderDetailsModal order={active} onClose={() => setActive(null)} />
    {/* Change Password Modal */}
    <Dialog open={pwOpen} onOpenChange={setPwOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="curr-pw">Current Password</Label>
            <Input 
              id="curr-pw" 
              type="password" 
              value={currPw} 
              onChange={(e) => setCurrPw(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="new-pw">New Password</Label>
            <Input 
              id="new-pw" 
              type="password" 
              value={newPw} 
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 6 characters long
            </p>
          </div>
          <div>
            <Label htmlFor="conf-pw">Confirm New Password</Label>
            <Input 
              id="conf-pw" 
              type="password" 
              value={confPw} 
              onChange={(e) => setConfPw(e.target.value)}
              placeholder="Confirm your new password"
              autoComplete="new-password"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => {
              setPwOpen(false);
              setCurrPw("");
              setNewPw("");
              setConfPw("");
            }}>Cancel</Button>
            <Button onClick={async () => {
              // Validation
              if (!currPw || !newPw || !confPw) {
                return toast({ 
                  title: 'Missing fields', 
                  description: 'Please fill in all fields',
                  variant: 'destructive' 
                });
              }
              
              if (newPw.length < 6) {
                return toast({ 
                  title: 'Password too short', 
                  description: 'New password must be at least 6 characters long',
                  variant: 'destructive' 
                });
              }
              
              if (newPw !== confPw) {
                return toast({ 
                  title: 'Passwords do not match', 
                  description: 'New password and confirmation must match',
                  variant: 'destructive' 
                });
              }

              if (currPw === newPw) {
                return toast({ 
                  title: 'Same password', 
                  description: 'New password must be different from current password',
                  variant: 'destructive' 
                });
              }

              setBusy(true);
              const res = await changePassword(currPw, newPw);
              setBusy(false);
              
              if (!res.ok) {
                return toast({ 
                  title: 'Password change failed', 
                  description: res.error || 'An error occurred while changing your password',
                  variant: 'destructive' 
                });
              }
              
              toast({ 
                title: 'Password changed successfully', 
                description: 'Your password has been updated'
              });
              
              // Clear form and close modal
              setCurrPw("");
              setNewPw("");
              setConfPw("");
              setPwOpen(false);
            }} disabled={busy}>
              {busy ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    {/* Two-Factor Setup Modal */}
    <Dialog open={twoFAOpen} onOpenChange={setTwoFAOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {qrImage ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Scan this QR with Google Authenticator or similar, then enter the 6-digit code.</div>
              <div className="flex items-center justify-center">
                <img src={qrImage} alt="2FA QR" className="rounded border" />
              </div>
              <div>
                <Label htmlFor="totp-code">Authentication Code</Label>
                <Input id="totp-code" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="123456" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setTwoFAOpen(false)}>Close</Button>
                <Button onClick={async () => {
                  if (!twoFACode) return toast({ title: 'Enter the code' });
                  setBusy(true);
                  const res = await verifyTwoFactor(twoFACode);
                  setBusy(false);
                  if (!res.ok) return toast({ title: 'Verification failed', description: res.error, variant: 'destructive' as any });
                  toast({ title: 'Two-Factor enabled' });
                  setTwoFAOpen(false);
                }} disabled={busy}>Verify & Enable</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Preparing 2FA setup...</div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Address Management Modal */}
    <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4">
        <AddressForm
          address={editingAddress || undefined}
          isEditing={!!editingAddress}
          onSave={(addressData) => {
            if (editingAddress) {
              updateAddress(editingAddress.id, addressData);
              toast({
                title: "Address Updated",
                description: "Your address has been successfully updated.",
              });
            } else {
              addAddress(addressData);
              toast({
                title: "Address Added",
                description: "Your new address has been saved.",
              });
            }
            setAddressModalOpen(false);
            setEditingAddress(null);
          }}
          onCancel={() => {
            setAddressModalOpen(false);
            setEditingAddress(null);
          }}
        />
      </DialogContent>
    </Dialog>
    {/* Sign Out Confirmation Modal */}
    <Dialog open={signOutModalOpen} onOpenChange={setSignOutModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Confirm Sign Out
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </p>
        </div>
        <DialogFooter className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => setSignOutModalOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              signOut();
              setSignOutModalOpen(false);
              toast({ title: 'Signed out successfully', description: 'See you again soon!' });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function OrderDetailsModal({ order, onClose }: { order: DashboardOrder | null; onClose: () => void }) {
  if (!order) return null;
  const orderReference = order.order_reference ?? order.id;
  const createdAt = order.date ? new Date(order.date) : null;
  const pickupLocation = order.customer.pickupLocation ?? order.delivery_address ?? 'Store Pickup';
  return (
    <Dialog open={!!order} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto pr-10">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>Order {orderReference}</span>
            {createdAt && (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" /> {createdAt.toLocaleString()}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Items */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Items</h3>
            <div className="rounded-md border divide-y">
              {order.items.map((it) => (
                <div key={it.id} className="p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {it.image && (
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden flex items-center justify-center">
                        <img src={it.image} alt={it.name} className="max-w-full max-h-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{it.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {it.quantity}</div>
                    </div>
                  </div>
                  <div className="text-sm">KES {(it.price * it.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>KES {order.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span>Delivery Fee</span><span>KES {order.deliveryFee.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Total</span><span>KES {order.total.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Right: Status & Customer */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><CircleDot className="h-4 w-4" /> Status</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <StatusBadge active={order.status === 'pending'}>Pending</StatusBadge>
                <StatusBadge active={order.status === 'confirmed'}>Confirmed</StatusBadge>
                <StatusBadge active={order.status === 'shipped'}>Shipped</StatusBadge>
                <StatusBadge active={order.status === 'delivered'}>Delivered</StatusBadge>
                <StatusBadge active={order.status === 'cancelled'}>Cancelled</StatusBadge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Customer</h3>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {order.customer.firstName} {order.customer.lastName}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {order.customer.phone}</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {order.customer.email}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Fulfillment</h3>
              <div className="mt-2 text-sm space-y-1">
                <div>Delivery Method: <span className="font-medium capitalize">{order.deliveryMethod === 'speedy' ? 'Speedy Drop' : 'Pickup'}</span></div>
                {order.deliveryMethod === 'speedy' ? (
                  <div>Address: <span className="text-muted-foreground">{order.customer.address ?? order.delivery_address ?? '—'}</span></div>
                ) : (
                  <div>Pickup Location: <span className="text-muted-foreground">{pickupLocation}</span></div>
                )}
                <div>Payment Method: <span className="font-medium capitalize">{order.paymentMethod}</span></div>
                {order.note && (<div>Note: <span className="text-muted-foreground">{order.note}</span></div>)}
                {order.payment_reference && (
                  <div>Payment Reference: <span className="text-muted-foreground">{order.payment_reference}</span></div>
                )}
                {order.mpesa_receipt_number && (
                  <div>Receipt: <span className="text-muted-foreground">{order.mpesa_receipt_number}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md border ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent'}`}>{children}</span>
  );
}