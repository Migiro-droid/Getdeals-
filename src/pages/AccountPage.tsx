import { useEffect, useState, type ReactNode } from "react";
import { User, Package, MapPin, Bell, Shield, LogOut, Truck, Phone, Mail, CalendarClock, CircleDot, Check, Star, Trash2, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useOrders, type Order, type OrderStatus } from "@/contexts/OrdersContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "react-router-dom";
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { orders, deleteOrder, metrics } = useOrders();
  const [active, setActive] = useState<Order | null>(null);
  const location = useLocation();
  const { toast } = useToast();
  const { profile, setProfile, notifications, setNotifications, addresses, addAddress, updateAddress, removeAddress, setDefaultAddress } = useAccount();
  const { signOut, changePassword, startTwoFactor, verifyTwoFactor, disableTwoFactor, user } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
  const [currPw, setCurrPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [qrImage, setQrImage] = useState<string | undefined>(undefined);
  const [twoFACode, setTwoFACode] = useState("");
  const [busy, setBusy] = useState(false);
  const urlParams = new URLSearchParams(location.search);
  const defaultTab = urlParams.get("tab") || (location.state as any)?.tab || "profile";
  
  // Calculate total savings (assuming 20% average savings from basket deals)
  const totalSavings = Math.round(metrics.totalRevenue * 0.2);
  const statusPill = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      delivered: "bg-emerald-100 text-emerald-800",
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-indigo-100 text-indigo-800",
      out_for_delivery: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${map[s]}`;
  };
  const statusLabel = (s: OrderStatus) => s.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
  const orderToHighlight = (location.state as any)?.orderId as string | undefined;
  useEffect(() => {
    if (orderToHighlight && orders.length) {
      const o = orders.find(o => o.id === orderToHighlight);
      if (o) setActive(o);
    }
  }, [orderToHighlight, orders]);

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
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-primary" />
                  </div>
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
                    <span>{metrics.orderCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Total saved</span>
                    <span className="text-green-600 font-medium">KES {totalSavings.toLocaleString()}</span>
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
                  <CardContent className="space-y-4">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Order History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No orders yet.</div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((o) => (
                          <div key={o.id} className={`border rounded-lg p-4 ${orderToHighlight === o.id ? 'ring-2 ring-primary' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{o.id}</h4>
                                <p className="text-sm text-muted-foreground">{new Date(o.date).toLocaleString()}</p>
                              </div>
                              <span className={statusPill(o.status)}>{statusLabel(o.status)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">{o.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}</p>
                                <p className="font-medium">KES {o.total.toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setActive(o)}>View Details</Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteOrder(o.id)}>Delete</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Saved Addresses
                    </CardTitle>
                    <Button onClick={() => addAddress({ label: `New Address`, details: "", isDefault: false })}>
                      <Plus className="h-4 w-4 mr-2" /> Add Address
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {addresses.map((a) => (
                        <div key={a.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{a.label}</h4>
                              {a.isDefault && <Badge variant="secondary">Default</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              {!a.isDefault && (
                                <Button variant="outline" size="sm" onClick={() => setDefaultAddress(a.id)}>
                                  <Star className="h-4 w-4 mr-1" /> Set Default
                                </Button>
                              )}
                              <Button variant="outline" size="icon" onClick={() => removeAddress(a.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label>Label</Label>
                              <Input value={a.label} onChange={(e) => updateAddress(a.id, { label: e.target.value || "" })} />
                            </div>
                            <div>
                              <Label>Address Details</Label>
                              <Input value={a.details} onChange={(e) => updateAddress(a.id, { details: e.target.value || "" })} placeholder="Street, City, etc." />
                            </div>
                          </div>
                        </div>
                      ))}
                      {addresses.length === 0 && (
                        <div className="text-sm text-muted-foreground">No saved addresses yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                        Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" onClick={() => setPwOpen(true)}>
                        Change Password
                      </Button>
                      
                      {user?.twoFactorEnabled ? (
                        <Button variant="outline" className="w-full justify-start" onClick={async () => {
                          if (confirm('Disable two-factor authentication?')) {
                            setBusy(true);
                            const res = await disableTwoFactor();
                            setBusy(false);
                            if (!res.ok) return toast({ title: 'Failed to disable 2FA', description: res.error, variant: 'destructive' as any });
                            toast({ title: 'Two-Factor disabled' });
                          }
                        }} disabled={busy}>
                          Disable Two-Factor Authentication
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full justify-start" onClick={async () => {
                          setTwoFAOpen(true);
                          setQrImage(undefined);
                          setTwoFACode("");
                          setBusy(true);
                          const res = await startTwoFactor();
                          setBusy(false);
                          if (!res.ok) return toast({ title: 'Failed to start 2FA', description: res.error, variant: 'destructive' as any });
                          setQrImage(res.qrImage);
                        }} disabled={busy}>
                          Enable Two-Factor Authentication
                        </Button>
                      )}
                      
                      <Separator />
                      
                      <div className="flex items-center gap-2">
                        <Button variant="destructive" className="justify-start" onClick={() => {
                          if (confirm('Sign out of your account?')) { signOut(); toast({ title: 'Signed out' }); }
                        }}>
                          <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </Button>
                        <Button variant="ghost" size="icon" title="Sign out" onClick={() => { if (confirm('Sign out of your account?')) { signOut(); toast({ title: 'Signed out' }); } }}>
                          <Power className="h-4 w-4" />
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
        <div className="space-y-3">
          <div>
            <Label htmlFor="curr-pw">Current Password</Label>
            <Input id="curr-pw" type="password" value={currPw} onChange={(e) => setCurrPw(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new-pw">New Password</Label>
            <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="conf-pw">Confirm New Password</Label>
            <Input id="conf-pw" type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!currPw || !newPw || !confPw) return toast({ title: 'Fill all fields' });
              if (newPw !== confPw) return toast({ title: 'Passwords do not match' });
              setBusy(true);
              const res = await changePassword(currPw, newPw);
              setBusy(false);
              if (!res.ok) return toast({ title: 'Change failed', description: res.error, variant: 'destructive' as any });
              toast({ title: 'Password changed' });
              setCurrPw(""); setNewPw(""); setConfPw(""); setPwOpen(false);
            }} disabled={busy}>Save</Button>
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
    </>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;
  return (
    <Dialog open={!!order} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto pr-10">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>Order {order.id}</span>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" /> {new Date(order.date).toLocaleString()}</span>
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
                <StatusBadge active={order.status === 'preparing'}>Preparing</StatusBadge>
                <StatusBadge active={order.status === 'out_for_delivery'}>Out for delivery</StatusBadge>
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
                  <div>Address: <span className="text-muted-foreground">{order.customer.address}</span></div>
                ) : (
                  <div>Pickup Location: <span className="text-muted-foreground">{order.customer.pickupLocation}</span></div>
                )}
                <div>Payment Method: <span className="font-medium capitalize">{order.paymentMethod}</span></div>
                {order.note && (<div>Note: <span className="text-muted-foreground">{order.note}</span></div>)}
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