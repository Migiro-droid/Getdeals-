import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductsContext';
import { ProductCard } from '../../components/ProductCard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Plus, Package, TrendingUp, Eye } from 'lucide-react';

interface NewProduct {
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description?: string;
  items?: string[];
}

export const QuickMartDashboard: React.FC = () => {
  // Mock user for testing without authentication
  const mockUser = { name: 'QuickMart Admin', role: 'quickmart' };
  const user = mockUser;
  
  const { all: products, add: addProduct } = useProducts();
  const { toast } = useToast();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    price: 0,
    image: '',
    category: '',
  });

  // Authentication check removed for testing

  const quickMartProducts = products.filter(product => 
    product.category?.toLowerCase().includes('quickmart') || 
    product.name?.toLowerCase().includes('quickmart')
  );

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image || !newProduct.category) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    try {
      setIsAddingProduct(true);
      
      // Add QuickMart prefix to category to identify QuickMart products
      const productToAdd = {
        ...newProduct,
        category: `QuickMart - ${newProduct.category}`,
        items: newProduct.items?.filter(item => item.trim() !== '') || undefined,
      };

      await addProduct(productToAdd);
      
      toast({
        title: 'Product Added',
        description: 'Product has been successfully added to QuickMart catalog.',
      });

      // Reset form
      setNewProduct({
        name: '',
        price: 0,
        image: '',
        category: '',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add product. Please try again.',
      });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const getMostSellingProducts = () => {
    // This is a placeholder. In a real app, you'd have actual sales data
    return quickMartProducts.slice(0, 5).map(product => ({
      ...product,
      salesCount: Math.floor(Math.random() * 100) + 1,
    })).sort((a, b) => b.salesCount - a.salesCount);
  };

  const getTotalProducts = () => quickMartProducts.length;
  const getTotalSales = () => {
    // Placeholder calculation
    return getMostSellingProducts().reduce((total, product) => total + product.salesCount, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QuickMart Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
            </div>
            <div className="text-sm text-gray-500">
              Role: QuickMart Admin
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalProducts()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalSales()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Product Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getMostSellingProducts()[0]?.salesCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Manage Products</TabsTrigger>
            <TabsTrigger value="analytics">Sales Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Add Product Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Add and manage your QuickMart products</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mt-8">
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                          Add a new product to the QuickMart catalog.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <div>
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="Enter product name"
                            className="h-9"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="price">Price (KES)</Label>
                            <Input
                              id="price"
                              type="number"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                              placeholder="0"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="originalPrice">Original Price</Label>
                            <Input
                              id="originalPrice"
                              type="number"
                              value={newProduct.originalPrice || ''}
                              onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                              placeholder="0"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="image">Image URL</Label>
                          <Input
                            id="image"
                            value={newProduct.image}
                            onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beverages">Beverages</SelectItem>
                              <SelectItem value="Snacks">Snacks</SelectItem>
                              <SelectItem value="Groceries">Groceries</SelectItem>
                              <SelectItem value="Personal Care">Personal Care</SelectItem>
                              <SelectItem value="Household">Household</SelectItem>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newProduct.description || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            placeholder="Product description..."
                            className="h-20 resize-none"
                          />
                        </div>
                        <Button 
                          onClick={handleAddProduct} 
                          disabled={isAddingProduct}
                          className="w-full h-9"
                        >
                          {isAddingProduct ? 'Adding...' : 'Add Product'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>

            {/* Products Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Products ({quickMartProducts.length})</h3>
              {quickMartProducts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No products yet. Add your first product to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {quickMartProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Analytics</CardTitle>
                <CardDescription>View your top-selling products and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold">Top Selling Products</h4>
                  {getMostSellingProducts().length === 0 ? (
                    <p className="text-gray-600">No sales data available yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {getMostSellingProducts().map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-lg text-gray-600">#{index + 1}</span>
                                <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="w-10 h-10 object-cover rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">KES {product.price}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{product.salesCount} sold</p>
                            <p className="text-sm text-gray-600">KES {(product.price * product.salesCount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
