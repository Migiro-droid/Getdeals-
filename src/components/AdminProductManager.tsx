import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { productAPI } from '../../lib/supabase';
import { Plus, Edit, Trash2, Package, AlertCircle, Check } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string;
  imageUrl: string | null;
  inStock: boolean;
  tags: string[] | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: string;
  imageUrl: string;
  inStock: boolean;
  tags: string;
  featured: boolean;
};

export function AdminProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    originalPrice: null,
    category: '',
    imageUrl: '',
    inStock: true,
    tags: '',
    featured: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Health & Beauty',
    'Books & Media',
    'Toys & Games',
    'Automotive',
    'Food & Beverages',
    'Office Supplies'
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await productAPI.getAll();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setProducts((data || []).map(product => ({
        ...(product as any),
        imageUrl: (product as any).image || null,
        inStock: (product as any).itemsDetail?.inStock !== undefined ? (product as any).itemsDetail.inStock : true,
        tags: (product as any).items || null
      })));
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error Loading Products",
        description: error instanceof Error ? error.message : "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      originalPrice: null,
      category: '',
      imageUrl: '',
      inStock: true,
      tags: '',
      featured: false,
    });
    setFormErrors({});
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      imageUrl: product.imageUrl || '',
      inStock: product.inStock,
      tags: product.tags ? product.tags.join(', ') : '',
      featured: product.featured,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (formData.originalPrice && formData.originalPrice <= formData.price) {
      errors.originalPrice = 'Original price must be greater than current price';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      errors.imageUrl = 'Please enter a valid image URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price,
        originalPrice: formData.originalPrice && formData.originalPrice > 0 ? formData.originalPrice : null,
        category: formData.category,
        image: formData.imageUrl.trim() || null,
        items: formData.tags.trim() ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        itemsDetail: formData.inStock ? { inStock: true } : { inStock: false },
        discount: 0
      };

      if (editingProduct) {
        // Update existing product
        const { data, error } = await productAPI.update(editingProduct.id, productData);
        
        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
            ...(data as any),
            imageUrl: (data as any).image || null,
            inStock: (data as any).itemsDetail?.inStock !== undefined ? (data as any).itemsDetail.inStock : true,
            tags: (data as any).items || null
          } : p));
          toast({
            title: "Product Updated",
            description: `${productData.name} has been updated successfully.`,
          });
        }
      } else {
        // Create new product
        const { data, error } = await productAPI.create(productData);
        
        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          setProducts(prev => [{
            ...(data as any),
            imageUrl: (data as any).image || null,
            inStock: (data as any).itemsDetail?.inStock !== undefined ? (data as any).itemsDetail.inStock : true,
            tags: (data as any).items || null
          }, ...prev]);
          toast({
            title: "Product Created",
            description: `${productData.name} has been added successfully.`,
          });
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error Saving Product",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await productAPI.delete(product.id);
      
      if (error) {
        throw new Error(error.message);
      }

      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast({
        title: "Product Deleted",
        description: `${product.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error Deleting Product",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Package className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your GetDeals Kenya product catalog
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                Start building your catalog by adding your first product.
              </p>
              <Button onClick={openAddModal} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                        {product.description && (
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{product.category}</Badge>
                          {product.featured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                          <Badge variant={product.inStock ? "default" : "destructive"}>
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>

                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && (
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(product)}
                            className="gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            className="gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the product information below.'
                : 'Fill in the details to add a new product to your catalog.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="price">Current Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className={formErrors.price ? 'border-red-500' : ''}
                />
                {formErrors.price && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.price}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="originalPrice">Original Price (KES)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    originalPrice: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="0.00"
                  className={formErrors.originalPrice ? 'border-red-500' : ''}
                />
                {formErrors.originalPrice && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.originalPrice}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.category}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className={formErrors.imageUrl ? 'border-red-500' : ''}
                />
                {formErrors.imageUrl && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.imageUrl}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="smartphone, android, mobile"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="inStock"
                  checked={formData.inStock}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inStock: checked }))}
                />
                <Label htmlFor="inStock">In Stock</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
                <Label htmlFor="featured">Featured Product</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <Package className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
