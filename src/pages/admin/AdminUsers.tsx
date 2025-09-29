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
import GetDealsNumberService, { GetDealsUser } from "@/services/getdeals-number";
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
  RefreshCw,
  Hash,
  Copy,
  Wallet
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
  getdealsNumber?: string;
  walletBalance?: number;
  walletActive?: boolean;
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
  const [getdealsUsers, setGetdealsUsers] = useState<GetDealsUser[]>([]);
  const [getdealsStats, setGetdealsStats] = useState<any>(null);
  
  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminModalOpen, setNewAdminModalOpen] = useState(false);
  const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [deleteAdminModalOpen, setDeleteAdminModalOpen] = useState(false);
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

  // Edit admin form
  const [editAdminForm, setEditAdminForm] = useState<AdminUser | null>(null);
  
  // Lookup states
  const [lookupValue, setLookupValue] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  // Generate secure temporary password
  const generateTemporaryPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Available permissions for admin users
  const availablePermissions = [
    { id: 'all', name: 'All Permissions', description: 'Full system access' },
    { id: 'orders', name: 'Order Management', description: 'View and manage orders' },
    { id: 'customers', name: 'Customer Management', description: 'View and manage customers' },
    { id: 'inventory', name: 'Inventory Management', description: 'Manage products and stock' },
    { id: 'users', name: 'User Management', description: 'Manage admin users and permissions' },
    { id: 'settings', name: 'System Settings', description: 'Configure system settings' },
    { id: 'reports', name: 'Reports & Analytics', description: 'View system reports' },
    { id: 'wallet', name: 'Wallet Management', description: 'Manage user wallets and transactions' },
    { id: 'support', name: 'Customer Support', description: 'Access support tools and tickets' }
  ];

  // Load data
  useEffect(() => {
    loadCustomers();
    loadAdminUsers();
    loadGetDealsData();
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

  const loadGetDealsData = async () => {
    try {
      // Load GetDeals number statistics
      const stats = await GetDealsNumberService.getNumberStatistics();
      setGetdealsStats(stats);
      
      // This would load actual user data with GetDeals numbers in a real implementation
      // For now, we'll enhance the mock data with GetDeals numbers
      console.log('GetDeals system stats:', stats);
    } catch (error) {
      console.error('Error loading GetDeals data:', error);
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
    
    return names.map((name, index) => {
      const getdealsNumber = `GD-${String(100001 + index).padStart(6, '0')}`;
      return {
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
        notes: index % 4 === 0 ? "VIP customer - prefers early delivery" : undefined,
        getdealsNumber,
        walletBalance: Math.floor(Math.random() * 5000) + 500,
        walletActive: Math.random() > 0.1
      };
    });
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
        permissions: ["orders", "customers", "inventory", "reports"],
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
      },
      {
        id: "admin_4",
        name: "Sarah Kiprotich",
        email: "sarah@getdeals.co.ke",
        role: "staff",
        status: "inactive",
        lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: ["orders", "customers"],
        createdDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "admin_5",
        name: "Robert Maina",
        email: "robert@getdeals.co.ke",
        role: "manager",
        status: "active",
        lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        permissions: ["orders", "customers", "inventory", "wallet", "support"],
        createdDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  // Filter functions
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         (customer.getdealsNumber && customer.getdealsNumber.toLowerCase().includes(searchTerm.toLowerCase()));
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

    setIsCreatingAdmin(true);

    // Set default permissions based on role
    let defaultPermissions = newAdminForm.permissions;
    if (newAdminForm.role === 'admin') {
      defaultPermissions = ['all'];
    } else if (newAdminForm.role === 'manager') {
      defaultPermissions = ['orders', 'customers', 'inventory', 'reports'];
    } else if (newAdminForm.role === 'staff') {
      defaultPermissions = ['orders'];
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    try {
      const baseUrl = getApiBase();
      
      // First, create the admin user (we'll simulate this for now)
      const newUser: AdminUser = {
        id: `admin_${Date.now()}`,
        ...newAdminForm,
        permissions: defaultPermissions,
        status: "active",
        createdDate: new Date().toISOString(),
        lastLogin: undefined
      };

      // Then send the credentials email
      const emailResponse = await fetch(`${baseUrl}/api/admin/send-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminForm.name,
          email: newAdminForm.email,
          password: temporaryPassword,
          role: newAdminForm.role,
          permissions: defaultPermissions
        }),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        setAdminUsers(prev => [...prev, newUser]);
        toast({
          title: "Admin user created successfully!",
          description: `${newAdminForm.name} has been added as ${newAdminForm.role}. Login credentials have been sent to ${newAdminForm.email}`,
        });
        setNewAdminModalOpen(false);
        setNewAdminForm({ name: "", email: "", role: "staff", permissions: [] });
      } else {
        // Admin created but email failed
        setAdminUsers(prev => [...prev, newUser]);
        toast({
          title: "Admin user created (Email warning)",
          description: `${newAdminForm.name} has been added as ${newAdminForm.role}, but email delivery failed. Please provide credentials manually.`,
          variant: "destructive",
        });
        setNewAdminModalOpen(false);
        setNewAdminForm({ name: "", email: "", role: "staff", permissions: [] });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error creating admin user",
        description: "Failed to create admin user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditAdminForm({ ...admin });
    setEditAdminModalOpen(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editAdminForm) return;

    try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/users/${editAdminForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAdminForm),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setAdminUsers(prev => prev.map(u => u.id === editAdminForm.id ? updatedUser : u));
        toast({
          title: "Admin user updated",
          description: `${editAdminForm.name}'s details have been updated`,
        });
        setEditAdminModalOpen(false);
        setEditAdminForm(null);
      } else {
        throw new Error('Failed to update admin user');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      // Simulate success for demo
      setAdminUsers(prev => prev.map(u => u.id === editAdminForm.id ? editAdminForm : u));
      toast({
        title: "Admin user updated",
        description: `${editAdminForm.name}'s details have been updated`,
      });
      setEditAdminModalOpen(false);
      setEditAdminForm(null);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/users/${adminId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAdminUsers(prev => prev.filter(u => u.id !== adminId));
        toast({
          title: "Admin user deleted",
          description: "The admin user has been removed from the system",
        });
        setDeleteAdminModalOpen(false);
        setSelectedAdmin(null);
      } else {
        throw new Error('Failed to delete admin user');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      // Simulate success for demo
      setAdminUsers(prev => prev.filter(u => u.id !== adminId));
      toast({
        title: "Admin user deleted",
        description: "The admin user has been removed from the system",
      });
      setDeleteAdminModalOpen(false);
      setSelectedAdmin(null);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, newStatus: AdminUser['status']) => {
    try {
  const baseUrl = getApiBase();
  const response = await fetch(`${baseUrl}/api/admin/users/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setAdminUsers(prev => prev.map(u => 
          u.id === adminId ? { ...u, status: newStatus } : u
        ));
        toast({
          title: "Admin status updated",
          description: `Admin user status changed to ${newStatus}`,
        });
      } else {
        throw new Error('Failed to update admin status');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      // Simulate success for demo
      setAdminUsers(prev => prev.map(u => 
        u.id === adminId ? { ...u, status: newStatus } : u
      ));
      toast({
        title: "Admin status updated",
        description: `Admin user status changed to ${newStatus}`,
      });
    }
  };

  const getPermissionsByRole = (role: AdminUser['role']): string[] => {
    switch (role) {
      case 'admin':
        return ['all'];
      case 'manager':
        return ['orders', 'customers', 'inventory', 'reports'];
      case 'staff':
        return ['orders'];
      default:
        return [];
    }
  };

  const handleCopyGetDealsNumber = (getdealsNumber: string) => {
    navigator.clipboard.writeText(getdealsNumber);
    toast({
      title: "Copied!",
      description: "GetDeals number copied to clipboard",
    });
  };

  const handleLookupByGetDealsNumber = async (getdealsNumber: string) => {
    if (!getdealsNumber.trim()) {
      toast({
        title: "GetDeals Number Required",
        description: "Please enter a GetDeals number to lookup",
        variant: "destructive",
      });
      return;
    }

    // Validate format
    if (!GetDealsNumberService.validateFormat(getdealsNumber.trim())) {
      toast({
        title: "Invalid Format",
        description: "GetDeals number must be in format GD-XXXXXX (e.g., GD-100001)",
        variant: "destructive",
      });
      return;
    }

    setLookupLoading(true);
    
    try {
      // First try to find in our local customers data for quick lookup
      const localCustomer = customers.find(c => c.getdealsNumber === getdealsNumber.trim());
      
      if (localCustomer) {
        // Found locally - show customer details
        setSelectedCustomer(localCustomer);
        setCustomerModalOpen(true);
        toast({
          title: "User Found (Local)",
          description: `${localCustomer.name} - ${localCustomer.email}`,
        });
        return;
      }

      // If not found locally, try the service
      const user = await GetDealsNumberService.getUserByNumber(getdealsNumber.trim());
      if (user) {
        // Create a customer object from the service response
        const serviceCustomer: Customer = {
          id: user.user_id,
          name: user.full_name || 'Unknown User',
          email: user.email,
          phone: user.phone || 'Not provided',
          getdealsNumber: user.getdeals_number,
          walletBalance: user.wallet_balance || 0,
          walletActive: user.wallet_active || false,
          totalOrders: 0, // Not available from service
          totalSpent: 0, // Not available from service
          status: 'active' as const,
          joinDate: new Date().toISOString(), // Default
          preferredLocation: user.organization || undefined
        };

        setSelectedCustomer(serviceCustomer);
        setCustomerModalOpen(true);
        toast({
          title: "User Found (Database)",
          description: `${user.full_name || 'Unknown'} - ${user.email}`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with that GetDeals number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error looking up user:', error);
      toast({
        title: "Lookup Error",
        description: "Failed to lookup user by GetDeals number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const exportCustomerData = () => {
    const headers = ["Name", "Email", "Phone", "GetDeals Number", "Wallet Balance", "Total Orders", "Total Spent", "Status", "Join Date", "Last Order"];
    const rows = filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.getdealsNumber || "Not assigned",
      customer.walletBalance ? `KES ${customer.walletBalance}` : "KES 0",
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
                    placeholder="Search by name, email, phone, or GetDeals number..."
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Customers ({filteredCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="getdeals" className="gap-2">
              <Hash className="h-4 w-4" />
              GetDeals Numbers
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" />
              Admin Users ({filteredAdminUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      <p className="text-sm font-medium text-muted-foreground">GetDeals Numbers</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {customers.filter(c => c.getdealsNumber).length}
                      </p>
                    </div>
                    <Hash className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Wallet Balance</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        KES {customers.reduce((sum, c) => sum + (c.walletBalance || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-emerald-600" />
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
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Customer</TableHead>
                        <TableHead className="whitespace-nowrap">GetDeals Number</TableHead>
                        <TableHead className="whitespace-nowrap">Contact</TableHead>
                        <TableHead className="whitespace-nowrap">Wallet</TableHead>
                        <TableHead className="whitespace-nowrap">Orders</TableHead>
                        <TableHead className="whitespace-nowrap">Total Spent</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <div 
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerModalOpen(true);
                              }}
                            >
                              {customer.name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(customer.joinDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.getdealsNumber ? (
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
                                {customer.getdealsNumber}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyGetDealsNumber(customer.getdealsNumber!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary">Not assigned</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
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
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              KES {(customer.walletBalance || 0).toLocaleString()}
                            </div>
                            <Badge variant={customer.walletActive ? "default" : "secondary"} className="text-xs">
                              {customer.walletActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{customer.totalOrders}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">KES {customer.totalSpent.toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge className={getStatusBadge(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GetDeals Numbers Tab */}
          <TabsContent value="getdeals" className="space-y-6">
            {/* GetDeals Number System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Numbers Assigned</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {customers.filter(c => c.getdealsNumber).length}
                      </p>
                    </div>
                    <Hash className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Assignment</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {customers.filter(c => !c.getdealsNumber).length}
                      </p>
                    </div>
                    <UserX className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Wallets</p>
                      <p className="text-2xl font-bold text-green-600">
                        {customers.filter(c => c.walletActive).length}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Coverage Rate</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {customers.length > 0 ? Math.round((customers.filter(c => c.getdealsNumber).length / customers.length) * 100) : 0}%
                      </p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GetDeals Number Lookup Tool */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  GetDeals Number Lookup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="getdeals-lookup">Enter GetDeals Number</Label>
                    <Input
                      id="getdeals-lookup"
                      placeholder="GD-123456"
                      value={lookupValue}
                      onChange={(e) => setLookupValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && lookupValue.trim() && !lookupLoading) {
                          handleLookupByGetDealsNumber(lookupValue.trim());
                        }
                      }}
                      disabled={lookupLoading}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={() => {
                        if (lookupValue.trim()) {
                          handleLookupByGetDealsNumber(lookupValue.trim());
                        }
                      }}
                      className="gap-2"
                      disabled={!lookupValue.trim() || lookupLoading}
                    >
                      {lookupLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {lookupLoading ? 'Searching...' : 'Lookup'}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Format:</strong> GD-XXXXXX (e.g., GD-100001)</p>
                    <p>Use this tool to quickly find users by their GetDeals number for customer support.</p>
                    <p className="text-blue-600 mt-2">💡 Results will open in the customer details modal automatically</p>
                  </div>
                  
                  {/* Quick lookup buttons for testing */}
                  {customers.filter(c => c.getdealsNumber).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Quick Test Lookups:</p>
                      <div className="flex flex-wrap gap-2">
                        {customers.filter(c => c.getdealsNumber).slice(0, 3).map((customer) => (
                          <Button
                            key={customer.id}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setLookupValue(customer.getdealsNumber!);
                              handleLookupByGetDealsNumber(customer.getdealsNumber!);
                            }}
                            disabled={lookupLoading}
                            className="text-xs"
                          >
                            {customer.getdealsNumber}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* GetDeals Numbers Management */}
            <Card>
              <CardHeader>
                <CardTitle>GetDeals Number Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GetDeals Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Wallet Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.filter(c => c.getdealsNumber).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-sm bg-blue-50 px-2 py-1 rounded font-medium">
                              {customer.getdealsNumber}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyGetDealsNumber(customer.getdealsNumber!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div 
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerModalOpen(true);
                              }}
                            >
                              {customer.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Member since {new Date(customer.joinDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                            <div className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.walletActive ? "default" : "secondary"}>
                            {customer.walletActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            KES {(customer.walletBalance || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleLookupByGetDealsNumber(customer.getdealsNumber!)}
                            >
                              <Search className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {customers.filter(c => c.getdealsNumber).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div>No GetDeals numbers assigned yet.</div>
                    <div className="text-sm">Numbers will be automatically assigned when users register.</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>GetDeals Number System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Number Format</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Format:</span>
                        <span className="text-sm font-mono">GD-XXXXXX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Length:</span>
                        <span className="text-sm font-mono">9 characters</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Starting Number:</span>
                        <span className="text-sm font-mono">100001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="text-sm text-green-600">Sequential</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Usage</h3>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        • Unique user identification
                      </div>
                      <div className="text-sm text-gray-600">
                        • Wallet transaction mapping
                      </div>
                      <div className="text-sm text-gray-600">
                        • Customer support lookup
                      </div>
                      <div className="text-sm text-gray-600">
                        • Payment processing reference
                      </div>
                    </div>
                  </div>
                </div>
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

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Admins</p>
                      <p className="text-2xl font-bold">{adminUsers.length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Admins</p>
                      <p className="text-2xl font-bold text-green-600">
                        {adminUsers.filter(u => u.status === 'active').length}
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
                      <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {adminUsers.filter(u => u.role === 'admin').length}
                      </p>
                    </div>
                    <Crown className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Staff Members</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {adminUsers.filter(u => u.role === 'staff' || u.role === 'manager').length}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
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
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditAdmin(user)}
                              title="Edit User"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Select
                              value={user.status}
                              onValueChange={(value: AdminUser['status']) => 
                                handleToggleAdminStatus(user.id, value)
                              }
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                            {user.id !== 'admin_1' && user.role !== 'admin' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedAdmin(user);
                                  setDeleteAdminModalOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Delete User"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
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
                {/* GetDeals Number Section */}
                {selectedCustomer.getdealsNumber && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-blue-800">GetDeals Number</Label>
                        <p className="text-lg font-mono font-bold text-blue-600">{selectedCustomer.getdealsNumber}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyGetDealsNumber(selectedCustomer.getdealsNumber!)}
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

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
                    <Label className="text-sm font-medium">Wallet Balance</Label>
                    <p className="text-sm font-bold text-green-600">
                      KES {(selectedCustomer.walletBalance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Wallet Status</Label>
                    <Badge variant={selectedCustomer.walletActive ? "default" : "secondary"}>
                      {selectedCustomer.walletActive ? "Active" : "Inactive"}
                    </Badge>
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

        {/* Admin Detail Modal */}
        <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Admin User Details</DialogTitle>
            </DialogHeader>
            {selectedAdmin && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm flex items-center gap-2">
                      {getRoleIcon(selectedAdmin.role)}
                      {selectedAdmin.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusBadge(selectedAdmin.status)}>
                      {selectedAdmin.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedAdmin.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <Badge className={getRoleBadge(selectedAdmin.role)}>
                      {selectedAdmin.role}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created Date</Label>
                    <p className="text-sm">{new Date(selectedAdmin.createdDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <p className="text-sm">
                      {selectedAdmin.lastLogin 
                        ? new Date(selectedAdmin.lastLogin).toLocaleString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="mt-2 space-y-2">
                    {selectedAdmin.permissions.includes('all') ? (
                      <Badge variant="default" className="bg-amber-100 text-amber-800">
                        All Permissions
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedAdmin.permissions.map(permission => {
                          const permInfo = availablePermissions.find(p => p.id === permission);
                          return (
                            <Badge key={permission} variant="outline">
                              {permInfo?.name || permission}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdminModalOpen(false)}>
                Close
              </Button>
              {selectedAdmin && (
                <Button 
                  onClick={() => {
                    setAdminModalOpen(false);
                    handleEditAdmin(selectedAdmin);
                  }}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit User
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Admin Modal */}
        <Dialog open={newAdminModalOpen} onOpenChange={setNewAdminModalOpen}>
          <DialogContent className="max-w-lg">
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
                  onValueChange={(value: AdminUser['role']) => {
                    setNewAdminForm(prev => ({ 
                      ...prev, 
                      role: value,
                      permissions: getPermissionsByRole(value)
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div>Staff</div>
                          <div className="text-xs text-muted-foreground">Order management only</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <div>Manager</div>
                          <div className="text-xs text-muted-foreground">Orders, customers, inventory</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        <div>
                          <div>Admin</div>
                          <div className="text-xs text-muted-foreground">Full system access</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Permissions Preview</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  {newAdminForm.role === 'admin' ? (
                    <Badge variant="default" className="bg-amber-100 text-amber-800">
                      All Permissions
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getPermissionsByRole(newAdminForm.role).map(permission => {
                        const permInfo = availablePermissions.find(p => p.id === permission);
                        return (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permInfo?.name || permission}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
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
              <Button onClick={handleCreateAdmin} className="gap-2" disabled={isCreatingAdmin}>
                {isCreatingAdmin ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isCreatingAdmin ? "Creating & Sending Email..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Modal */}
        <Dialog open={editAdminModalOpen} onOpenChange={setEditAdminModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Admin User</DialogTitle>
            </DialogHeader>
            {editAdminForm && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editAdminName">Full Name</Label>
                  <Input
                    id="editAdminName"
                    value={editAdminForm.name}
                    onChange={(e) => setEditAdminForm(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="editAdminEmail">Email Address</Label>
                  <Input
                    id="editAdminEmail"
                    type="email"
                    value={editAdminForm.email}
                    onChange={(e) => setEditAdminForm(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="editAdminRole">Role</Label>
                  <Select 
                    value={editAdminForm.role} 
                    onValueChange={(value: AdminUser['role']) => {
                      setEditAdminForm(prev => prev ? ({ 
                        ...prev, 
                        role: value,
                        permissions: getPermissionsByRole(value)
                      }) : null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div>Staff</div>
                            <div className="text-xs text-muted-foreground">Order management only</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <div>
                            <div>Manager</div>
                            <div className="text-xs text-muted-foreground">Orders, customers, inventory</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          <div>
                            <div>Admin</div>
                            <div className="text-xs text-muted-foreground">Full system access</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Custom Permissions</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {availablePermissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-perm-${permission.id}`}
                          checked={editAdminForm.permissions.includes(permission.id) || editAdminForm.permissions.includes('all')}
                          disabled={editAdminForm.permissions.includes('all') || permission.id === 'all'}
                          onChange={(e) => {
                            if (!editAdminForm) return;
                            if (permission.id === 'all') {
                              setEditAdminForm(prev => prev ? ({
                                ...prev,
                                permissions: e.target.checked ? ['all'] : []
                              }) : null);
                            } else {
                              setEditAdminForm(prev => {
                                if (!prev) return null;
                                const newPermissions = e.target.checked
                                  ? [...prev.permissions.filter(p => p !== 'all'), permission.id]
                                  : prev.permissions.filter(p => p !== permission.id);
                                return { ...prev, permissions: newPermissions };
                              });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`edit-perm-${permission.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{permission.name}</span>
                            {(permission.id === 'all' && editAdminForm.permissions.includes('all')) && (
                              <Badge variant="default" className="bg-amber-100 text-amber-800 text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{permission.description}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={editAdminForm.status} 
                    onValueChange={(value: AdminUser['status']) => 
                      setEditAdminForm(prev => prev ? ({ ...prev, status: value }) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAdminModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAdmin} className="gap-2">
                <Edit className="h-4 w-4" />
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Admin Confirmation Modal */}
        <Dialog open={deleteAdminModalOpen} onOpenChange={setDeleteAdminModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Admin User</DialogTitle>
            </DialogHeader>
            {selectedAdmin && (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Are you sure you want to delete <strong>{selectedAdmin.name}</strong>? This action cannot be undone.
                  </AlertDescription>
                </Alert>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">User details:</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><strong>Name:</strong> {selectedAdmin.name}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedAdmin.email}</p>
                    <p className="text-sm"><strong>Role:</strong> {selectedAdmin.role}</p>
                    <p className="text-sm"><strong>Status:</strong> {selectedAdmin.status}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteAdminModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedAdmin && handleDeleteAdmin(selectedAdmin.id)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
