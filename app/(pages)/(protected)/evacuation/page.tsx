'use client';

import { supabase } from '@/app/client/supabase';
import { PageHeader } from '@/app/components/page-header';
import SmartMapPicker from '@/app/components/SmartMapPicker';
import { getEvacTopColor } from '@/app/core/utils/utils';
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
      // Get current user ID from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const response = await evacuationAPI.createEvacuationCenter({ ...centerData, userId });
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
      // Get current user ID from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const response = await evacuationAPI.updateEvacuationCenter(id, { ...centerData, userId });
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
      // Get current user ID from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const response = await evacuationAPI.deleteEvacuationCenter(id, userId);
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading evacuation centers...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {evacuationCenters.length === 0 ? (
        <div className="min-h-screen bg-gray-50 md:bg-background">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="max-w-md mx-auto text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full">
                  <Building2 className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">No Evacuation Centers</h2>
                <p className="mb-6 text-gray-600">
                  Get started by creating your first evacuation center to help manage emergency
                  situations.
                </p>
              </div>

              <div className="space-y-4">
                <Button onClick={openCreateModal} className="w-full gap-2 md:w-auto">
                  <Plus className="w-4 h-4" />
                  Create First Evacuation Center
                </Button>

                <div className="text-sm text-gray-500">
                  <p className="mb-2">Evacuation centers help you:</p>
                  <ul className="max-w-xs mx-auto space-y-1 text-left">
                    <li className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-green-500" />
                      Track shelter capacity and occupancy
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-blue-500" />
                      Manage evacuee information
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      Monitor locations on map
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-purple-500" />
                      Store contact information
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen p-4 bg-background sm:p-6">
          <div className="mx-auto space-y-4 max-w-7xl sm:space-y-6">
            {/* Header */}
            <PageHeader
              title="Evacuation Centers"
              subtitle="Monitor and manage evacuation facilities"
              action={
                <Button onClick={openCreateModal} className="gap-2 bg-[#4988C4] cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Add Center
                </Button>
              }
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-4">
              <div className={`p-3 text-center ${getEvacTopColor('total')} rounded-lg md:p-4`}>
                <div className="text-lg font-bold text-gray-900 md:text-2xl">{stats.total}</div>
                <div className="text-xs text-gray-600 md:text-sm">Total</div>
              </div>
              <div className={`p-3 text-center ${getEvacTopColor('open')} rounded-lg md:p-4`}>
                <div className="text-lg font-bold text-green-600 md:text-2xl">{stats.open}</div>
                <div className="text-xs text-gray-600 md:text-sm">Open</div>
              </div>
              <div className={`p-3 text-center ${getEvacTopColor('capacity')} rounded-lg md:p-4`}>
                <div className="text-lg font-bold text-blue-600 md:text-2xl">
                  {evacuationCenters
                    .reduce((sum, center) => sum + (center.capacity || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 md:text-sm">Capacity</div>
              </div>
              <div
                className={`hidden p-4 text-center ${getEvacTopColor(
                  'current',
                )} rounded-lg md:block`}
              >
                <div className="text-2xl font-bold text-orange-600">
                  {evacuationCenters
                    .reduce((sum, center) => sum + (center.current_occupancy || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Current</div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-3 bg-white border border-gray-200 rounded-lg md:p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
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
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
              {/* Header row for md+ */}
              <div className="hidden grid-cols-12 gap-3 px-4 py-3 text-sm font-medium text-gray-900 border-b md:grid">
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
                    className="grid grid-cols-1 gap-3 px-4 py-4 border-b md:grid-cols-12 last:border-0"
                  >
                    {/* Center info */}
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
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
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {center.current_occupancy || 0}/{center.capacity || 0}
                          </span>
                        </div>
                        {center.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{center.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status (md+) */}
                    <div className="items-center hidden md:flex md:col-span-2">
                      <Badge variant={getStatusVariant(center.status || 'closed')}>
                        {center.status || 'closed'}
                      </Badge>
                    </div>

                    {/* Occupancy (md+) */}
                    <div className="hidden md:block md:col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
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
                    <div className="items-center hidden md:flex md:col-span-3">
                      <div
                        className="max-w-[260px] truncate text-sm text-gray-600"
                        title={center.address}
                      >
                        {center.address}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 md:col-span-2">
                      <Link
                        href={`/evacuation/${center.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900"
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
                          className="w-4 h-4"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(center)}
                        className="w-8 h-8 text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(center.id)}
                        className="w-8 h-8 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredCenters.length === 0 && (
                  <div className="py-12 text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No evacuation centers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filter</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="p-3 bg-white border border-gray-200 rounded-lg md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
    </>
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
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhoneLocal = (value: string) => {
    if (!value) return null; // optional
    if (!/^\d+$/.test(value)) return 'Digits only after +63';
    if (value.length !== 10) return 'Must be 10 digits after +63';
    if (!value.startsWith('9')) return 'Must start with 9 (e.g. 9XXXXXXXXX)';
    return null;
  };

  const parseStoredPhoneToLocal = (stored?: string | null) => {
    if (!stored) return '';
    const digits = (stored || '').replace(/\D/g, '');
    if (digits.startsWith('63')) return digits.slice(2, 12);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length === 10 && digits.startsWith('9')) return digits;
    return '';
  };
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
      const local = parseStoredPhoneToLocal(center.contact_phone || '');
      setPhoneLocal(local);
      setPhoneError(validatePhoneLocal(local));
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
      setPhoneLocal('');
      setPhoneError(null);
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
    const err = validatePhoneLocal(phoneLocal);
    setPhoneError(err);
    if (err) return;

    const submitData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      current_occupancy: formData.current_occupancy ? parseInt(formData.current_occupancy) : null,
      contact_phone: phoneLocal ? `+63${phoneLocal}` : formData.contact_phone || null,
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
        className="w-[98vw] max-w-[1400px] mx-auto max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target && target.closest('.pac-container')) {
            e.preventDefault();
            return;
          }
          if (loading) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target && target.closest('.pac-container')) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target && target.closest('.pac-container')) {
            e.preventDefault();
          }
        }}
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                <Label htmlFor="contact_phone_local">Contact Phone</Label>
                <div className="flex mt-2">
                  <span className="inline-flex items-center px-3 text-sm text-gray-600 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                    +63
                  </span>
                  <Input
                    id="contact_phone_local"
                    type="tel"
                    inputMode="numeric"
                    value={phoneLocal}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const limited = raw.slice(0, 10);
                      setPhoneLocal(limited);
                      setFormData((p) => ({ ...p, contact_phone: limited ? `+63${limited}` : '' }));
                      setPhoneError(validatePhoneLocal(limited));
                    }}
                    placeholder="9XXXXXXXXX"
                    disabled={loading}
                    className="rounded-l-none"
                  />
                </div>
                {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
                {!phoneError && phoneLocal.length === 10 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Full number will be saved as +63{phoneLocal}
                  </p>
                )}
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
                <div className="grid grid-cols-3 gap-2 mt-2 sm:grid-cols-4 md:grid-cols-5">
                  {/* Existing photos */}
                  {formData.photos.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="Center photo"
                        className="object-cover w-full h-24 border rounded"
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
                        className="object-cover w-full h-24 border rounded"
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
            {/* Removed overflow-hidden so Google autocomplete suggestions are clickable */}
            <div className="mt-2">
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
            <p className="mt-1 text-xs text-gray-500">
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
            <Button type="submit" disabled={loading || !!phoneError}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {center ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
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
