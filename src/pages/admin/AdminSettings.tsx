import { useAdmin } from "@/contexts/AdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Trash2, Plus, Edit2, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminSettings() {
  const { settings, updateSettings } = useAdmin();
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [brandForm, setBrandForm] = useState({ id: '', name: '', image: '', category: '' });
  const [isBrandGridExpanded, setIsBrandGridExpanded] = useState(false);
  const [isFlashSaleExpanded, setIsFlashSaleExpanded] = useState(false);

  const handleAddBrand = () => {
    if (!brandForm.name || !brandForm.image || !brandForm.category) {
      alert('Please fill in all fields');
      return;
    }

    const newBrand = {
      id: editingBrand?.id || Date.now().toString(),
      name: brandForm.name,
      image: brandForm.image,
      category: brandForm.category,
    };

    if (editingBrand) {
      const updatedBrands = settings.brands.map((b) => b.id === editingBrand.id ? newBrand : b);
      updateSettings({ brands: updatedBrands });
    } else {
      updateSettings({ brands: [...settings.brands, newBrand] });
    }

    setBrandForm({ id: '', name: '', image: '', category: '' });
    setIsAddingBrand(false);
    setEditingBrand(null);
  };

  const handleDeleteBrand = (id: string) => {
    updateSettings({ brands: settings.brands.filter((b) => b.id !== id) });
  };

  const handleEditBrand = (brand: any) => {
    setEditingBrand(brand);
    setBrandForm(brand);
    setIsAddingBrand(true);
  };

  const resetForm = () => {
    setBrandForm({ id: '', name: '', image: '', category: '' });
    setIsAddingBrand(false);
    setEditingBrand(null);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Site Settings</h1>
          <p className="text-gray-600">Manage your GET DEALS platform configuration</p>
        </div>

        {/* General Settings - Top Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* General Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="text-xl text-blue-900">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                  <div>
                    <Label className="font-semibold text-gray-900">Black Friday Promo</Label>
                    <div className="text-xs text-gray-600 mt-1">Toggle Black Friday across site</div>
                  </div>
                  <Switch checked={settings.blackFridayEnabled} onCheckedChange={(v) => updateSettings({ blackFridayEnabled: v })} />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900">Black Friday Date</Label>
                  <div className="text-xs text-gray-600 mb-2">Set countdown target date</div>
                  <Input 
                    type="datetime-local" 
                    className="border-gray-200"
                    value={settings.blackFridayCountdownDate ? new Date(settings.blackFridayCountdownDate).toISOString().slice(0, 16) : ''} 
                    onChange={(e) => updateSettings({ blackFridayCountdownDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors">
                  <div>
                    <Label className="font-semibold text-gray-900">Maintenance Mode</Label>
                    <div className="text-xs text-gray-600 mt-1">Show banner across site</div>
                  </div>
                  <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => updateSettings({ maintenanceMode: v })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support & Contact Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
              <CardTitle className="text-xl text-green-900">Support & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold text-gray-900 block mb-2">Phone Number</Label>
                  <Input 
                    className="border-gray-200"
                    value={settings.supportPhone} 
                    onChange={(e) => updateSettings({ supportPhone: e.target.value })} 
                    placeholder="+254..."
                  />
                </div>
                <div>
                  <Label className="font-semibold text-gray-900 block mb-2">Email Address</Label>
                  <Input 
                    type="email"
                    className="border-gray-200"
                    value={settings.supportEmail} 
                    onChange={(e) => updateSettings({ supportEmail: e.target.value })} 
                    placeholder="support@getdeals.co.ke"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-gray-900 block mb-2">Location</Label>
                  <Input 
                    className="border-gray-200"
                    value={settings.location} 
                    onChange={(e) => updateSettings({ location: e.target.value })} 
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flash Sale Settings */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow mb-6">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-100 border-b cursor-pointer hover:from-red-100 hover:to-orange-200 transition-all" onClick={() => setIsFlashSaleExpanded(!isFlashSaleExpanded)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {isFlashSaleExpanded ? (
                  <ChevronUp className="h-5 w-5 text-red-900 transition-transform" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-red-900 transition-transform" />
                )}
                <div>
                  <CardTitle className="text-xl text-red-900">Flash Sale</CardTitle>
                  <p className="text-xs text-red-700 mt-1">Manage flash sale promotions</p>
                </div>
              </div>
              <Switch checked={settings.flashSaleEnabled} onCheckedChange={(v) => updateSettings({ flashSaleEnabled: v })} className="scale-125" />
            </div>
          </CardHeader>

          {isFlashSaleExpanded && (
            <CardContent className="pt-8 pb-8 border-t animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900 block">Flash Sale Start Date</Label>
                  <div className="text-xs text-gray-600 mb-2">When the flash sale begins</div>
                  <Input 
                    type="datetime-local" 
                    className="border-gray-200"
                    value={settings.flashSaleStartDate ? new Date(settings.flashSaleStartDate).toISOString().slice(0, 16) : ''} 
                    onChange={(e) => updateSettings({ flashSaleStartDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-gray-900 block">Flash Sale End Date</Label>
                  <div className="text-xs text-gray-600 mb-2">When the flash sale ends</div>
                  <Input 
                    type="datetime-local" 
                    className="border-gray-200"
                    value={settings.flashSaleEndDate ? new Date(settings.flashSaleEndDate).toISOString().slice(0, 16) : ''} 
                    onChange={(e) => updateSettings({ flashSaleEndDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-gray-900 block">Discount Percentage</Label>
                <div className="text-xs text-gray-600 mb-2">Enter the discount percentage (e.g., 50 for 50% off)</div>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number" 
                    className="border-gray-200 flex-1"
                    value={settings.flashSaleDiscount} 
                    onChange={(e) => updateSettings({ flashSaleDiscount: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                    min="0"
                    max="100"
                  />
                  <span className="text-2xl font-bold text-red-600">{settings.flashSaleDiscount}%</span>
                </div>
              </div>

              {settings.flashSaleStartDate && settings.flashSaleEndDate && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Sale Duration:</span> {new Date(settings.flashSaleStartDate).toLocaleString()} to {new Date(settings.flashSaleEndDate).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {new Date() < new Date(settings.flashSaleStartDate) ? '🔔 Sale has not started yet' : new Date() > new Date(settings.flashSaleEndDate) ? '❌ Sale has ended - showing "Coming Soon"' : '✅ Sale is currently live'}
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Shop by Brand Settings - Full Width */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-all" onClick={() => setIsBrandGridExpanded(!isBrandGridExpanded)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {isBrandGridExpanded ? (
                  <ChevronUp className="h-5 w-5 text-purple-900 transition-transform" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-900 transition-transform" />
                )}
                <div>
                  <CardTitle className="text-xl text-purple-900">Shop by Brand</CardTitle>
                  <p className="text-xs text-purple-700 mt-1">Manage all brands displayed on homepage</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-purple-900">{settings.brands.length} brands</span>
                <Switch checked={settings.shopByBrandEnabled} onCheckedChange={(v) => updateSettings({ shopByBrandEnabled: v })} className="scale-125" />
              </div>
            </div>
          </CardHeader>

          {isBrandGridExpanded && (
            <CardContent className="pt-8 pb-8 border-t animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Add Brand Button */}
              <div className="mb-8">
                <Dialog open={isAddingBrand} onOpenChange={setIsAddingBrand}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2 shadow-md hover:shadow-lg transition-all">
                      <Plus className="h-5 w-5" />
                      Add New Brand
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                      <DialogDescription>{editingBrand ? 'Update brand details' : 'Create a new brand entry'}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-6">
                      <div>
                        <Label htmlFor="brand-name" className="font-semibold">Brand Name *</Label>
                        <Input 
                          id="brand-name" 
                          placeholder="e.g., Brookside" 
                          value={brandForm.name} 
                          onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="brand-category" className="font-semibold">Category *</Label>
                        <Input 
                          id="brand-category" 
                          placeholder="e.g., Dairy" 
                          value={brandForm.category} 
                          onChange={(e) => setBrandForm({ ...brandForm, category: e.target.value })}
                          className="mt-2"
                        />
                      </div>

                      <div>
                      <Label htmlFor="brand-image" className="font-semibold">Image URL *</Label>
                      <Input 
                        id="brand-image" 
                        placeholder="https://..." 
                        value={brandForm.image} 
                        onChange={(e) => setBrandForm({ ...brandForm, image: e.target.value })}
                        className="mt-2"
                      />
                      {brandForm.image && (
                        <div className="mt-3 p-3 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                          <img src={brandForm.image} alt="Preview" className="h-20 object-contain" onError={() => {}} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      onClick={handleAddBrand}
                    >
                      {editingBrand ? 'Update Brand' : 'Add Brand'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Brands Grid */}
            {settings.brands.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {settings.brands.map((brand) => (
                  <div 
                    key={brand.id} 
                    className="group border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50"
                  >
                    {/* Brand Image Container */}
                    <div className="mb-4 bg-gray-50 rounded-lg p-3 flex items-center justify-center min-h-32 group-hover:bg-blue-50 transition-colors">
                      <img 
                        src={brand.image} 
                        alt={brand.name} 
                        className="h-28 object-contain group-hover:scale-110 transition-transform" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/112?text=Image';
                        }}
                      />
                    </div>

                    {/* Brand Info */}
                    <div className="mb-4 space-y-2">
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{brand.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold rounded-full">
                          {brand.category}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                        onClick={() => handleEditBrand(brand)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm" 
                        className="flex-1 text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
                        onClick={() => {
                          if (confirm(`Delete "${brand.name}"?`)) {
                            handleDeleteBrand(brand.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full mb-4">
                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Brands Yet</h3>
                <p className="text-gray-600 mb-6">Start adding brands to display them on your homepage</p>
                <Dialog open={isAddingBrand} onOpenChange={setIsAddingBrand}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2">
                      <Plus className="h-4 w-4" />
                      Add First Brand
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
