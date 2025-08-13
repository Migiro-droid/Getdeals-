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
import { PackageX, Search, AlertTriangle, TrendingDown, Package, User, Shield, Crown } from "lucide-react";
import { Link } from "react-router-dom";

export default function OutOfStockPage() {
  const { inventory, restockItem, getOutOfStockItems, getInStockItems } = useInventory();
  const { role, user } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "category" | "price">("name");
  const [restockDialog, setRestockDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [restockQuantity, setRestockQuantity] = useState(0);

  const outOfStockItems = getOutOfStockItems();
  const inStockItems = getInStockItems();

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
    let items = outOfStockItems;
    
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
        case "price":
          return b.price - a.price;
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return items;
  }, [outOfStockItems, searchTerm, categoryFilter, sortBy]);

  const handleRestock = () => {
    if (restockDialog.item && restockQuantity > 0) {
      restockItem(restockDialog.item.id, restockQuantity);
      setRestockDialog({ open: false, item: null });
      setRestockQuantity(0);
    }
  };

  const stockOutRate = inventory.length > 0 ? ((outOfStockItems.length / inventory.length) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PackageX className="h-8 w-8 text-red-600" />
              Out of Stock Items
            </h1>
            <p className="text-muted-foreground">Items that need immediate restocking</p>
          </div>
          <UserDisplay />
        </div>

        {/* Alert Banner */}
        {outOfStockItems.length > 0 && (
          <Card className="border-red-300/50 bg-red-50">
            <CardContent className="py-4 flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="font-medium">Critical Stock Alert</div>
                <div className="text-sm">
                  {outOfStockItems.length} items are completely out of stock ({stockOutRate}% of total inventory)
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStockItems.length}</p>
                </div>
                <PackageX className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
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
                  <p className="text-sm text-muted-foreground">Stock Out Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{stockOutRate}%</p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
                <Package className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/inventory">View All Inventory</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        {outOfStockItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">Great News!</h3>
              <p className="text-muted-foreground">All items are currently in stock. No restocking needed at this time.</p>
              <Button className="mt-4" asChild>
                <Link to="/admin/inventory">View Full Inventory</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Search out of stock items..."
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
                      <SelectItem value="price">Sort by Price</SelectItem>
                      <SelectItem value="category">Sort by Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Out of Stock Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Items Requiring Restock ({filteredItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Low Stock Threshold</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Last Restocked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const lastRestocked = item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'Never';
                      
                      return (
                        <TableRow key={item.id} className="bg-red-50/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img 
                                src={item.image.startsWith('/') ? item.image : `/src/assets/${item.image.split('/').pop()}`}
                                alt={item.name}
                                className="h-10 w-10 rounded object-cover"
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
                          <TableCell>KES {item.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.lowStockThreshold} units</Badge>
                          </TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{lastRestocked}</span>
                          </TableCell>
                          <TableCell>
                            <Dialog 
                              open={restockDialog.open && restockDialog.item?.id === item.id}
                              onOpenChange={(open) => setRestockDialog({ open, item: open ? item : null })}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Restock Now
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Restock {item.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-red-50 p-3 rounded-lg">
                                    <p className="text-sm text-red-700">
                                      <strong>Critical:</strong> This item is completely out of stock
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="quantity">Restock Quantity</Label>
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
                                    Current stock: {item.stock} units (OUT OF STOCK)<br />
                                    After restock: {restockQuantity} units<br />
                                    Recommended: At least {item.lowStockThreshold} units
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={handleRestock} 
                                      disabled={restockQuantity <= 0}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
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
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No out of stock items found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
