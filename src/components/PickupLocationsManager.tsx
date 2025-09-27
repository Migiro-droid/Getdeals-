import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Phone, 
  Navigation,
  Store,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { LocationPicker } from './LocationPicker';

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone?: string;
  email?: string;
  operatingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  features: string[];
  instructions?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
}

export const PickupLocationsManager: React.FC = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PickupLocation | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    phone: '',
    email: '',
    operatingHours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '9:00 AM - 4:00 PM',
      sunday: 'Closed'
    },
    status: 'active' as PickupLocation['status'],
    capacity: 50,
    features: [] as string[],
    instructions: '',
    contactPerson: ''
  });

  // Load pickup locations
  useEffect(() => {
    loadPickupLocations();
  }, []);

  const loadPickupLocations = async () => {
    try {
      setLoading(true);
      // In production, this would fetch from your API
      // For now, we'll use mock data
      const mockLocations: PickupLocation[] = [
        {
          id: '1',
          name: 'Westlands Branch',
          address: 'Westlands Square, Waiyaki Way, Nairobi',
          coordinates: { lat: -1.2634, lng: 36.8078 },
          phone: '+254 712 345 678',
          email: 'westlands@getdeals.co.ke',
          operatingHours: {
            monday: '8:00 AM - 7:00 PM',
            tuesday: '8:00 AM - 7:00 PM',
            wednesday: '8:00 AM - 7:00 PM',
            thursday: '8:00 AM - 7:00 PM',
            friday: '8:00 AM - 7:00 PM',
            saturday: '9:00 AM - 5:00 PM',
            sunday: '10:00 AM - 4:00 PM'
          },
          status: 'active',
          capacity: 100,
          features: ['Parking Available', 'Air Conditioned', 'Wheelchair Accessible'],
          instructions: 'Enter through the main entrance and ask for GetDeals pickup.',
          contactPerson: 'Mary Wanjiku',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'CBD Branch',
          address: 'Kimathi Street, Central Business District, Nairobi',
          coordinates: { lat: -1.2864, lng: 36.8172 },
          phone: '+254 712 345 679',
          email: 'cbd@getdeals.co.ke',
          operatingHours: {
            monday: '7:00 AM - 8:00 PM',
            tuesday: '7:00 AM - 8:00 PM',
            wednesday: '7:00 AM - 8:00 PM',
            thursday: '7:00 AM - 8:00 PM',
            friday: '7:00 AM - 8:00 PM',
            saturday: '8:00 AM - 6:00 PM',
            sunday: 'Closed'
          },
          status: 'active',
          capacity: 150,
          features: ['24/7 Security', 'Multiple Pickup Points', 'Express Service'],
          instructions: 'Go to floor 2, GetDeals pickup counter.',
          contactPerson: 'John Kamau',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Karen Branch',
          address: 'Karen Shopping Centre, Karen Road, Nairobi',
          coordinates: { lat: -1.3197, lng: 36.7019 },
          phone: '+254 712 345 680',
          email: 'karen@getdeals.co.ke',
          operatingHours: {
            monday: '9:00 AM - 6:00 PM',
            tuesday: '9:00 AM - 6:00 PM',
            wednesday: '9:00 AM - 6:00 PM',
            thursday: '9:00 AM - 6:00 PM',
            friday: '9:00 AM - 6:00 PM',
            saturday: '9:00 AM - 5:00 PM',
            sunday: '10:00 AM - 3:00 PM'
          },
          status: 'maintenance',
          capacity: 75,
          features: ['Ample Parking', 'Cafe Nearby', 'Shopping Mall'],
          instructions: 'Located next to the main supermarket entrance.',
          contactPerson: 'Grace Njeri',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setLocations(mockLocations);
      toast({
        title: "Locations Loaded",
        description: `${mockLocations.length} pickup locations loaded successfully.`,
      });
    } catch (error) {
      console.error('Error loading pickup locations:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load pickup locations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter locations
  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (location.contactPerson && location.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle form submission
  const handleSubmit = async (isEdit: boolean = false) => {
    try {
      if (!formData.name.trim() || !formData.address.trim()) {
        toast({
          title: "Validation Error",
          description: "Name and address are required.",
          variant: "destructive",
        });
        return;
      }

      const locationData: PickupLocation = {
        id: isEdit ? selectedLocation!.id : Date.now().toString(),
        ...formData,
        createdAt: isEdit ? selectedLocation!.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        setLocations(prev => prev.map(loc => loc.id === locationData.id ? locationData : loc));
        setEditModalOpen(false);
        toast({
          title: "Location Updated",
          description: `${locationData.name} has been updated successfully.`,
        });
      } else {
        setLocations(prev => [...prev, locationData]);
        setAddModalOpen(false);
        toast({
          title: "Location Added",
          description: `${locationData.name} has been added successfully.`,
        });
      }

      // Reset form
      setFormData({
        name: '',
        address: '',
        coordinates: { lat: 0, lng: 0 },
        phone: '',
        email: '',
        operatingHours: {
          monday: '9:00 AM - 6:00 PM',
          tuesday: '9:00 AM - 6:00 PM',
          wednesday: '9:00 AM - 6:00 PM',
          thursday: '9:00 AM - 6:00 PM',
          friday: '9:00 AM - 6:00 PM',
          saturday: '9:00 AM - 4:00 PM',
          sunday: 'Closed'
        },
        status: 'active',
        capacity: 50,
        features: [],
        instructions: '',
        contactPerson: ''
      });
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Save Error",
        description: "Failed to save pickup location.",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (locationId: string) => {
    try {
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      toast({
        title: "Location Deleted",
        description: "Pickup location has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete pickup location.",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (location: PickupLocation) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      coordinates: location.coordinates,
      phone: location.phone || '',
      email: location.email || '',
      operatingHours: location.operatingHours,
      status: location.status,
      capacity: location.capacity,
      features: location.features,
      instructions: location.instructions || '',
      contactPerson: location.contactPerson || ''
    });
    setEditModalOpen(true);
  };

  // Handle view
  const handleView = (location: PickupLocation) => {
    setSelectedLocation(location);
    setViewModalOpen(true);
  };

  // Status badge color
  const getStatusBadge = (status: PickupLocation['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pickup Locations</h2>
          <p className="text-muted-foreground">Manage customer pickup locations</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations, addresses, or contact persons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Locations</p>
                <p className="text-2xl font-bold">{locations.length}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {locations.filter(l => l.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {locations.filter(l => l.status === 'maintenance').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-purple-600">
                  {locations.reduce((sum, l) => sum + l.capacity, 0)}
                </p>
              </div>
              <Navigation className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pickup Locations ({filteredLocations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {location.contactPerson}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">{location.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {location.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {location.phone}
                        </div>
                      )}
                      {location.email && (
                        <div className="text-sm text-muted-foreground">
                          {location.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(location.status)}>
                      {location.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{location.capacity}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(location)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(location)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLocations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div>No pickup locations found.</div>
              <div className="text-sm">Add your first pickup location to get started.</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Location Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Pickup Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Westlands Branch"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: PickupLocation['status']) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <LocationPicker
              onLocationSelect={(address) => {
                setFormData(prev => ({
                  ...prev,
                  address: address.formatted,
                  coordinates: address.coordinates
                }));
              }}
              placeholder="Search for location address..."
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+254 712 345 678"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="branch@getdeals.co.ke"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Branch Manager Name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Pickup Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Enter detailed instructions for customers..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(false)}>
              Add Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pickup Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Same form fields as Add modal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Location Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Westlands Branch"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: PickupLocation['status']) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <LocationPicker
              onLocationSelect={(address) => {
                setFormData(prev => ({
                  ...prev,
                  address: address.formatted,
                  coordinates: address.coordinates
                }));
              }}
              initialLocation={formData.coordinates}
              placeholder="Search for location address..."
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+254 712 345 678"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="branch@getdeals.co.ke"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="edit-contactPerson">Contact Person</Label>
                <Input
                  id="edit-contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Branch Manager Name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-instructions">Pickup Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Enter detailed instructions for customers..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(true)}>
              Update Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Location Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Location Details</DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{selectedLocation.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusBadge(selectedLocation.status)}>
                    {selectedLocation.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm">{selectedLocation.address}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Contact</Label>
                  <div className="text-sm space-y-1">
                    {selectedLocation.phone && <p>{selectedLocation.phone}</p>}
                    {selectedLocation.email && <p>{selectedLocation.email}</p>}
                    {selectedLocation.contactPerson && <p>{selectedLocation.contactPerson}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Capacity</Label>
                  <p className="text-sm">{selectedLocation.capacity} orders</p>
                </div>
              </div>

              {selectedLocation.features.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Features</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLocation.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLocation.instructions && (
                <div>
                  <Label className="text-sm font-medium">Pickup Instructions</Label>
                  <p className="text-sm">{selectedLocation.instructions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};