import { useState, useMemo } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Package, Search, Plus, Minus, TrendingUp, AlertTriangle, User, Shield, Crown } from "lucide-react";
import { Link } from "react-router-dom";

export default function InventoryPage() {
  const { inventory, updateStock, restockItem, getInStockItems, getLowStockItems, getTotalValue } = useInventory();
  const { role, user } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "value" | "category">("name");
  const [restockDialog, setRestockDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [restockQuantity, setRestockQuantity] = useState(0);

  const inStockItems = getInStockItems();
  const lowStockItems = getLowStockItems();
  const totalValue = getTotalValue();

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

  const categories = useMemo(() => {
    const cats = new Set(inventory.map(item => item.category));
    return Array.from(cats).sort();
  }, [inventory]);

  const filteredItems = useMemo(() => {
    let items = inStockItems;
    
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      items = items.filter(item => item.category === categoryFilter);
    }
    
    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case "stock":
          return b.stock - a.stock;
        case "value":
          return (b.stock * b.price) - (a.stock * a.price);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return items;
  }, [inStockItems, searchTerm, categoryFilter, sortBy]);

  const handleRestock = () => {
    if (restockDialog.item && restockQuantity > 0) {
      restockItem(restockDialog.item.id, restockQuantity);
      setRestockDialog({ open: false, item: null });
      setRestockQuantity(0);
    }
  };

  const getStockStatus = (item: any) => {
    if (item.stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (item.stock <= item.lowStockThreshold) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              Inventory Management
            </h1>
            <p className="text-muted-foreground">Track stock levels and manage inventory</p>
          </div>
          <UserDisplay />
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Items In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{inStockItems.length}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-blue-600">KES {totalValue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Package className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/inventory/out-of-stock">View Out of Stock</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="stock">Sort by Stock</SelectItem>
                  <SelectItem value="value">Sort by Value</SelectItem>
                  <SelectItem value="category">Sort by Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Items in Stock ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  const value = item.stock * item.price;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image.startsWith('/') ? item.image : `/src/assets/${item.image.split('/').pop()}`}
                            alt={item.name}
                            className="h-10 w-10 rounded object-contain bg-muted"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/src/assets/essential-basket.jpg';
                            }}
                          />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {item.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateStock(item.id, item.stock - 1)}
                            disabled={item.stock <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-mono text-sm w-8 text-center">{item.stock}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateStock(item.id, item.stock + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>KES {item.price.toLocaleString()}</TableCell>
                      <TableCell>KES {value.toLocaleString()}</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>
                        <Dialog 
                          open={restockDialog.open && restockDialog.item?.id === item.id}
                          onOpenChange={(open) => setRestockDialog({ open, item: open ? item : null })}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Restock</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Restock {item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="quantity">Add Quantity</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  min="1"
                                  value={restockQuantity}
                                  onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                                  placeholder="Enter quantity to add"
                                />
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Current stock: {item.stock} units<br />
                                After restock: {item.stock + restockQuantity} units
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleRestock} disabled={restockQuantity <= 0}>
                                  Confirm Restock
                                </Button>
                                <Button variant="outline" onClick={() => setRestockDialog({ open: false, item: null })}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No items found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
