'use client';

import AuthWrapper from '@/app/components/auth-wrapper';
import SmartMapPicker from '@/app/components/SmartMapPicker';
import evacuationAPI, { EvacuationCenter, EvacuationStatus } from '@/app/lib/evacuation-api';
import { useEvacuation } from '@/app/providers/evacuation-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Edit,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Use the API type directly
export default function EvacuationPage() {
  // Get data from context
  const {
    evacuationCenters,
    evacuationLoading,
    refreshEvacuationCenters,
    addEvacuationCenter,
    updateEvacuationCenter,
    removeEvacuationCenter,
  } = useEvacuation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<EvacuationCenter | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load centers on component mount if needed
  useEffect(() => {
    if (evacuationCenters.length === 0 && !evacuationLoading) {
      refreshEvacuationCenters();
    }
  }, [evacuationCenters.length, evacuationLoading, refreshEvacuationCenters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreate = async (centerData: Record<string, any>) => {
    try {
      setModalLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await evacuationAPI.createEvacuationCenter(centerData as any);
      if (response.success && response.data) {
        addEvacuationCenter(response.data);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create evacuation center:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (id: number, centerData: Record<string, any>) => {
    try {
      setModalLoading(true);
      const response = await evacuationAPI.updateEvacuationCenter(id, centerData);
      if (response.success && response.data) {
        updateEvacuationCenter(id, response.data);
        setIsModalOpen(false);
        setEditingCenter(null);
      }
    } catch (error) {
      console.error('Failed to update evacuation center:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this evacuation center?')) {
      try {
        const response = await evacuationAPI.deleteEvacuationCenter(id);
        if (response.success) {
          removeEvacuationCenter(id);
        }
      } catch (error) {
        console.error('Failed to delete evacuation center:', error);
      }
    }
  };

  const openCreateModal = () => {
    console.log('Opening create modal...');
    setEditingCenter(null);
    setIsModalOpen(true);
    console.log('Modal state set to:', true);
  };

  const openEditModal = (center: EvacuationCenter) => {
    setEditingCenter(center);
    setIsModalOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'full':
        return 'destructive';
      case 'maintenance':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getOccupancyPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  // Modal component for creating/editing evacuation centers
  interface EvacuationModalProps {
    isOpen: boolean;
    onClose: () => void;
    center: EvacuationCenter | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (data: Record<string, any>) => void;
    loading?: boolean;
  }

  function EvacuationModal({
    isOpen,
    onClose,
    center,
    onSave,
    loading = false,
  }: EvacuationModalProps) {
    const [formData, setFormData] = useState({
      name: '',
      address: '',
      capacity: '',
      current_occupancy: '',
      status: 'open' as EvacuationStatus,
      latitude: 0,
      longitude: 0,
      contact_name: '',
      contact_phone: '',
      photos: [] as string[],
    });

    useEffect(() => {
      if (center) {
        setFormData({
          name: center.name,
          address: center.address,
          capacity: center.capacity?.toString() || '',
          current_occupancy: center.current_occupancy?.toString() || '',
          status: (center.status as EvacuationStatus) || 'open',
          latitude: center.latitude,
          longitude: center.longitude,
          contact_name: center.contact_name || '',
          contact_phone: center.contact_phone || '',
          photos: center.photos || [],
        });
      } else {
        // Reset form for new center
        setFormData({
          name: '',
          address: '',
          capacity: '',
          current_occupancy: '',
          status: 'open',
          latitude: 0,
          longitude: 0,
          contact_name: '',
          contact_phone: '',
          photos: [],
        });
      }
    }, [center]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        current_occupancy: formData.current_occupancy ? parseInt(formData.current_occupancy) : null,
      };
      onSave(submitData);
    };

    const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
      setFormData((prev) => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
      }));
    };

    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {center ? 'Edit Evacuation Center' : 'Create New Evacuation Center'}
            </DialogTitle>
            <DialogDescription>
              {center
                ? 'Update the evacuation center information below.'
                : 'Fill in the details to create a new evacuation center.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Center Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  placeholder="e.g. Central Evacuation Center"
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value as EvacuationStatus }))
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="100"
                    value={formData.capacity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="current_occupancy">Current Occupancy</Label>
                <Input
                  id="current_occupancy"
                  type="number"
                  placeholder="50"
                  value={formData.current_occupancy}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, current_occupancy: e.target.value }))
                  }
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    placeholder="Juan Dela Cruz"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
                    }
                    disabled={loading}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    placeholder="+639123456789"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))
                    }
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Location *</Label>
              <div className="mt-2 overflow-hidden">
                <SmartMapPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={
                    center
                      ? {
                          lat: center.latitude,
                          lng: center.longitude,
                          address: center.address,
                        }
                      : undefined
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                required
                placeholder="Address will be filled automatically from map selection"
                className="bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a location on the map above to automatically fill this field
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {center ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {center ? 'Update Center' : 'Create Center'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Filter and paginate centers
  const filteredCenters = evacuationCenters.filter((center) => {
    const matchesSearch =
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || center.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCenters.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;

  // Calculate statistics
  const stats = {
    total: evacuationCenters.length,
    open: evacuationCenters.filter((c) => c.status === 'open').length,
    full: evacuationCenters.filter((c) => c.status === 'full').length,
    maintenance: evacuationCenters.filter((c) => c.status === 'maintenance').length,
  };

  if (evacuationLoading && evacuationCenters.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading evacuation centers...</span>
        </div>
      </div>
    );
  }

  // Empty state when no evacuation centers exist
  if (!evacuationLoading && evacuationCenters.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 md:bg-background">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Evacuation Centers</h2>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first evacuation center to help manage emergency
                  situations.
                </p>
              </div>

              <div className="space-y-4">
                <Button onClick={openCreateModal} className="w-full md:w-auto gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Evacuation Center
                </Button>

                <div className="text-sm text-gray-500">
                  <p className="mb-2">Evacuation centers help you:</p>
                  <ul className="text-left space-y-1 max-w-xs mx-auto">
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-green-500" />
                      Track shelter capacity and occupancy
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-blue-500" />
                      Manage evacuee information
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-orange-500" />
                      Monitor locations on map
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-purple-500" />
                      Store contact information
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal - Include in empty state */}
        {isModalOpen && (
          <EvacuationModal
            isOpen={isModalOpen}
            onClose={() => {
              console.log('Closing modal...');
              setIsModalOpen(false);
              setEditingCenter(null);
            }}
            center={editingCenter}
            onSave={editingCenter ? (data) => handleUpdate(editingCenter.id, data) : handleCreate}
            loading={modalLoading}
          />
        )}
      </>
    );
  }
  return (
    <AuthWrapper>
      {/* Mobile Layout */}
      <div className="block md:hidden min-h-screen bg-gray-50">
        {/* Mobile Header - Clean and Simple */}
        <div className="bg-white border-b shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">Evacuation Centers</h1>
              <Button onClick={openCreateModal} size="sm" className="rounded-full">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search centers..."
                className="pl-10 bg-gray-50 border-0 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-blue-600">Total</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-green-600">{stats.open}</div>
                <div className="text-xs text-green-600">Open</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-orange-600">
                  {evacuationCenters.reduce(
                    (sum, center) => sum + (center.current_occupancy || 0),
                    0,
                  )}
                </div>
                <div className="text-xs text-orange-600">Current</div>
              </div>
            </div>

            {/* View Toggle & Filter */}
            <div className="flex items-center justify-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[100px] h-8 rounded-full bg-gray-100 border-0">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          {/* Enhanced Mobile Card List */}
          <div className="space-y-3">
            {filteredCenters.map((center) => (
              <Card
                key={center.id}
                className="bg-white rounded-xl shadow-sm border-0 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{center.name}</h3>
                        <Badge
                          variant={
                            center.status === 'open'
                              ? 'default'
                              : center.status === 'full'
                              ? 'destructive'
                              : center.status === 'maintenance'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {center.status || 'closed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{center.address}</p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {center.current_occupancy || 0}/{center.capacity || 0}
                          </span>
                        </div>
                        {center.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{center.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(center)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(center.id)}
                        className="h-8 w-8 rounded-full text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {center.capacity && center.capacity > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Occupancy</span>
                        <span className="text-xs font-medium">
                          {Math.round(((center.current_occupancy || 0) / center.capacity) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{
                            width: `${Math.min(
                              ((center.current_occupancy || 0) / center.capacity) * 100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {filteredCenters.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No evacuation centers found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evacuation Centers</h1>
              <p className="text-gray-600 text-sm">
                Monitor and manage emergency evacuation facilities
              </p>
            </div>
            <Button onClick={openCreateModal} className="gap-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              Add Center
            </Button>
          </div>

          {/* Minimal Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Centers</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.open}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {evacuationCenters
                  .reduce((sum, center) => sum + (center.capacity || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Capacity</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">
                {evacuationCenters
                  .reduce((sum, center) => sum + (center.current_occupancy || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Current Occupancy</div>
            </div>
          </div>

          {/* Minimal Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search centers..."
                  className="pl-10 border-gray-300 focus:border-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table View */}
          {/* Table View */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="font-medium text-gray-900">Center</TableHead>
                    <TableHead className="font-medium text-gray-900">Status</TableHead>
                    <TableHead className="font-medium text-gray-900">Occupancy</TableHead>
                    <TableHead className="font-medium text-gray-900">Location</TableHead>
                    <TableHead className="font-medium text-gray-900">Contact</TableHead>
                    <TableHead className="font-medium text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCenters.map((center) => (
                    <TableRow key={center.id} className="hover:bg-gray-50 border-gray-200">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{center.name}</div>
                          <div className="text-sm text-gray-500">#{center.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(center.status || 'closed')}>
                          {center.status || 'closed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{
                                  width: `${Math.min(
                                    getOccupancyPercentage(
                                      center.current_occupancy || 0,
                                      center.capacity || 1,
                                    ),
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {center.current_occupancy || 0}/{center.capacity || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[200px] truncate text-sm text-gray-600"
                          title={center.address}
                        >
                          {center.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {center.contact_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {center.contact_phone || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(center)}
                            className="h-8 w-8 text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(center.id)}
                            className="h-8 w-8 text-gray-600 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Minimal Pagination */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(startIndex + entriesPerPage, filteredCenters.length)}
                </span>{' '}
                of <span className="font-medium">{filteredCenters.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-gray-300"
                >
                  Previous
                </Button>
                <div className="px-3 py-1 text-sm font-medium bg-gray-100 rounded">
                  {currentPage}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal - Shared for both mobile and desktop */}
      {isModalOpen && (
        <EvacuationModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('Closing modal...');
            setIsModalOpen(false);
            setEditingCenter(null);
          }}
          center={editingCenter}
          onSave={editingCenter ? (data) => handleUpdate(editingCenter.id, data) : handleCreate}
          loading={modalLoading}
        />
      )}
    </AuthWrapper>
  );
}
