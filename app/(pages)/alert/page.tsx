'use client';

import AuthWrapper from '@/app/components/auth-wrapper';
import alertsAPI, { Alert, AlertInsert, AlertUpdate } from '@/app/lib/alerts-api';
import { useAlerts } from '@/app/providers/alerts-provider';
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
  AlertTriangle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const alertLevelConfig = {
  low: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Low', icon: Bell },
  medium: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Medium', icon: Clock },
  high: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    label: 'High',
    icon: AlertTriangle,
  },
  critical: {
    color: 'bg-red-50 text-red-700 border-red-200',
    label: 'Critical',
    icon: AlertTriangle,
  },
};

export default function AlertPage() {
  const { alerts, alertsLoading, refreshAlerts, addAlert, updateAlert, removeAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [alertLevelFilter, setAlertLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable if needed

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Restore modal open state on mount to prevent losing input on tab switch/refresh
  useEffect(() => {
    try {
      const wasOpen = typeof window !== 'undefined' && localStorage.getItem('alertModal.isOpen');
      if (wasOpen === 'true') {
        setIsModalOpen(true);
      }
    } catch (_) {
      // ignore storage issues
    }
  }, []);

  useEffect(() => {
    if (alerts.length === 0 && !alertsLoading) {
      refreshAlerts();
    }
    alerts.forEach((alert) => {
      console.log(`alert: ${JSON.stringify(alert)}`);
    });
  }, [alerts, alertsLoading, refreshAlerts]);

  const handleCreate = async (alertData: AlertInsert) => {
    try {
      setModalLoading(true);
      const response = await alertsAPI.createAlert(alertData);
      if (response.success && response.data) {
        addAlert(response.data);

        // Show notification status if available
        if (response.notifications) {
          const { sms, email } = response.notifications;
          let statusMessage = 'Alert created successfully!';

          if (sms?.sent > 0 || email?.sent > 0) {
            const notifications = [];
            if (sms?.sent > 0) notifications.push(`${sms.sent} SMS`);
            if (email?.sent > 0) notifications.push(`${email.sent} email`);
            statusMessage += ` Sent ${notifications.join(' and ')} notifications.`;
          }

          if (sms?.errors?.length > 0 || email?.errors?.length > 0) {
            console.warn('Some notifications failed:', response.notifications);
          }

          // You could show a toast notification here with the status
          console.log('Notification Status:', statusMessage);
        }

        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (id: number, alertData: AlertUpdate) => {
    try {
      setModalLoading(true);
      const response = await alertsAPI.updateAlert(id, alertData);
      if (response.success && response.data) {
        updateAlert(id, response.data);
        setIsModalOpen(false);
        setEditingAlert(null);
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      try {
        const response = await alertsAPI.deleteAlert(id);
        if (response.success) {
          removeAlert(id);
        }
      } catch (error) {
        console.error('Failed to delete alert:', error);
      }
    }
  };

  const openCreateModal = () => {
    console.log('Opening create modal');
    setEditingAlert(null);
    setIsModalOpen(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('alertModal.isOpen', 'true');
        // clear any previous draft if switching to create mode
        localStorage.removeItem('alertModal.formData');
      }
    } catch (_) {}
  };

  const openEditModal = (alert: Alert) => {
    console.log('Opening edit modal for alert:', alert.id);
    setEditingAlert(alert);
    setIsModalOpen(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('alertModal.isOpen', 'true');
      }
    } catch (_) {}
  };

  const openAlertSheet = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsSheetOpen(true);
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAlertLevel = alertLevelFilter === 'all' || alert.alert_level === alertLevelFilter;
    return matchesSearch && matchesAlertLevel;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setAlertLevelFilter(value);
    setCurrentPage(1);
  };

  const alertLevelColor = (level: string | null) =>
    alertLevelConfig[level as keyof typeof alertLevelConfig]?.color || '';

  const stats = {
    total: alerts.length,
    low: alerts.filter((a) => a.alert_level === 'low').length,
    medium: alerts.filter((a) => a.alert_level === 'medium').length,
    high: alerts.filter((a) => a.alert_level === 'high').length,
    critical: alerts.filter((a) => a.alert_level === 'critical').length,
  };

  if (alertsLoading && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span>Loading alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50 md:bg-background">
        <div className="p-4 md:p-6">
          {/* Header Section - Responsive */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Alert Management
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Create, manage, and monitor emergency alerts
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={openCreateModal}
              className="gap-2 w-full md:w-auto rounded-full md:rounded-md"
            >
              <Plus className="h-4 w-4" />
              Create Alert
            </Button>
          </div>

          {/* Search Bar - Responsive */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search alerts..."
              className="pl-10 bg-gray-50 md:bg-background border-0 md:border rounded-full md:rounded-md"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Quick Stats - Responsive Grid */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs md:text-sm text-blue-600">Total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-green-600">{stats.low}</div>
              <div className="text-xs md:text-sm text-green-600">Low</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-yellow-600">{stats.medium}</div>
              <div className="text-xs md:text-sm text-yellow-600">Medium</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-orange-600">{stats.high}</div>
              <div className="text-xs md:text-sm text-orange-600">High</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs md:text-sm text-red-600">Critical</div>
            </div>
          </div>

          {/* Filter - Responsive */}
          <div className="flex items-center justify-between mb-4">
            <Select value={alertLevelFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[120px] md:w-[180px] h-8 md:h-10 rounded-full md:rounded-md bg-gray-100 md:bg-background border-0 md:border">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Info */}
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAlerts.length)} of{' '}
              {filteredAlerts.length} alerts
            </div>
          </div>

          {/* Alert Table - Responsive */}
          <div className="bg-white rounded-lg md:rounded-md shadow-sm border-0 md:border overflow-hidden">
            {/* Mobile View - Stack Cards */}
            <div className="block md:hidden">
              <div className="divide-y divide-gray-200">
                {paginatedAlerts.map((alert) => {
                  const LevelIcon =
                    alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig]?.icon ||
                    Bell;
                  return (
                    <div key={alert.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {alert.title || 'Untitled Alert'}
                            </h3>
                            <Badge
                              variant="outline"
                              className={alertLevelColor(alert.alert_level) + ' text-xs'}
                            >
                              <LevelIcon className="h-3 w-3 mr-1" />
                              {alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig]
                                ?.label || alert.alert_level}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {alert.content || 'No content'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>
                              {new Date(alert.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(alert)}
                            className="h-8 w-8 rounded-full"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAlertSheet(alert)}
                            className="h-8 w-8 rounded-full text-gray-600 hover:text-gray-900"
                            title="View details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
                            className="h-8 w-8 rounded-full text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Content</TableHead>
                    <TableHead className="font-semibold">Level</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAlerts.map((alert) => {
                    const LevelIcon =
                      alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig]?.icon ||
                      Bell;
                    return (
                      <TableRow key={alert.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="max-w-[200px] truncate">
                            {alert.title || 'Untitled Alert'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate text-gray-600">
                            {alert.content || 'No content'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={alertLevelColor(alert.alert_level) + ' text-xs'}
                          >
                            <LevelIcon className="h-3 w-3 mr-1" />
                            {alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig]
                              ?.label || alert.alert_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="text-sm">
                            <div>{new Date(alert.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(alert.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={alert.deleted_at ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {alert.deleted_at ? 'Deleted' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(alert)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAlertSheet(alert)}
                              className="h-8 w-8 text-gray-600 hover:text-gray-900"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(alert.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Empty State */}
            {filteredAlerts.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No alerts found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filter</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredAlerts.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and one page on each side of current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsis = index > 0 && array[index - 1] < page - 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>

        {/* Unified Modal */}
        <AlertModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAlert(null);
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('alertModal.isOpen');
                localStorage.removeItem('alertModal.formData');
              }
            } catch (_) {}
          }}
          alert={editingAlert}
          onSave={
            editingAlert ? (data: AlertUpdate) => handleUpdate(editingAlert.id, data) : handleCreate
          }
          loading={modalLoading}
        />

        {/* Right-side Alert Details Sheet */}
        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) setSelectedAlert(null);
          }}
        >
          <SheetContent className="sm:max-w-2xl">
            {selectedAlert && (
              <div className="flex h-full flex-col">
                <SheetHeader>
                  <SheetTitle>Alert Details</SheetTitle>
                  <SheetDescription>Read-only snapshot of this alert.</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-auto space-y-4 text-sm text-gray-700">
                  <div>
                    <div className="text-xs text-gray-500">ID</div>
                    <div className="font-mono break-all">{selectedAlert.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Title</div>
                    <div className="font-medium text-gray-900">
                      {selectedAlert.title || 'Untitled Alert'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Content</div>
                    <div className="whitespace-pre-wrap">
                      {selectedAlert.content || 'No content'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Level</div>
                    <Badge
                      variant="outline"
                      className={alertLevelColor(selectedAlert.alert_level) + ' text-xs'}
                    >
                      {alertLevelConfig[selectedAlert.alert_level as keyof typeof alertLevelConfig]
                        ?.label || selectedAlert.alert_level}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <Badge
                      variant={selectedAlert.deleted_at ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {selectedAlert.deleted_at ? 'Deleted' : 'Active'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Created</div>
                    <div>
                      {new Date(selectedAlert.created_at).toLocaleDateString()} ·{' '}
                      {new Date(selectedAlert.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsSheetOpen(false);
                      if (selectedAlert) openEditModal(selectedAlert);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AuthWrapper>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;

  onSave: (data: AlertInsert | AlertUpdate) => void;
  loading?: boolean;
}

function AlertModal({ isOpen, onClose, alert, onSave, loading = false }: AlertModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    alert_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });

  useEffect(() => {
    // When alert changes or modal opens, prefer restoring draft from storage
    if (isOpen) {
      try {
        if (typeof window !== 'undefined') {
          const draft = localStorage.getItem('alertModal.formData');
          if (draft) {
            const parsed = JSON.parse(draft);
            setFormData((prev) => ({ ...prev, ...parsed }));
            return; // prefer draft over props
          }
        }
      } catch (_) {}
    }

    if (alert) {
      setFormData({
        title: alert.title || '',
        content: alert.content || '',
        alert_level: (alert.alert_level as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        alert_level: 'medium',
      });
    }
  }, [alert, isOpen]);

  // Persist draft while typing to avoid losing progress on tab switch/refresh
  useEffect(() => {
    if (!isOpen) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('alertModal.formData', JSON.stringify(formData));
      }
    } catch (_) {}
  }, [formData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{alert ? 'Edit Alert' : 'Create New Alert'}</DialogTitle>
          <DialogDescription>
            {alert
              ? 'Update the alert information below.'
              : 'Fill in the details to create a new alert.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Alert Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter alert title..."
              required
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="content">Alert Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the alert message..."
              required
              rows={4}
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="alert_level">Alert Level</Label>
            <Select
              value={formData.alert_level}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  alert_level: value as 'low' | 'medium' | 'high' | 'critical',
                }))
              }
              disabled={loading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {alert ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {alert ? 'Update Alert' : 'Create Alert'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
