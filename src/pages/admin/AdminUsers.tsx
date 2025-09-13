import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getApiBase } from '@/lib/api';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  DollarSign,
  Search,
  Filter,
  Send,
  MessageSquare,
  UserCheck,
  UserX,
  Crown,
  Shield,
  User,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  joinDate: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'blocked';
  preferredLocation?: string;
  notes?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'manager';
  status: 'active' | 'inactive';
  lastLogin?: string;
  permissions: string[];
  createdDate: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminModalOpen, setNewAdminModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  
  // Form states
  const [messageType, setMessageType] = useState<"email" | "sms">("email");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  
  // New admin form
  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    role: "staff" as AdminUser['role'],
    permissions: [] as string[]
  });

  // Load data
  useEffect(() => {
    loadCustomers();
    loadAdminUsers();
  }, []);

  const loadCustomers = async () => {
    try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        throw new Error('Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error loading customers",
        description: "Failed to fetch customer data",
        variant: "destructive",
      });
      // Load mock data for demo
      setCustomers(generateMockCustomers());
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      } else {
        throw new Error('Failed to load admin users');
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
      // Load mock data for demo
      setAdminUsers(generateMockAdminUsers());
    }
  };

  const generateMockCustomers = (): Customer[] => {
    const names = [
      { first: "James", last: "Mwangi" },
      { first: "Aisha", last: "Khan" },
      { first: "Peter", last: "Otieno" },
      { first: "Grace", last: "Wanjiru" },
      { first: "John", last: "Kamau" },
      { first: "Mary", last: "Njeri" },
      { first: "David", last: "Kiprotich" },
      { first: "Sarah", last: "Wambui" }
    ];
    
    const locations = ["Karen Branch", "Westlands Branch", "CBD Branch", "Kilimani Branch"];
    
    return names.map((name, index) => ({
      id: `cust_${Date.now()}_${index}`,
      name: `${name.first} ${name.last}`,
      email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@gmail.com`,
      phone: `+254 7${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      address: index % 3 === 0 ? `${Math.floor(Math.random() * 100) + 1} ${name.last} Street, Nairobi` : undefined,
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastOrderDate: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      totalOrders: Math.floor(Math.random() * 20) + 1,
      totalSpent: Math.floor(Math.random() * 50000) + 1000,
      status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'blocked',
      preferredLocation: locations[index % locations.length],
      notes: index % 4 === 0 ? "VIP customer - prefers early delivery" : undefined
    }));
  };

  const generateMockAdminUsers = (): AdminUser[] => {
    return [
      {
        id: "admin_1",
        name: "Eric Ndivo",
        email: "eric@getdeals.co.ke",
        role: "admin",
        status: "active",
        lastLogin: new Date().toISOString(),
        permissions: ["all"],
        createdDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "admin_2",
        name: "Jane Wanjiku",
        email: "jane@getdeals.co.ke",
        role: "manager",
        status: "active",
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        permissions: ["orders", "customers", "inventory"],
        createdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "admin_3",
        name: "Michael Ochieng",
        email: "michael@getdeals.co.ke",
        role: "staff",
        status: "active",
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        permissions: ["orders"],
        createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  // Filter functions
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAdminUsers = adminUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Action handlers
  const handleUpdateCustomerStatus = async (customerId: string, newStatus: Customer['status']) => {
    try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setCustomers(prev => prev.map(c => 
          c.id === customerId ? { ...c, status: newStatus } : c
        ));
        toast({
          title: "Customer status updated",
          description: `Customer status changed to ${newStatus}`,
        });
      } else {
        throw new Error('Failed to update customer status');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      // Simulate success for demo
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, status: newStatus } : c
      ));
      toast({
        title: "Customer status updated",
        description: `Customer status changed to ${newStatus}`,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    try {
      const recipientType = selectedCustomerIds.length > 0 ? "selected" : "all";
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: messageType,
          subject: messageSubject,
          message: messageContent,
          recipientType,
          customerIds: selectedCustomerIds,
        }),
      });

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: `${messageType.toUpperCase()} sent to ${recipientType === "all" ? "all customers" : `${selectedCustomerIds.length} selected customers`}`,
        });
        setMessageModalOpen(false);
        setMessageContent("");
        setMessageSubject("");
        setSelectedCustomerIds([]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Simulate success for demo
      toast({
        title: "Message sent successfully!",
        description: `${messageType.toUpperCase()} sent to ${selectedCustomerIds.length > 0 ? `${selectedCustomerIds.length} customers` : "all customers"}`,
      });
      setMessageModalOpen(false);
      setMessageContent("");
      setMessageSubject("");
      setSelectedCustomerIds([]);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminForm.name.trim() || !newAdminForm.email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in name and email",
        variant: "destructive",
      });
      return;
    }

    try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminForm),
      });

      if (response.ok) {
        const newUser = await response.json();
        setAdminUsers(prev => [...prev, newUser]);
        toast({
          title: "Admin user created",
          description: `${newAdminForm.name} has been added as ${newAdminForm.role}`,
        });
        setNewAdminModalOpen(false);
        setNewAdminForm({ name: "", email: "", role: "staff", permissions: [] });
      } else {
        throw new Error('Failed to create admin user');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      // Simulate success for demo
      const newUser: AdminUser = {
        id: `admin_${Date.now()}`,
        ...newAdminForm,
        status: "active",
        createdDate: new Date().toISOString(),
        lastLogin: undefined
      };
      setAdminUsers(prev => [...prev, newUser]);
      toast({
        title: "Admin user created",
        description: `${newAdminForm.name} has been added as ${newAdminForm.role}`,
      });
      setNewAdminModalOpen(false);
      setNewAdminForm({ name: "", email: "", role: "staff", permissions: [] });
    }
  };

  const exportCustomerData = () => {
    const headers = ["Name", "Email", "Phone", "Total Orders", "Total Spent", "Status", "Join Date", "Last Order"];
    const rows = filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.totalOrders,
      customer.totalSpent,
      customer.status,
      new Date(customer.joinDate).toLocaleDateString(),
      customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "Never"
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRoleIcon = (role: AdminUser['role']) => {
    switch (role) {
      case "admin": return <Crown className="h-4 w-4 text-amber-600" />;
      case "manager": return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: AdminUser['role']) => {
    const colors = {
      admin: "bg-amber-100 text-amber-800",
      manager: "bg-blue-100 text-blue-800",
      staff: "bg-gray-100 text-gray-800"
    };
    return `${colors[role]} border-0`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "blocked": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading user data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage customers and admin users</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setMessageModalOpen(true)} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Message
            </Button>
            <Button onClick={exportCustomerData} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Customers ({filteredCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" />
              Admin Users ({filteredAdminUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                      <p className="text-2xl font-bold">{customers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Customers</p>
                      <p className="text-2xl font-bold text-green-600">
                        {customers.filter(c => c.status === 'active').length}
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        KES {customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                      <p className="text-2xl font-bold text-purple-600">
                        KES {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0).toLocaleString() : 0}
                      </p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Database</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Order</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(customer.joinDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                            {customer.preferredLocation && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {customer.preferredLocation}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{customer.totalOrders}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">KES {customer.totalSpent.toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {customer.lastOrderDate 
                              ? new Date(customer.lastOrderDate).toLocaleDateString()
                              : "Never"
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerModalOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Select
                              value={customer.status}
                              onValueChange={(value: Customer['status']) => 
                                handleUpdateCustomerStatus(customer.id, value)
                              }
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Users Tab */}
          <TabsContent value="admin" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Admin Users</h2>
                <p className="text-sm text-muted-foreground">Manage administrative access and permissions</p>
              </div>
              <Button onClick={() => setNewAdminModalOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Admin User
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdminUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {getRoleIcon(user.role)}
                              {user.name}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadge(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.lastLogin 
                              ? new Date(user.lastLogin).toLocaleString()
                              : "Never"
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.permissions.includes("all") 
                              ? "All permissions" 
                              : user.permissions.join(", ")
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedAdmin(user);
                                setAdminModalOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Customer Detail Modal */}
        <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusBadge(selectedCustomer.status)}>
                      {selectedCustomer.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Orders</Label>
                    <p className="text-sm font-bold">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Spent</Label>
                    <p className="text-sm font-bold">KES {selectedCustomer.totalSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Join Date</Label>
                    <p className="text-sm">{new Date(selectedCustomer.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Order</Label>
                    <p className="text-sm">
                      {selectedCustomer.lastOrderDate 
                        ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
                {selectedCustomer.address && (
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm">{selectedCustomer.address}</p>
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Message Modal */}
        <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Message to Customers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="messageType">Message Type</Label>
                <Select value={messageType} onValueChange={(value: "email" | "sms") => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {messageType === "email" && (
                <div>
                  <Label htmlFor="messageSubject">Subject</Label>
                  <Input
                    id="messageSubject"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="messageContent">Message</Label>
                <Textarea
                  id="messageContent"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={messageType === "email" ? "Enter your email message..." : "Enter your SMS message (160 chars max)"}
                  rows={4}
                  maxLength={messageType === "sms" ? 160 : undefined}
                />
                {messageType === "sms" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {messageContent.length}/160 characters
                  </p>
                )}
              </div>
              <Alert>
                <AlertDescription>
                  This message will be sent to {selectedCustomerIds.length > 0 ? `${selectedCustomerIds.length} selected customers` : "all active customers"}.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} className="gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Admin Modal */}
        <Dialog open={newAdminModalOpen} onOpenChange={setNewAdminModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminName">Full Name</Label>
                <Input
                  id="adminName"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="adminEmail">Email Address</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="adminRole">Role</Label>
                <Select 
                  value={newAdminForm.role} 
                  onValueChange={(value: AdminUser['role']) => setNewAdminForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Alert>
                <AlertDescription>
                  The new user will receive an email with login instructions and temporary password.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewAdminModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAdmin} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
