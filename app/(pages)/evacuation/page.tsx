'use client';

import EvacuationCentersMap from '@/app/components/EvacuationCentersMap';
import SmartMapPicker from '@/app/components/SmartMapPicker';
import evacuationAPI, { EvacuationCenter, EvacuationStatus } from '@/app/lib/evacuation-api';
import { useData } from '@/app/providers/data-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Activity,
  AlertTriangle,
  Building2,
  Edit,
  Eye,
  Filter,
  List,
  Loader2,
  Map,
  MoreVertical,
  Phone,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Users,
  X,
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
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 md:p-6 border-b">
            <h2 className="text-lg md:text-xl font-semibold">
              {center ? 'Edit Center' : 'New Center'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Center Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  placeholder="e.g. Central Evacuation Center"
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="mt-1"
                  disabled={loading}
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
                    <SelectTrigger className="mt-1">
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
                    className="mt-1"
                    disabled={loading}
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
                  className="mt-1"
                  disabled={loading}
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
                    className="mt-1"
                    disabled={loading}
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
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Location *</Label>
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
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
                className="mt-1 bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a location on the map above to automatically fill this field
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading
                  ? center
                    ? 'Updating...'
                    : 'Creating...'
                  : center
                  ? 'Update Center'
                  : 'Create Center'}
              </Button>
            </div>
          </form>
        </div>
      </div>
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
  return (
    <>
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
            <div className="flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-full p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  size="sm"
                  className="rounded-full px-4"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('map')}
                  size="sm"
                  className="rounded-full px-4"
                >
                  <Map className="h-4 w-4 mr-1" />
                  Map
                </Button>
              </div>

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
          {viewMode === 'map' ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <EvacuationCentersMap
                centers={filteredCenters}
                height="calc(100vh - 350px)"
                onCenterSelect={(center) => {
                  const fullCenter = evacuationCenters.find((c) => c.id === center.id);
                  if (fullCenter) {
                    setEditingCenter(fullCenter);
                    setIsModalOpen(true);
                  }
                }}
              />
            </div>
          ) : (
            /* Enhanced Mobile Card List */
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
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Evacuation Centers
                  </h1>
                  <p className="text-muted-foreground">
                    Real-time monitoring and management of emergency evacuation facilities
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add New Center</span>
                <span className="sm:hidden">Add Center</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="gap-2 w-full sm:w-auto"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List View</span>
                <span className="sm:hidden">List</span>
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
                className="gap-2 w-full sm:w-auto"
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Map View</span>
                <span className="sm:hidden">Map</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Centers</CardTitle>
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Emergency facilities
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Available Centers</CardTitle>
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-accent">{stats.open}</div>
                <p className="text-xs text-muted-foreground hidden sm:block">Ready for evacuees</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Capacity</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold">
                  {evacuationCenters
                    .reduce((sum, center) => sum + (center.capacity || 0), 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">Maximum occupancy</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-destructive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Current Occupancy</CardTitle>
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold">
                  {evacuationCenters
                    .reduce((sum, center) => sum + (center.current_occupancy || 0), 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">People sheltered</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search centers..."
                    className="pl-10 h-9 sm:h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[100px] sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm">
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
                  <Select>
                    <SelectTrigger className="w-[100px] sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="downtown">Downtown</SelectItem>
                      <SelectItem value="riverside">Riverside</SelectItem>
                      <SelectItem value="central">Central</SelectItem>
                      <SelectItem value="north">North District</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="gap-1 sm:gap-2 bg-transparent h-9 sm:h-10 px-2 sm:px-4"
                  >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditional rendering based on view mode */}
          {viewMode === 'map' ? (
            <EvacuationCentersMap
              centers={filteredCenters}
              height="600px"
              onCenterSelect={(center) => {
                const fullCenter = evacuationCenters.find((c) => c.id === center.id);
                if (fullCenter) {
                  setEditingCenter(fullCenter);
                  setIsModalOpen(true);
                }
              }}
            />
          ) : (
            <>
              <Card className="px-[16px]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Center Details</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Occupancy</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCenters.map((center) => (
                          <TableRow key={center.id}>
                            <TableCell className="font-medium">#{center.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="font-medium">{center.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Capacity: {center.capacity}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(center.status || 'closed')}>
                                {center.status || 'closed'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 rounded-full bg-muted">
                                    <div
                                      className="h-2 rounded-full bg-primary"
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
                                <div className="text-sm">
                                  {center.current_occupancy || 0}/{center.capacity || 0} (
                                  {getOccupancyPercentage(
                                    center.current_occupancy || 0,
                                    center.capacity || 1,
                                  )}
                                  %)
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-2">
                                <div
                                  className="max-w-[200px] truncate text-sm"
                                  title={center.address}
                                >
                                  {center.address}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{center.contact_name || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {center.contact_phone || 'N/A'}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1">
                                <div className="text-sm">
                                  <div>{new Date(center.created_at).toLocaleDateString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(center.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(center)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(center.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="text-sm text-muted-foreground">
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
                    >
                      Previous
                    </Button>
                    <Button size="sm">{currentPage}</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Create/Edit Modal */}
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
    </>
  );
}
