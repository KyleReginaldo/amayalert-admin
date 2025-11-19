'use client';

import AuthWrapper from '@/app/components/auth-wrapper';
import { PageHeader } from '@/app/components/page-header';
import rescueAPI, { Rescue, RescueStatus, RescueUpdate } from '@/app/lib/rescue-api';
import { useRescue } from '@/app/providers/rescue-provider';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Flag,
  Info,
  LifeBuoy,
  Loader2,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Play,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Helper type for rescue metadata
interface RescueMetadata {
  notes?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  teamAssigned?: string;
  equipment?: string[];
  outcome?: string;
  evacuatedTo?: string;
  reportedVia?: string;
  contactNumber?: string;
}

export default function RescuePage() {
  // Get data from context
  const { rescues, rescueLoading, updateRescue, removeRescue } = useRescue();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [emergencyTypeFilter, setEmergencyTypeFilter] = useState<string>('all');
  const EMERGENCY_TYPES: { value: string; label: string }[] = [
    { value: 'medical', label: 'Medical' },
    { value: 'fire', label: 'Fire' },
    { value: 'flood', label: 'Flood' },
    { value: 'accident', label: 'Accident' },
    { value: 'violence', label: 'Violence' },
    { value: 'naturalDisaster', label: 'Natural Disaster' },
    { value: 'other', label: 'Other' },
  ];

  // Modal state for viewing/editing rescue details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRescue, setSelectedRescue] = useState<Rescue | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  // Right-side sheet state (read-only details)
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Note: Initial fetching is handled by RescueProvider to avoid re-fetch loops on empty data

  // Admin update rescue (status, notes, scheduling)
  const handleUpdate = async (
    id: string,
    rescueData: Partial<RescueUpdate>,
    options?: { sendSMS?: boolean; smsMessage?: string },
  ) => {
    try {
      setModalLoading(true);
      const response = await rescueAPI.updateRescue(id, rescueData, options);
      if (response.success && response.data) {
        updateRescue(id, response.data);
        setIsModalOpen(false);
        setSelectedRescue(null);
      }
    } catch (error) {
      console.error('Failed to update rescue:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm('Are you sure you want to delete this rescue request? This action cannot be undone.')
    ) {
      try {
        setRowLoading((prev) => ({ ...prev, [id]: true }));
        const response = await rescueAPI.deleteRescue(id);
        if (response.success) {
          removeRescue(id);
        }
      } catch (error) {
        console.error('Failed to delete rescue:', error);
      } finally {
        setRowLoading((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: RescueStatus) => {
    try {
      setRowLoading((prev) => ({ ...prev, [id]: true }));
      const response = await rescueAPI.updateRescueStatus(id, status);
      if (response.success && response.data) {
        updateRescue(id, response.data);
      }
    } catch (error) {
      console.error('Failed to update rescue status:', error);
    } finally {
      setRowLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const openRescueModal = (rescue: Rescue) => {
    setSelectedRescue(rescue);
    setIsModalOpen(true);
  };

  const openRescueSheet = (rescue: Rescue) => {
    setSelectedRescue(rescue);
    setIsSheetOpen(true);
  };

  const getPriorityBadge = (priority: number) => {
    const config = {
      1: { label: 'Critical', class: 'bg-red-100 text-red-800 border-red-300' },
      2: { label: 'High', class: 'bg-orange-100 text-orange-800 border-orange-300' },
      3: { label: 'Medium', class: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      4: { label: 'Low', class: 'bg-green-100 text-green-800 border-green-300' },
    };
    return config[priority as keyof typeof config] || config[3];
  };

  const getStatusBadge = (status: RescueStatus) => {
    const config = {
      pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800' },
    };
    return config[status] || config.pending;
  };

  // Modal component for admin rescue management
  interface RescueModalProps {
    isOpen: boolean;
    onClose: () => void;
    rescue: Rescue;
    onSave: (
      data: Partial<RescueUpdate>,
      options?: { sendSMS?: boolean; smsMessage?: string },
    ) => void;
    loading?: boolean;
  }

  function RescueModal({ isOpen, onClose, rescue, onSave, loading = false }: RescueModalProps) {
    const [formData, setFormData] = useState({
      status: 'pending' as RescueStatus,
      scheduled_for: '',
      notes: '', // Admin notes
      priority: 3, // Default to medium priority
      emergency_type: '',
      female_count: '' as string | number,
      male_count: '' as string | number,
      contact_phone: '',
      email: '',
      important_information: '',
    });

    useEffect(() => {
      if (rescue) {
        setFormData({
          status: rescue.status,
          scheduled_for: rescue.scheduled_for ? rescue.scheduled_for.split('T')[0] : '',
          notes: (rescue.metadata as RescueMetadata)?.notes || '',
          priority: rescue.priority || 3,
          emergency_type: rescue.emergency_type || '',
          female_count: rescue.female_count ?? '',
          male_count: rescue.male_count ?? '',
          contact_phone: rescue.contact_phone || '',
          email: rescue.email || '',
          important_information: rescue.important_information || '',
        });
      }
    }, [rescue]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        status: formData.status,
        scheduled_for: formData.scheduled_for || null,
        priority: formData.priority,
        emergency_type: formData.emergency_type || null,
        female_count:
          formData.female_count === '' || formData.female_count === null
            ? null
            : Number(formData.female_count),
        male_count:
          formData.male_count === '' || formData.male_count === null
            ? null
            : Number(formData.male_count),
        contact_phone: formData.contact_phone || null,
        email: formData.email || null,
        important_information: formData.important_information || null,
        metadata: {
          ...((rescue.metadata as RescueMetadata) || {}),
          notes: formData.notes,
          lastUpdatedBy: 'admin',
          lastUpdatedAt: new Date().toISOString(),
        },
      };
      onSave(submitData);
    };

    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg border border-gray-200 bg-white/90 backdrop-blur">
          <DialogHeader className="pb-2 border-b border-gray-100">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Rescue Operation Details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Review and manage this emergency rescue request submitted by a citizen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-gray-900 truncate">{rescue.title}</h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                  #{rescue.id}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Badge
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                  getStatusBadge(rescue.status).class
                }`}
              >
                {getStatusBadge(rescue.status).label}
              </Badge>
              <Badge
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                  getPriorityBadge(rescue.priority).class
                }`}
              >
                {getPriorityBadge(rescue.priority).label}
              </Badge>
            </div>
          </div>

          {rescue.description && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Description
              </div>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">{rescue.description}</p>
            </div>
          )}

          {/* Emergency details */}
          {(rescue.emergency_type ||
            rescue.female_count ||
            rescue.male_count ||
            rescue.contact_phone ||
            rescue.important_information) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {rescue.emergency_type && (
                <div>
                  <div className="font-medium text-gray-700">Emergency Type</div>
                  <div className="mt-1 text-gray-600">{rescue.emergency_type}</div>
                </div>
              )}
              {(rescue.female_count || rescue.male_count) && (
                <div>
                  <div className="font-medium text-gray-700">People Involved</div>
                  <div className="mt-1 text-gray-600">
                    {(rescue.female_count || 0) + (rescue.male_count || 0)} total (
                    {rescue.female_count || 0}F / {rescue.male_count || 0}M)
                  </div>
                </div>
              )}
              {rescue.contact_phone && (
                <div>
                  <div className="font-medium text-gray-700">Contact Phone</div>
                  <div className="mt-1 text-gray-600">{rescue.contact_phone}</div>
                </div>
              )}
              {rescue.email && (
                <div>
                  <div className="font-medium text-gray-700">Contact Email</div>
                  <div className="mt-1 text-gray-600">{rescue.email}</div>
                </div>
              )}
              {rescue.important_information && (
                <div className="md:col-span-2">
                  <div className="font-medium text-gray-700">Important Info</div>

                  <p> {rescue.important_information}</p>
                </div>
              )}
            </div>
          )}

          {/* Location & reporter */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {rescue.lat && rescue.lng && (
              <div>
                <div className="font-medium text-gray-700 flex flex-row items-center gap-1">
                  Location{' '}
                  <Link
                    href={`https://maps.google.com/?q=${rescue.lat},${rescue.lng}`}
                    target="_blank"
                  >
                    <ArrowUpRight className="h-4 w-4 hover:text-blue-600 cursor-pointer" />
                  </Link>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  {rescue.address}
                </div>
              </div>
            )}
            {rescue.user && (
              <div>
                <div className="font-medium text-gray-700">Reported by</div>
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  {typeof rescue.user === 'object'
                    ? rescue.user.full_name || rescue.user.email || 'Unknown'
                    : rescue.user}
                </div>
              </div>
            )}
          </div>

          {/* ADMIN CONTROLS */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Status */}
              <div>
                <Label htmlFor="status" className="font-medium text-gray-700">
                  Update Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as RescueStatus }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="mt-2 rounded-md border-gray-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="font-medium text-gray-700">
                  Priority Level
                </Label>
                <Select
                  value={String(formData.priority)}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: Number(value) }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="mt-2 border-gray-300">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Critical</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="4">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              <div>
                <Label htmlFor="scheduled_for" className="font-medium text-gray-700">
                  Schedule Operation
                </Label>
                <Input
                  id="scheduled_for"
                  type="date"
                  value={formData.scheduled_for}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduled_for: e.target.value }))
                  }
                  disabled={loading}
                  className="mt-2 border-gray-300"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional — set a target date for field teams.
                </p>
              </div>
            </div>

            {/* Priority */}

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="font-medium text-gray-700">
                Admin Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                placeholder="Add internal notes or progress updates..."
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                disabled={loading}
                className="mt-2 border-gray-300"
                rows={4}
              />
            </div>

            {/* Actions */}
            <DialogFooter className="pt-3 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Close
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>Update</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Kebab menu component for actions
  function KebabActions({ rescue }: { rescue: Rescue }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
      function onDocClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target.closest(`#kebab-${rescue.id}`)) setOpen(false);
      }
      if (open) document.addEventListener('click', onDocClick);
      return () => document.removeEventListener('click', onDocClick);
    }, [open, rescue.id]);

    // Positioning logic using portal to avoid table clipping/overlap
    useEffect(() => {
      function compute() {
        if (triggerRef.current && open) {
          const rect = triggerRef.current.getBoundingClientRect();
          const menuWidth = 176; // w-44
          const gap = 6;
          let left = rect.right - menuWidth;
          if (left < 8) left = 8; // keep inside viewport
          let top = rect.bottom + gap;
          const viewportHeight = window.innerHeight;
          const estimatedHeight = 260; // rough menu height
          if (top + estimatedHeight > viewportHeight - 16) {
            top = rect.top - estimatedHeight - gap;
            if (top < 8) top = 8;
          }
          setCoords({ top, left });
        } else if (!open) {
          setCoords(null);
        }
      }
      compute();
      window.addEventListener('resize', compute);
      window.addEventListener('scroll', compute, true);
      return () => {
        window.removeEventListener('resize', compute);
        window.removeEventListener('scroll', compute, true);
      };
    }, [open]);

    const status = rescue.status;
    const loading = rowLoading[rescue.id];
    return (
      <div className="relative" id={`kebab-${rescue.id}`}>
        <Button
          variant="ghost"
          size="sm"
          ref={triggerRef}
          onClick={() => !loading && setOpen((o) => !o)}
          className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          aria-label="Actions"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          ) : (
            <MoreVertical className="h-4 w-4 text-gray-600" />
          )}
        </Button>
        {open &&
          !loading &&
          coords &&
          createPortal(
            <div
              style={{ top: coords.top, left: coords.left, position: 'fixed' }}
              className="z-50 w-44 rounded-md border border-gray-200 bg-white shadow-lg py-1 text-sm animate-fadeIn"
            >
              <button
                onClick={() => {
                  openRescueSheet(rescue);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-3.5 w-3.5" /> View Details
              </button>
              <button
                onClick={() => {
                  openRescueModal(rescue);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              {status === 'pending' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(rescue.id, 'in_progress');
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Play className="h-3.5 w-3.5" /> Dispatch
                </button>
              )}
              {status === 'in_progress' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(rescue.id, 'completed');
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Complete
                </button>
              )}
              {status !== 'completed' && status !== 'cancelled' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(rescue.id, 'cancelled');
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
              <div className="border-t my-1" />
              <button
                onClick={() => {
                  handleDelete(rescue.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>,
            document.body,
          )}
      </div>
    );
  }

  // Filter and paginate rescues
  const filteredRescues = rescues.filter((rescue) => {
    const matchesSearch =
      rescue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rescue.description && rescue.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || rescue.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'all' || rescue.priority.toString() === priorityFilter;
    const matchesEmergencyType =
      emergencyTypeFilter === 'all' || rescue.emergency_type === emergencyTypeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesEmergencyType;
  });

  const totalPages = Math.ceil(filteredRescues.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;

  // Calculate statistics
  const stats = {
    total: rescues.length,
    pending: rescues.filter((r) => r.status === 'pending').length,
    inProgress: rescues.filter((r) => r.status === 'in_progress').length,
    completed: rescues.filter((r) => r.status === 'completed').length,
    cancelled: rescues.filter((r) => r.status === 'cancelled').length,
    critical: rescues.filter((r) => r.priority === 1).length,
  };

  if (rescueLoading && rescues.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading rescue requests...</span>
        </div>
      </div>
    );
  }

  // Empty state when no rescues exist
  if (!rescueLoading && rescues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 md:bg-background">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
                <LifeBuoy className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Rescue Requests</h2>
              <p className="text-gray-600 mb-6">
                No rescue requests have been submitted by citizens yet. Rescue requests will appear
                here when users report emergencies through the mobile app.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <p className="mb-2">As an admin, you can:</p>
              <ul className="text-left space-y-1 max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <Eye className="h-3 w-3 text-blue-500" />
                  Monitor incoming rescue requests
                </li>
                <li className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-green-500" />
                  Update rescue operation status
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-orange-500" />
                  Schedule rescue operations
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-purple-500" />
                  Manage team assignments
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      {/* Mobile Layout */}
      <div className="block md:hidden min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">Rescue Requests</h1>
              <Badge variant="outline" className="text-sm">
                Admin View
              </Badge>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search rescue requests..."
                className="pl-10 bg-gray-50 border-0 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-blue-600">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-yellow-600">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs text-blue-600">Active</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-red-600">{stats.critical}</div>
                <div className="text-xs text-red-600">Critical</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[100px] h-8 rounded-full bg-gray-100 border-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[100px] h-8 rounded-full bg-gray-100 border-0">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="1">Critical</SelectItem>
                  <SelectItem value="2">High</SelectItem>
                  <SelectItem value="3">Medium</SelectItem>
                  <SelectItem value="4">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={emergencyTypeFilter} onValueChange={setEmergencyTypeFilter}>
                <SelectTrigger className="w-[140px] h-8 rounded-full bg-gray-100 border-0">
                  <SelectValue placeholder="Emergency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EMERGENCY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          <div className="space-y-3">
            {filteredRescues.map((rescue) => (
              <Card
                key={rescue.id}
                className="bg-white rounded-xl shadow-sm border-0 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{rescue.title}</h3>
                        <div className="flex gap-1">
                          <Badge className={`text-xs ${getStatusBadge(rescue.status).class}`}>
                            {getStatusBadge(rescue.status).label}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityBadge(rescue.priority).class}`}>
                            {getPriorityBadge(rescue.priority).label}
                          </Badge>
                        </div>
                      </div>
                      {rescue.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {rescue.description}
                        </p>
                      )}
                      {rescue.emergency_type && (
                        <div className="text-xs text-indigo-600 font-medium mb-2">
                          {EMERGENCY_TYPES.find((t) => t.value === rescue.emergency_type)?.label ||
                            rescue.emergency_type}
                        </div>
                      )}
                      {(() => {
                        const female = rescue.female_count || 0;
                        const male = rescue.male_count || 0;
                        const total = female + male;
                        return total > 0 ? (
                          <div className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">People:</span> {total} ({female}F/{male}M)
                          </div>
                        ) : null;
                      })()}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(rescue.created_at).toLocaleDateString()}</span>
                        </div>
                        {rescue.scheduled_for && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(rescue.scheduled_for).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex ml-2">
                      <KebabActions rescue={rescue} />
                    </div>
                  </div>

                  {/* Quick Status Actions */}
                  {rescue.status !== 'completed' && rescue.status !== 'cancelled' && (
                    <div className="flex gap-1 mt-3">
                      {rescue.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(rescue.id, 'in_progress')}
                          className="text-xs"
                          disabled={rowLoading[rescue.id]}
                        >
                          {rowLoading[rescue.id] ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Dispatch
                        </Button>
                      )}
                      {rescue.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(rescue.id, 'completed')}
                          className="text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(rescue.id, 'cancelled')}
                        className="text-xs text-red-600"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {filteredRescues.length === 0 && (
              <div className="text-center py-12">
                <LifeBuoy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No rescue requests found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <PageHeader
            title="Rescue Requests"
            subtitle="Monitor and manage emergency rescue requests from citizens"
          />

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 bg-slate-50 border-0">
              <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Requests</div>
            </Card>
            <Card className="p-4 bg-yellow-50 border-0">
              <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-sm text-yellow-700/80">Awaiting Response</div>
            </Card>
            <Card className="p-4 bg-blue-50 border-0">
              <div className="text-3xl font-bold text-blue-700">{stats.inProgress}</div>
              <div className="text-sm text-blue-700/80">Active Operations</div>
            </Card>
            <Card className="p-4 bg-green-50 border-0">
              <div className="text-3xl font-bold text-green-700">{stats.completed}</div>
              <div className="text-sm text-green-700/80">Completed</div>
            </Card>
            <Card className="p-4 bg-red-50 border-0">
              <div className="text-3xl font-bold text-red-700">{stats.critical}</div>
              <div className="text-sm text-red-700/80">Critical Priority</div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search rescue requests..."
                className="pl-10 border-gray-300 focus:border-gray-400 w-full md:w-md"
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[140px] border-gray-300">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="1">Critical</SelectItem>
                <SelectItem value="2">High</SelectItem>
                <SelectItem value="3">Medium</SelectItem>
                <SelectItem value="4">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={emergencyTypeFilter} onValueChange={setEmergencyTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px] border-gray-300">
                <SelectValue placeholder="Emergency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EMERGENCY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center gap-6 mt-2 px-1">
            {[
              { key: 'all', label: 'All Requests', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`relative pb-2 text-sm transition-colors ${
                  statusFilter === tab.key ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {tab.count}
                </span>
                {statusFilter === tab.key && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Table View */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="font-medium text-gray-900">Request Details</TableHead>
                    <TableHead className="font-medium text-gray-900">Status</TableHead>
                    <TableHead className="font-medium text-gray-900">Priority</TableHead>
                    <TableHead className="font-medium text-gray-900">Emergency Type</TableHead>
                    <TableHead className="font-medium text-gray-900">People</TableHead>
                    <TableHead className="font-medium text-gray-900">Reported</TableHead>
                    <TableHead className="font-medium text-gray-900">Location</TableHead>
                    <TableHead className="font-medium text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRescues.slice(startIndex, startIndex + entriesPerPage).map((rescue) => (
                    <TableRow key={rescue.id} className="hover:bg-gray-50 border-gray-200">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{rescue.title}</div>
                          {rescue.description && (
                            <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                              {rescue.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">#{rescue.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const colors = {
                            pending: 'bg-yellow-500',
                            in_progress: 'bg-blue-500',
                            completed: 'bg-green-500',
                            cancelled: 'bg-red-500',
                          } as const;
                          const label = getStatusBadge(rescue.status).label;
                          return (
                            <div
                              className={
                                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm' +
                                ` ${colors[rescue.status]} bg-opacity-10 text-${
                                  colors[rescue.status].split('-')[1]
                                }-700`
                              }
                            >
                              <span className={'capitalize text-white'}>{label}</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(rescue.priority).class}>
                          {getPriorityBadge(rescue.priority).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const type = EMERGENCY_TYPES.find(
                            (t) => t.value === rescue.emergency_type,
                          );
                          return type ? (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              {type.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const female = rescue.female_count || 0;
                          const male = rescue.male_count || 0;
                          const total = female + male;
                          return total > 0 ? (
                            <div className="text-sm text-gray-700 font-medium">
                              {total}{' '}
                              <span className="text-xs text-gray-500">
                                ({female}F/{male}M)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {new Date(rescue.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(rescue.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rescue.lat && rescue.lng ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://maps.google.com/?q=${rescue.lat},${rescue.lng}`,
                                '_blank',
                              )
                            }
                            className="h-8 p-2 text-gray-600 hover:text-gray-800"
                          >
                            <Image src="/google-maps.png" alt="Google Map" width={16} height={16} />
                            View Google Map
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">No location</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <KebabActions rescue={rescue} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(startIndex + entriesPerPage, filteredRescues.length)}
                </span>{' '}
                of <span className="font-medium">{filteredRescues.length}</span> results
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

      {/* Rescue Management Modal */}
      {isModalOpen && selectedRescue && (
        <RescueModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRescue(null);
          }}
          rescue={selectedRescue}
          onSave={(data, options) => handleUpdate(selectedRescue.id, data, options)}
          loading={modalLoading}
        />
      )}

      {/* Right-side Details Sheet */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setSelectedRescue(null);
        }}
      >
        <SheetContent className="sm:max-w-xl">
          {selectedRescue && (
            <div className="flex h-full flex-col">
              {/* Header */}
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-primary" />
                  Rescue Details
                </SheetTitle>
                <SheetDescription className="text-gray-600">
                  Quick read-only overview of the rescue request.
                </SheetDescription>
              </SheetHeader>

              {/* Body */}
              <div className="flex-1 overflow-auto mt-5 space-y-5">
                {/* Title, badges, ID */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                      {selectedRescue.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className={getStatusBadge(selectedRescue.status).class}>
                        {getStatusBadge(selectedRescue.status).label}
                      </Badge>
                      <Badge className={getPriorityBadge(selectedRescue.priority).class}>
                        {getPriorityBadge(selectedRescue.priority).label}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>Reported: {new Date(selectedRescue.created_at).toLocaleString()}</div>
                    <div>ID: #{selectedRescue.id}</div>
                  </div>
                </div>

                {/* Description */}
                {selectedRescue.description && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-800">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Description
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedRescue.description}
                    </p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Location
                    </div>
                    {selectedRescue.lat && selectedRescue.lng ? (
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        {selectedRescue.lat.toFixed(4)}, {selectedRescue.lng.toFixed(4)}
                        <Link
                          href={`https://maps.google.com/?q=${selectedRescue.lat},${selectedRescue.lng}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Map
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-gray-500">No location available</div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Activity className="h-4 w-4 text-gray-500" />
                      Status
                    </div>
                    <div className="mt-1 text-sm text-gray-600 capitalize">
                      {selectedRescue.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Flag className="h-4 w-4 text-gray-500" />
                      Priority
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {getPriorityBadge(selectedRescue.priority).label}
                    </div>
                  </div>

                  {selectedRescue.emergency_type && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <AlertTriangle className="h-4 w-4 text-gray-500" />
                        Emergency Type
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {selectedRescue.emergency_type}
                      </div>
                    </div>
                  )}

                  {((selectedRescue.female_count && selectedRescue.female_count > 0) ||
                    (selectedRescue.male_count && selectedRescue.male_count > 0)) && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <Users className="h-4 w-4 text-gray-500" />
                        People Involved
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {(selectedRescue.female_count || 0) + (selectedRescue.male_count || 0)} (
                        {selectedRescue.female_count || 0} Female, {selectedRescue.male_count || 0}{' '}
                        Male)
                      </div>
                    </div>
                  )}

                  {selectedRescue.contact_phone && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <Phone className="h-4 w-4 text-gray-500" />
                        Contact Phone
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {selectedRescue.contact_phone}
                      </div>
                    </div>
                  )}

                  {selectedRescue.scheduled_for && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Scheduled For
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {new Date(selectedRescue.scheduled_for).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Important Information */}
                {selectedRescue.important_information && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <div className="flex items-center gap-2 mb-1 text-sm font-medium text-amber-800">
                      <Info className="h-4 w-4 text-amber-600" />
                      Important Information
                    </div>
                    <div className="text-sm text-amber-700 whitespace-pre-wrap">
                      {selectedRescue.important_information}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedRescue.metadata && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-800">
                      <ClipboardList className="h-4 w-4 text-gray-500" />
                      Additional Info
                    </div>
                    {(() => {
                      const meta =
                        (selectedRescue.metadata as unknown as Partial<{
                          notes?: string;
                          lastUpdatedBy?: string;
                          lastUpdatedAt?: string;
                          teamAssigned?: string;
                          equipment?: string[] | string;
                          outcome?: string;
                          evacuatedTo?: string;
                          reportedVia?: string;
                          contactNumber?: string;
                        }>) || {};
                      const equipment = Array.isArray(meta.equipment)
                        ? meta.equipment.join(', ')
                        : meta.equipment;
                      const lastUpdatedAt = meta.lastUpdatedAt
                        ? new Date(meta.lastUpdatedAt).toLocaleString()
                        : undefined;

                      return (
                        <div className="space-y-1 text-sm text-gray-700">
                          {meta.reportedVia && (
                            <div>
                              <span className="font-medium">Reported via:</span>{' '}
                              <span className="text-gray-600">{meta.reportedVia}</span>
                            </div>
                          )}
                          {meta.contactNumber && (
                            <div>
                              <span className="font-medium">Contact number:</span>{' '}
                              <span className="text-gray-600">{meta.contactNumber}</span>
                            </div>
                          )}
                          {meta.teamAssigned && (
                            <div>
                              <span className="font-medium">Team assigned:</span>{' '}
                              <span className="text-gray-600">{meta.teamAssigned}</span>
                            </div>
                          )}
                          {equipment && (
                            <div>
                              <span className="font-medium">Equipment:</span>{' '}
                              <span className="text-gray-600">{equipment}</span>
                            </div>
                          )}
                          {meta.outcome && (
                            <div>
                              <span className="font-medium">Outcome:</span>{' '}
                              <span className="text-gray-600">{meta.outcome}</span>
                            </div>
                          )}
                          {meta.evacuatedTo && (
                            <div>
                              <span className="font-medium">Evacuated to:</span>{' '}
                              <span className="text-gray-600">{meta.evacuatedTo}</span>
                            </div>
                          )}
                          {(meta.lastUpdatedBy || lastUpdatedAt) && (
                            <div>
                              <span className="font-medium">Last updated:</span>{' '}
                              <span className="text-gray-600">
                                {meta.lastUpdatedBy}
                                {meta.lastUpdatedBy && lastUpdatedAt ? ' • ' : ''}
                                {lastUpdatedAt}
                              </span>
                            </div>
                          )}
                          {meta.notes && (
                            <div className="mt-2">
                              <div className="font-medium text-gray-800 mb-1">Notes</div>
                              <div className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-gray-700 shadow-sm">
                                {meta.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                  <X className="h-4 w-4 mr-1" /> Close
                </Button>
                <Button
                  onClick={() => {
                    setIsSheetOpen(false);
                    if (selectedRescue) openRescueModal(selectedRescue);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AuthWrapper>
  );
}
