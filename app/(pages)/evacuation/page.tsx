'use client';

import EvacuationCentersMap from '@/app/components/EvacuationCentersMap';
import SmartMapPicker from '@/app/components/SmartMapPicker';
import evacuationAPI, {
  EvacuationCenter as ApiEvacuationCenter,
  EvacuationStatus,
} from '@/app/lib/evacuation-api';
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
  Map,
  MoreVertical,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Use the API type
type EvacuationCenter = ApiEvacuationCenter;

export default function EvacuationPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<EvacuationCenter | null>(null);

  // Load centers on component mount
  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const response = await evacuationAPI.getAllEvacuationCenters();
      if (response.success && response.data) {
        setCenters(response.data);
      }
    } catch (error) {
      console.error('Failed to load evacuation centers:', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreate = async (centerData: Record<string, any>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await evacuationAPI.createEvacuationCenter(centerData as any);
      if (response.success && response.data) {
        setCenters((prev) => [response.data!, ...prev]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create evacuation center:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (id: number, centerData: Record<string, any>) => {
    try {
      const response = await evacuationAPI.updateEvacuationCenter(id, centerData);
      if (response.success && response.data) {
        setCenters((prev) => prev.map((center) => (center.id === id ? response.data! : center)));
        setIsModalOpen(false);
        setEditingCenter(null);
      }
    } catch (error) {
      console.error('Failed to update evacuation center:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this evacuation center?')) {
      try {
        const response = await evacuationAPI.deleteEvacuationCenter(id);
        if (response.success) {
          setCenters((prev) => prev.filter((center) => center.id !== id));
        }
      } catch (error) {
        console.error('Failed to delete evacuation center:', error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingCenter(null);
    setIsModalOpen(true);
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
  }

  function EvacuationModal({ isOpen, onClose, center, onSave }: EvacuationModalProps) {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
              {center ? 'Edit Evacuation Center' : 'Create Evacuation Center'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as EvacuationStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  value={formData.capacity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="current_occupancy">Current Occupancy</Label>
                <Input
                  id="current_occupancy"
                  type="number"
                  value={formData.current_occupancy}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, current_occupancy: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Location *</Label>
              <div className="mt-2">
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
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {center ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filter and paginate centers
  const filteredCenters = centers.filter((center) => {
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
    total: centers.length,
    open: centers.filter((c) => c.status === 'open').length,
    full: centers.filter((c) => c.status === 'full').length,
    maintenance: centers.filter((c) => c.status === 'maintenance').length,
  };
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
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
          <div className="flex gap-2">
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Center
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List View
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              Map View
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Centers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Emergency facilities</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Centers</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.open}</div>
              <p className="text-xs text-muted-foreground">Ready for evacuees</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {centers.reduce((sum, center) => sum + (center.capacity || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Maximum occupancy</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {centers
                  .reduce((sum, center) => sum + (center.current_occupancy || 0), 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">People sheltered</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search evacuation centers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
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
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="downtown">Downtown</SelectItem>
                    <SelectItem value="riverside">Riverside</SelectItem>
                    <SelectItem value="central">Central</SelectItem>
                    <SelectItem value="north">North District</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditional rendering based on view mode */}
        {viewMode === 'map' ? (
          <EvacuationCentersMap
            centers={filteredCenters.map((center) => ({
              id: center.id,
              name: center.name,
              address: center.address,
              latitude: center.latitude,
              longitude: center.longitude,
              capacity: center.capacity || undefined,
              current_occupancy: center.current_occupancy || undefined,
              status: center.status || undefined,
              contact_name: center.contact_name || undefined,
              contact_phone: center.contact_phone || undefined,
            }))}
            height="600px"
            onCenterSelect={(center) => {
              const fullCenter = centers.find((c) => c.id === center.id);
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
        {isModalOpen && (
          <EvacuationModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCenter(null);
            }}
            center={editingCenter}
            onSave={editingCenter ? (data) => handleUpdate(editingCenter.id, data) : handleCreate}
          />
        )}
      </div>
    </div>
  );
}
