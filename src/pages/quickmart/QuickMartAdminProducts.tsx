import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Trash2, Edit2, Search } from 'lucide-react';
import { useProducts } from '@/contexts/ProductsContext';
import { AdminBulkUpload } from '@/components/AdminBulkUpload';

interface QuickMartProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description?: string;
  category: string;
  branch?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface NewProduct {
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description?: string;
  branch?: string;
  stock?: number;
}

export const QuickMartAdminProducts: React.FC = () => {
  const { all: products, add: addProduct, remove: removeProduct } = useProducts();
  const { toast } = useToast();
  const [quickmartProducts, setQuickmartProducts] = useState<QuickMartProduct[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    price: 0,
    image: '',
    category: 'quickmart',
    description: '',
    branch: 'Quickmart Lavington',
    stock: 0,
  });

  const branches = [
    'Quickmart Lavington',
    'Quickmart Roysambu',
    'Quickmart Westlands',
    'Quickmart Thindiuga',
    'Quickmart Mombasa Road',
  ];

  const categories = [
    'Vegetables',
    'Fruits',
    'Dairy',
    'Meat',
    'Bakery',
    'Beverages',
    'Household',
    'Personal Care',
    'Other'
  ];

  // Filter products for Quickmart
  useEffect(() => {
    const filtered = products.filter(p => 
      p.category === 'quickmart' || p.category?.toLowerCase().includes('quickmart')
    );
    setQuickmartProducts(filtered as QuickMartProduct[]);
  }, [products]);

  // Search filter
  const filteredProducts = quickmartProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.branch?.toLowerCase().includes(search.toLowerCase())
  );

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newProduct.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (newProduct.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (newProduct.originalPrice && newProduct.originalPrice <= newProduct.price) {
      errors.originalPrice = 'Original price must be greater than current price';
    }

    if (!newProduct.image.trim()) {
      errors.image = 'Image URL is required';
    } else if (!isValidUrl(newProduct.image)) {
      errors.image = 'Please enter a valid image URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    if (!string || typeof string !== 'string' || string.trim().length === 0) {
      return false;
    }
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleAddProduct = async () => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Form Validation Error',
        description: 'Please fix the errors and try again.',
      });
      return;
    }

    try {
      setIsAddingProduct(true);

      const productToAdd = {
        name: newProduct.name.trim(),
        description: newProduct.description?.trim() || undefined,
        price: newProduct.price,
        originalPrice: newProduct.originalPrice && newProduct.originalPrice > 0 ? newProduct.originalPrice : undefined,
        category: 'quickmart',
        image: newProduct.image.trim(),
        discount: 0,
      };

      await addProduct(productToAdd);

      toast({
        title: 'Product Added',
        description: `${newProduct.name} has been added to Quickmart catalog.`,
      });

      // Reset form
      setNewProduct({
        name: '',
        price: 0,
        image: '',
        category: 'quickmart',
        description: '',
        branch: 'Quickmart Lavington',
        stock: 0,
      });
      setFormErrors({});
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add product.',
      });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await removeProduct(id);
      toast({
        title: 'Product Deleted',
        description: `${name} has been removed.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete product.',
      });
    }
  };

  const getStockStatus = (stock?: number) => {
    if (!stock || stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  };

  const getStockColor = (stock?: number) => {
    if (!stock || stock === 0) return 'bg-red-100 text-red-800';
    if (stock < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold">📦 Products Management</h2>
          </div>
          <p className="text-sm text-gray-600">Add, edit, and manage your Quickmart product inventory</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkUploadOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to the Quickmart catalog.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Organic Tomatoes"
                    className={`h-9 ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="price">Price (KES) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      placeholder="0"
                      className={`h-9 ${formErrors.price ? 'border-red-500' : ''}`}
                    />
                    {formErrors.price && <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>}
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Original Price</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={newProduct.originalPrice || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="0"
                      className={`h-9 ${formErrors.originalPrice ? 'border-red-500' : ''}`}
                    />
                    {formErrors.originalPrice && <p className="text-sm text-red-500 mt-1">{formErrors.originalPrice}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={newProduct.branch} onValueChange={(value) => setNewProduct({ ...newProduct, branch: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="0"
                    className="h-9"
                  />
                </div>

                <div>
                  <Label htmlFor="image">Image URL *</Label>
                  <Input
                    id="image"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className={`h-9 ${formErrors.image ? 'border-red-500' : ''}`}
                  />
                  {formErrors.image && <p className="text-sm text-red-500 mt-1">{formErrors.image}</p>}
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
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products by name or branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">
              {quickmartProducts.length === 0 
                ? "No products yet. Add your first product to get started!"
                : "No products match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.branch || 'N/A'}</TableCell>
                    <TableCell className="text-right">KES {product.price.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{product.stock || 0}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockColor(product.stock)}`}>
                        {getStockStatus(product.stock)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            toast({
                              title: "Coming Soon",
                              description: "Edit functionality will be available soon.",
                            });
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <AdminBulkUpload onClose={() => setIsBulkUploadOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
