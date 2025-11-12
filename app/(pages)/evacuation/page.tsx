'use client';

import { supabase } from '@/app/client/supabase';
import AuthWrapper from '@/app/components/auth-wrapper';
import { PageHeader } from '@/app/components/page-header';
import SmartMapPicker from '@/app/components/SmartMapPicker';
import evacuationAPI, {
  EvacuationCenter,
  EvacuationCenterInsert,
  EvacuationCenterUpdate,
  EvacuationStatus,
} from '@/app/lib/evacuation-api';
import { useEvacuation } from '@/app/providers/evacuation-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function EvacuationPage() {
  const {
    evacuationCenters,
    evacuationLoading,
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
  const modalReopenGuardRef = useRef<number>(0);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCenter(null);
    modalReopenGuardRef.current = Date.now() + 1500;
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // CRUD handlers
  const handleCreate = async (centerData: EvacuationCenterInsert) => {
    setModalLoading(true);
    try {
      const response = await evacuationAPI.createEvacuationCenter(centerData);
      if (response.success && response.data) {
        addEvacuationCenter(response.data);
        setTimeout(() => {
          closeModal();
          setModalLoading(false);
        }, 700);
        return;
      }
      setModalLoading(false);
    } catch (e) {
      console.error(e);
      setModalLoading(false);
    }
  };

  const handleUpdate = async (id: number, centerData: Partial<EvacuationCenterUpdate>) => {
    setModalLoading(true);
    try {
      const response = await evacuationAPI.updateEvacuationCenter(id, centerData);
      if (response.success && response.data) {
        updateEvacuationCenter(id, response.data);
        setTimeout(() => {
          closeModal();
          setModalLoading(false);
        }, 700);
        return;
      }
      setModalLoading(false);
    } catch (e) {
      console.error(e);
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this evacuation center?')) return;
    try {
      const response = await evacuationAPI.deleteEvacuationCenter(id);
      if (response.success) removeEvacuationCenter(id);
    } catch (e) {
      console.error(e);
    }
  };

  // Helpers
  const openCreateModal = () => {
    if (Date.now() < modalReopenGuardRef.current) return;
    setEditingCenter(null);
    setIsModalOpen(true);
  };
  const openEditModal = (center: EvacuationCenter) => {
    if (Date.now() < modalReopenGuardRef.current) return;
    setEditingCenter(center);
    setIsModalOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default' as const;
      case 'full':
        return 'destructive' as const;
      case 'maintenance':
        return 'secondary' as const;
      case 'closed':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };
  const getOccupancyPercentage = (current: number, capacity: number) =>
    Math.round((current / capacity) * 100);

  // Derived data
  const filteredCenters = evacuationCenters.filter((center) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      center.name.toLowerCase().includes(q) || center.address.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || center.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredCenters.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const pagedCenters = filteredCenters.slice(startIndex, startIndex + entriesPerPage);
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
    <AuthWrapper>
      {evacuationCenters.length === 0 ? (
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
      ) : (
        <div className="min-h-screen bg-background p-4 sm:p-6">
          <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
            {/* Header */}
            <PageHeader
              title="Evacuation Centers"
              subtitle="Monitor and manage evacuation facilities"
              action={
                <Button onClick={openCreateModal} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Center
                </Button>
              }
            />

            {/* Stats */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs md:text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">{stats.open}</div>
                <div className="text-xs md:text-sm text-gray-600">Open</div>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-600">
                  {evacuationCenters
                    .reduce((sum, center) => sum + (center.capacity || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Capacity</div>
              </div>
              <div className="hidden md:block bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {evacuationCenters
                    .reduce((sum, center) => sum + (center.current_occupancy || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Current</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
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

            {/* Responsive List (single markup) */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header row for md+ */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 border-b text-sm font-medium text-gray-900">
                <div className="col-span-3">Center</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Occupancy</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Rows */}
              <div>
                {pagedCenters.map((center) => (
                  <div
                    key={center.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4 border-b last:border-0"
                  >
                    {/* Center info */}
                    <div className="md:col-span-3">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Link href={`/evacuation/${center.id}`} className="hover:underline">
                          {center.name}
                        </Link>
                        <Badge
                          className="md:hidden text-[10px]"
                          variant={getStatusVariant(center.status || 'closed')}
                        >
                          {center.status || 'closed'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">#{center.id}</div>

                      {/* Mobile-only extra details */}
                      <div className="mt-2 space-y-1 md:hidden">
                        <div className="text-sm text-gray-600">{center.address}</div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {center.current_occupancy || 0}/{center.capacity || 0}
                          </span>
                        </div>
                        {center.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{center.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status (md+) */}
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <Badge variant={getStatusVariant(center.status || 'closed')}>
                        {center.status || 'closed'}
                      </Badge>
                    </div>

                    {/* Occupancy (md+) */}
                    <div className="hidden md:block md:col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-200">
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
                        <div className="text-sm text-gray-600">
                          {center.current_occupancy || 0}/{center.capacity || 0}
                        </div>
                      </div>
                    </div>

                    {/* Location (md+) */}
                    <div className="hidden md:flex md:col-span-3 items-center">
                      <div
                        className="max-w-[260px] truncate text-sm text-gray-600"
                        title={center.address}
                      >
                        {center.address}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex items-center justify-end gap-1">
                      <Link
                        href={`/evacuation/${center.id}`}
                        className="h-8 w-8 inline-flex items-center justify-center text-gray-600 hover:text-gray-900"
                        aria-label="View details"
                        title="View details"
                      >
                        {/* eye icon via text fallback or use lucide Eye if desired */}
                        <span className="sr-only">View</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
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
                  </div>
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

            {/* Pagination */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing{' '}
                  <span className="font-medium">{filteredCenters.length ? startIndex + 1 : 0}</span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + entriesPerPage, filteredCenters.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredCenters.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
      )}

      {/* Single Modal Instance */}
      {isModalOpen && (
        <EvacuationModal
          isOpen={isModalOpen}
          onClose={closeModal}
          center={editingCenter}
          onSave={
            editingCenter
              ? (data) => handleUpdate(editingCenter.id, data as Partial<EvacuationCenterUpdate>)
              : (data) => handleCreate(data as EvacuationCenterInsert)
          }
          loading={modalLoading}
        />
      )}
    </AuthWrapper>
  );
}

// Modal
interface EvacuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  center: EvacuationCenter | null;
  onSave: (data: EvacuationCenterInsert | Partial<EvacuationCenterUpdate>) => void;
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
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const bucketName = 'files';

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
    // Reset pending files and previews when switching mode or item
    setNewFiles([]);
    // Revoke old object URLs
    setObjectUrls((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
  }, [center]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [objectUrls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Upload new files (if any) to Supabase Storage
    let uploadedUrls: string[] = [];
    if (newFiles.length > 0) {
      try {
        const uploads = await Promise.all(
          newFiles.map(async (file) => {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const id =
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? (crypto as unknown as { randomUUID: () => string }).randomUUID()
                : Math.random().toString(36).slice(2);
            const path = `centers/${id}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from(bucketName)
              .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
            return data.publicUrl;
          }),
        );
        uploadedUrls = uploads.filter(Boolean) as string[];
      } catch (err) {
        console.error('Photo upload failed:', err);
        // Continue without uploaded photos
      }
    }

    const finalPhotos = [...(formData.photos || []), ...uploadedUrls];
    const submitData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      current_occupancy: formData.current_occupancy ? parseInt(formData.current_occupancy) : null,
      photos: finalPhotos.length ? finalPhotos : null,
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
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          if (loading) return; // keep open while saving
          onClose();
        }
      }}
    >
      <DialogContent
        className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
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
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
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
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, status: v as EvacuationStatus }))
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
                  onChange={(e) => setFormData((p) => ({ ...p, capacity: e.target.value }))}
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
                onChange={(e) => setFormData((p) => ({ ...p, current_occupancy: e.target.value }))}
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
                  onChange={(e) => setFormData((p) => ({ ...p, contact_name: e.target.value }))}
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
                  onChange={(e) => setFormData((p) => ({ ...p, contact_phone: e.target.value }))}
                  disabled={loading}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Photos uploader */}
            <div className="space-y-2">
              <Label>Photos</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={loading}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  const urls = files.map((f) => URL.createObjectURL(f));
                  setObjectUrls((prev) => [...prev, ...urls]);
                  setNewFiles((prev) => [...prev, ...files]);
                }}
                className="block w-full text-sm"
              />
              {(formData.photos.length > 0 || newFiles.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                  {/* Existing photos */}
                  {formData.photos.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="Center photo"
                        className="h-24 w-full object-cover rounded border"
                      />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            photos: p.photos.filter((_, i) => i !== idx),
                          }))
                        }
                        disabled={loading}
                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {/* New file previews */}
                  {newFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={objectUrls[idx] || ''}
                        alt={file.name}
                        className="h-24 w-full object-cover rounded border"
                      />
                      <button
                        type="button"
                        aria-label="Remove pending photo"
                        onClick={() => {
                          setNewFiles((prev) => prev.filter((_, i) => i !== idx));
                          setObjectUrls((prev) => {
                            const copy = [...prev];
                            const [removed] = copy.splice(idx, 1);
                            if (removed) URL.revokeObjectURL(removed);
                            return copy;
                          });
                        }}
                        disabled={loading}
                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                You can upload multiple images. Max size depends on your storage settings.
              </p>
            </div>
          </div>

          <div>
            <Label>Location *</Label>
            <div className="mt-2 overflow-hidden">
              <SmartMapPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={
                  center
                    ? { lat: center.latitude, lng: center.longitude, address: center.address }
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
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              required
              placeholder="Address will be filled automatically from map selection"
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select a location on the map above to autofill, or edit the address manually.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!loading) onClose();
              }}
              disabled={loading}
            >
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
