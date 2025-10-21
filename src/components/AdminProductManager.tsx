import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { productAPI } from '../../lib/supabase';
import { AdminBulkUpload } from './AdminBulkUpload';
import { useProducts } from '@/contexts/ProductsContext';
import { Plus, Edit, Trash2, Package, AlertCircle, Check, Search, Filter, X, SlidersHorizontal, Upload } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  category: string;
  imageUrl: string | null;
  tags: string[] | null; // legacy comma separated input mapping to items
  itemsDetail?: { name: string; image: string }[]; // per-item images
  isHotDeal?: boolean;
  isNewArrival?: boolean;
  isSpecialDeal?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: string;
  imageUrl: string;
  tags: string; // raw comma separated names entry (optional convenience)
  itemsDetail: { name: string; image: string }[]; // authoritative items representation
  isHotDeal: boolean;
  isNewArrival: boolean;
  isSpecialDeal: boolean;
  isTopBasket: boolean;
};

export function AdminProductManager() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    originalPrice: null,
    category: '',
    imageUrl: '',
    tags: '',
    itemsDetail: [],
    isHotDeal: false,
    isNewArrival: false,
    isSpecialDeal: false,
    isTopBasket: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { all: contextProducts, add: addToContext, update: updateInContext, remove: removeFromContext, version } = useProducts();

  // Use context products instead of local state
  const products = contextProducts.map(product => ({
    ...product,
    imageUrl: (product as any).image || null,
    tags: (product as any).items || null,
    itemsDetail: (product as any).itemsDetail || [],
  }));

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // ONLY these specific categories are allowed for GetDeals Kenya products
  // These match the categories shown in the "Shop by Category" navbar dropdown
  const categories = [
    { value: 'groceries', label: 'Groceries' },
    { value: 'household', label: 'Household' },
    { value: 'fresh-natural', label: 'Fresh & Natural' },
    { value: 'health-beauty', label: 'Health & Beauty' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'appliances', label: 'Appliances' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'furnishing-furniture', label: 'Furnishing & Furniture' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'accessories', label: 'Accessories' }
  ];

  // Filtered products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !product.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

  // Note: stock/featured flags removed from product model — ignore those filters

      // Price range filter
      const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
      const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;

      if (product.price < minPriceNum || product.price > maxPriceNum) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, minPrice, maxPrice]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
  };

  useEffect(() => {
    setLoading(false); // Products are loaded from context
  }, [contextProducts]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      originalPrice: null,
      category: '',
      imageUrl: '',
      tags: '',
      itemsDetail: [],
      isHotDeal: false,
      isNewArrival: false,
      isSpecialDeal: false,
      isTopBasket: false,
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
    const baseItemsDetail = (product.itemsDetail && product.itemsDetail.length > 0)
      ? product.itemsDetail
      : (product.tags || []).map(n => ({ name: n, image: '' }));
    
    // Sanitize promotional flags: If multiple are true, keep only the first one
    // Priority: Hot Deals > New Arrivals > Special Deals > Top Baskets
    const isHotDeal = (product as any).isHotDeal || false;
    const isNewArrival = (product as any).isNewArrival || false;
    const isSpecialDeal = (product as any).isSpecialDeal || false;
    const isTopBasket = (product as any).isTopBasket || false;
    
    // Count active flags
    const activeFlags = (isHotDeal ? 1 : 0) + (isNewArrival ? 1 : 0) + (isSpecialDeal ? 1 : 0) + (isTopBasket ? 1 : 0);
    
    // If more than one flag is active, keep only the highest priority one
    let cleanedFlags = {
      isHotDeal: false,
      isNewArrival: false,
      isSpecialDeal: false,
      isTopBasket: false,
    };
    
    if (activeFlags > 1) {
      // Multiple flags active - apply priority logic
      if (isHotDeal) {
        cleanedFlags.isHotDeal = true;
      } else if (isNewArrival) {
        cleanedFlags.isNewArrival = true;
      } else if (isSpecialDeal) {
        cleanedFlags.isSpecialDeal = true;
      } else if (isTopBasket) {
        cleanedFlags.isTopBasket = true;
      }
    } else {
      // Single or no flag - use as-is
      cleanedFlags = { isHotDeal, isNewArrival, isSpecialDeal, isTopBasket };
    }
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      imageUrl: product.imageUrl || '',
      tags: product.tags ? product.tags.join(', ') : '',
      itemsDetail: baseItemsDetail,
      isHotDeal: cleanedFlags.isHotDeal,
      isNewArrival: cleanedFlags.isNewArrival,
      isSpecialDeal: cleanedFlags.isSpecialDeal,
      isTopBasket: cleanedFlags.isTopBasket,
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
      // Normalize itemsDetail: remove blank names; if user only typed in tags but didn't edit itemsDetail we seed from tags
      let itemsDetail = formData.itemsDetail;
      if (itemsDetail.length === 0 && formData.tags.trim()) {
        itemsDetail = formData.tags.split(',').map(n => ({ name: n.trim(), image: '' })).filter(r => r.name);
      }
      itemsDetail = itemsDetail
        .map(r => ({ name: r.name.trim(), image: r.image.trim() }))
        .filter(r => r.name);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price,
        originalPrice: formData.originalPrice && formData.originalPrice > 0 ? formData.originalPrice : null,
        category: formData.category,
        image: formData.imageUrl.trim() || null,
        items: itemsDetail.map(i => i.name),
        itemsDetail,
        discount: 0,
        isHotDeal: formData.isHotDeal,
        isNewArrival: formData.isNewArrival,
        isSpecialDeal: formData.isSpecialDeal,
        isTopBasket: formData.isTopBasket,
      };

      if (editingProduct) {
        // Update existing product using context
        await updateInContext(editingProduct.id, {
          name: productData.name,
          description: productData.description || undefined,
          price: productData.price,
          originalPrice: productData.originalPrice || undefined,
          category: productData.category,
          image: productData.image || undefined,
          items: productData.items,
          itemsDetail: productData.itemsDetail,
          isHotDeal: productData.isHotDeal,
          isNewArrival: productData.isNewArrival,
          isSpecialDeal: productData.isSpecialDeal,
          isTopBasket: productData.isTopBasket,
        } as any);
        
        toast({
          title: "Product Updated",
          description: `${formData.name} has been updated and is now live on your website.`,
        });
      } else {
        // Create new product using context
        const newProduct = {
          name: productData.name,
          description: productData.description || undefined,
          price: productData.price,
          originalPrice: productData.originalPrice || undefined,
          category: productData.category,
          image: productData.image || undefined,
          items: productData.items,
          itemsDetail: productData.itemsDetail,
          isHotDeal: productData.isHotDeal,
          isNewArrival: productData.isNewArrival,
          isSpecialDeal: productData.isSpecialDeal,
          isTopBasket: productData.isTopBasket,
        } as any;

        await addToContext(newProduct);
        
        toast({
          title: "Product Created",
          description: `${formData.name} has been added and is now live on your website.`,
        });
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
      await removeFromContext(product.id);
      toast({
        title: "Product Deleted",
        description: `${product.name} has been removed from your website.`,
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
        <div className="flex gap-2">
          <Button onClick={() => setIsBulkUploadOpen(true)} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {(selectedCategory !== 'all' || minPrice || maxPrice) && (
                  <Badge variant="secondary" className="ml-2">
                    {[selectedCategory !== 'all', minPrice, maxPrice].filter(Boolean).length}
                  </Badge>
                )}
              </Button>

              {(selectedCategory !== 'all' || minPrice || maxPrice || searchQuery) && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Category Filter */}
                <div>
                  <Label htmlFor="category-filter">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock/Featured filters removed - these flags are not persisted in DB */}

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range (KES)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display (stock/featured removed) */}
      {(selectedCategory !== 'all' || minPrice || maxPrice || searchQuery) && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {selectedCategory}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSelectedCategory('all')}
              />
            </Badge>
          )}

          {(minPrice || maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              Price: {minPrice || '0'} - {maxPrice || '∞'} KES
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }}
              />
            </Badge>
          )}

          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSearchQuery('')}
              />
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {products.length === 0 ? 'No Products Found' : 'No Products Match Filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {products.length === 0
                  ? 'Start building your catalog by adding your first product.'
                  : 'Try adjusting your filters or search terms.'
                }
              </p>
              {products.length === 0 ? (
                <Button onClick={openAddModal} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Product
                </Button>
              ) : (
                <Button onClick={clearFilters} variant="outline" className="gap-2">
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => (
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
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
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

              {/* Promotional Tags Section */}
              <div className="md:col-span-2 space-y-3 border-t pt-4">
                <Label className="font-semibold text-base">Promotional Sections</Label>
                <p className="text-xs text-muted-foreground">Select which promotional section this product should appear in (only one allowed):</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Switch
                      id="hot-deals"
                      checked={formData.isHotDeal}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            isHotDeal: true,
                            isNewArrival: false,
                            isSpecialDeal: false,
                            isTopBasket: false
                          }));
                        } else {
                          setFormData(prev => ({ ...prev, isHotDeal: false }));
                        }
                      }}
                    />
                    <Label htmlFor="hot-deals" className="flex flex-col cursor-pointer flex-1 m-0">
                      <span className="font-semibold text-blue-900">Hot Deals</span>
                      <span className="text-xs text-blue-700">Show in the Hot Deals section on homepage</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Switch
                      id="new-arrival"
                      checked={formData.isNewArrival}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            isHotDeal: false,
                            isNewArrival: true,
                            isSpecialDeal: false,
                            isTopBasket: false
                          }));
                        } else {
                          setFormData(prev => ({ ...prev, isNewArrival: false }));
                        }
                      }}
                    />
                    <Label htmlFor="new-arrival" className="flex flex-col cursor-pointer flex-1 m-0">
                      <span className="font-semibold text-green-900">New Arrivals</span>
                      <span className="text-xs text-green-700">Show in the New Arrivals section on homepage</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Switch
                      id="special-deal"
                      checked={formData.isSpecialDeal}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            isHotDeal: false,
                            isNewArrival: false,
                            isSpecialDeal: true,
                            isTopBasket: false
                          }));
                        } else {
                          setFormData(prev => ({ ...prev, isSpecialDeal: false }));
                        }
                      }}
                    />
                    <Label htmlFor="special-deal" className="flex flex-col cursor-pointer flex-1 m-0">
                      <span className="font-semibold text-purple-900">Special Deals</span>
                      <span className="text-xs text-purple-700">Show in the Special Deals section on homepage</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Switch
                      id="top-basket"
                      checked={formData.isTopBasket}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ 
                            ...prev, 
                            isHotDeal: false,
                            isNewArrival: false,
                            isSpecialDeal: false,
                            isTopBasket: true
                          }));
                        } else {
                          setFormData(prev => ({ ...prev, isTopBasket: false }));
                        }
                      }}
                    />
                    <Label htmlFor="top-basket" className="flex flex-col cursor-pointer flex-1 m-0">
                      <span className="font-semibold text-amber-900">Top Baskets</span>
                      <span className="text-xs text-amber-700">Show in the Top Baskets section on homepage</span>
                    </Label>
                  </div>
                </div>
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

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="tags">Basket Items (comma-separated to quick add)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, tags: value }));
                    // If user types comma list and hasn't manually added rows yet, auto-sync names
                    const names = value.split(',').map(n => n.trim()).filter(Boolean);
                    setFormData(prev => ({
                      ...prev,
                      itemsDetail: prev.itemsDetail.length === 0 ? names.map(n => ({ name: n, image: '' })) : prev.itemsDetail
                    }));
                  }}
                  placeholder="e.g. Rice 2kg, Cooking Oil 1L, Sugar 1kg"
                />
                <p className="text-xs text-muted-foreground">After initial entry, edit each item below and add an image.</p>
              </div>

              {/* Per-item image manager */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Items & Images</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, itemsDetail: [...prev.itemsDetail, { name: '', image: '' }] }))}
                  >Add Item</Button>
                </div>
                {formData.itemsDetail.length === 0 && (
                  <div className="text-xs text-muted-foreground border rounded p-3">No items yet. Enter comma list above or click Add Item.</div>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {formData.itemsDetail.map((row, idx) => (
                    <div key={idx} className="border rounded-md p-3 space-y-2 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Name *</Label>
                          <Input
                            value={row.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              itemsDetail: prev.itemsDetail.map((r,i) => i===idx? { ...r, name: e.target.value }: r)
                            }))}
                            placeholder="Item name"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Label className="text-xs">Image URL</Label>
                          <Input
                            value={row.image}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              itemsDetail: prev.itemsDetail.map((r,i) => i===idx? { ...r, image: e.target.value }: r)
                            }))}
                            placeholder="/images/items/rice.jpg or https://..."
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {row.image && (
                            <img
                              src={row.image.startsWith('http') || row.image.startsWith('/') ? row.image : '/' + row.image.replace(/^\\+/,'')}
                              alt={row.name || 'preview'}
                              className="h-12 w-12 object-contain rounded border bg-white"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                            />
                          )}
                          <span className="text-xs text-muted-foreground">Item #{idx+1}</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => setFormData(prev => ({ ...prev, itemsDetail: prev.itemsDetail.filter((_,i)=>i!==idx) }))}
                        >Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* inStock and featured controls removed - not persisted in DB */}
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

      {/* Bulk Upload Modal */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <AdminBulkUpload onClose={() => setIsBulkUploadOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
