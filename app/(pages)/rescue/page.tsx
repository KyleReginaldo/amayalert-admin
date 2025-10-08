'use client';

import AuthWrapper from '@/app/components/auth-wrapper';
import rescueAPI, { Rescue, RescueStatus } from '@/app/lib/rescue-api';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  LifeBuoy,
  Loader2,
  MapPin,
  Play,
  Save,
  Search,
  Shield,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const { rescues, rescueLoading, refreshRescues, updateRescue, removeRescue } = useRescue();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  // Modal state for viewing/editing rescue details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRescue, setSelectedRescue] = useState<Rescue | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load rescues on component mount if needed
  useEffect(() => {
    if (rescues.length === 0 && !rescueLoading) {
      refreshRescues();
    }
  }, [rescues.length, rescueLoading, refreshRescues]);

  // Admin update rescue (status, notes, scheduling)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (id: string, rescueData: Record<string, any>) => {
    try {
      setModalLoading(true);
      const response = await rescueAPI.updateRescue(id, rescueData);
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
        const response = await rescueAPI.deleteRescue(id);
        if (response.success) {
          removeRescue(id);
        }
      } catch (error) {
        console.error('Failed to delete rescue:', error);
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: RescueStatus) => {
    try {
      const response = await rescueAPI.updateRescueStatus(id, status);
      if (response.success && response.data) {
        updateRescue(id, response.data);
      }
    } catch (error) {
      console.error('Failed to update rescue status:', error);
    }
  };

  const openRescueModal = (rescue: Rescue) => {
    setSelectedRescue(rescue);
    setIsModalOpen(true);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (data: Record<string, any>) => void;
    loading?: boolean;
  }

  function RescueModal({ isOpen, onClose, rescue, onSave, loading = false }: RescueModalProps) {
    const [formData, setFormData] = useState({
      status: 'pending' as RescueStatus,
      scheduled_for: '',
      notes: '', // Admin notes
    });

    useEffect(() => {
      if (rescue) {
        setFormData({
          status: rescue.status,
          scheduled_for: rescue.scheduled_for ? rescue.scheduled_for.split('T')[0] : '',
          notes: (rescue.metadata as RescueMetadata)?.notes || '',
        });
      }
    }, [rescue]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        status: formData.status,
        scheduled_for: formData.scheduled_for || null,
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
        <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rescue Operation Details</DialogTitle>
            <DialogDescription>
              Review and manage this rescue request from a citizen.
            </DialogDescription>
          </DialogHeader>

          {/* Read-only rescue details from user */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{rescue.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge className={getPriorityBadge(rescue.priority).class}>
                    {getPriorityBadge(rescue.priority).label}
                  </Badge>
                  <Badge className={getStatusBadge(rescue.status).class}>
                    {getStatusBadge(rescue.status).label}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Reported: {new Date(rescue.created_at).toLocaleString()}</div>
                <div>ID: #{rescue.id}</div>
              </div>
            </div>

            {rescue.description && (
              <div>
                <strong className="text-gray-700">Description:</strong>
                <p className="mt-1 text-gray-600">{rescue.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rescue.lat && rescue.lng && (
                <div>
                  <strong className="text-gray-700">Location:</strong>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {rescue.lat.toFixed(4)}, {rescue.lng.toFixed(4)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${rescue.lat},${rescue.lng}`,
                          '_blank',
                        )
                      }
                      className="ml-2 h-6 text-xs"
                    >
                      View Map
                    </Button>
                  </div>
                </div>
              )}

              {rescue.user && (
                <div>
                  <strong className="text-gray-700">Reported by:</strong>
                  <div className="flex items-center gap-1 mt-1">
                    <UserCheck className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {typeof rescue.user === 'object'
                        ? rescue.user.full_name || rescue.user.email || 'Unknown User'
                        : rescue.user}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin controls */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="status">Update Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as RescueStatus }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="pending">🟡 Pending</SelectItem>
                    <SelectItem value="in_progress">🔵 In Progress</SelectItem>
                    <SelectItem value="completed">🟢 Completed</SelectItem>
                    <SelectItem value="cancelled">🔴 Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scheduled_for">Schedule Operation</Label>
                <Input
                  id="scheduled_for"
                  type="date"
                  value={formData.scheduled_for}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduled_for: e.target.value }))
                  }
                  disabled={loading}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                placeholder="Add internal notes about this rescue operation, team assignments, equipment needed, progress updates, etc..."
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                disabled={loading}
                className="mt-2"
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Close
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Rescue
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredRescues.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;

  // Calculate statistics
  const stats = {
    total: rescues.length,
    pending: rescues.filter((r) => r.status === 'pending').length,
    inProgress: rescues.filter((r) => r.status === 'in_progress').length,
    completed: rescues.filter((r) => r.status === 'completed').length,
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

                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRescueModal(rescue)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rescue.id)}
                        className="h-8 w-8 rounded-full text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rescue Requests</h1>
              <p className="text-gray-600 text-sm">
                Monitor and manage emergency rescue requests from citizens
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              Admin Dashboard
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Awaiting Response</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">Active Operations</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-sm text-gray-600">Critical Priority</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search rescue requests..."
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
            </div>
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
                        <Badge className={getStatusBadge(rescue.status).class}>
                          {getStatusBadge(rescue.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(rescue.priority).class}>
                          {getPriorityBadge(rescue.priority).label}
                        </Badge>
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
                            className="h-8 p-2 text-blue-600 hover:text-blue-800"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">No location</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRescueModal(rescue)}
                            className="h-8 w-8 text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rescue.id)}
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
          onSave={(data) => handleUpdate(selectedRescue.id, data)}
          loading={modalLoading}
        />
      )}
    </AuthWrapper>
  );
}
