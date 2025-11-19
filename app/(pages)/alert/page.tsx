'use client';

import type React from 'react';

import AuthWrapper from '@/app/components/auth-wrapper';
import { PageHeader } from '@/app/components/page-header';
import alertsAPI, { Alert, AlertCreateRequest, AlertUpdate } from '@/app/lib/alerts-api';
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
// HeroUI Select for modal alert level selector
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
import { Select as HeroSelect, SelectItem as HeroSelectItem } from '@heroui/react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Clock,
  CloudAlert,
  Edit,
  Eye,
  Info,
  Mail,
  Megaphone,
  Phone,
  Plus,
  Rocket,
  Save,
  Search,
  Trash2,
  UsersRound,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const alertLevelConfig = {
  low: {
    color:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
    label: 'Low',
    icon: Info,
    dotColor: 'bg-blue-400',
  },
  medium: {
    color:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
    label: 'Medium',
    icon: Clock,
    dotColor: 'bg-amber-400',
  },
  high: {
    color:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
    label: 'High',
    icon: AlertCircle,
    dotColor: 'bg-orange-400',
  },
  critical: {
    color:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
    label: 'Critical',
    icon: Zap,
    dotColor: 'bg-red-500',
  },
};

export default function AlertPage() {
  const { alerts, alertsLoading, refreshAlerts, addAlert, updateAlert, removeAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
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
    } catch {
      // ignore storage issues
    }
  }, []);

  useEffect(() => {
    // Refresh alerts on mount to ensure we have fresh data
    console.log('🚀 Alert page mounted, refreshing alerts...');
    refreshAlerts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug logging for state changes
  useEffect(() => {
    console.log(`📊 Alert state update - Loading: ${alertsLoading}, Count: ${alerts.length}`);
  }, [alertsLoading, alerts.length]);

  const handleCreate = async (alertData: AlertCreateRequest) => {
    try {
      setModalLoading(true);
      const response = await alertsAPI.createAlert(alertData);
      if (response.success && response.data) {
        addAlert(response.data);

        // Show notification status if available
        if (response.notifications) {
          const { sms, email, push } = response.notifications;
          let statusMessage = 'Alert created successfully!';

          if (sms?.sent > 0 || email?.sent > 0 || push?.sent > 0) {
            const notifications = [];
            if (push?.sent > 0) notifications.push(`${push.sent} push`);
            if (sms?.sent > 0) notifications.push(`${sms.sent} SMS`);
            if (email?.sent > 0) notifications.push(`${email.sent} email`);
            statusMessage += ` Sent ${notifications.join(', ')} notifications.`;
          }

          if (sms?.errors?.length > 0 || email?.errors?.length > 0 || push?.errors?.length > 0) {
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
    } catch {}
  };

  const openEditModal = (alert: Alert) => {
    console.log('Opening edit modal for alert:', alert.id);
    setEditingAlert(alert);
    setIsModalOpen(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('alertModal.isOpen', 'true');
      }
    } catch {}
  };

  const openAlertSheet = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsSheetOpen(true);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedAlerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedAlerts.map((a) => a.id)));
    }
  };
  const clearSelection = () => setSelectedIds(new Set());
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || bulkDeleting) return;
    if (!confirm(`Delete ${selectedIds.size} alert(s)? This marks them deleted.`)) return;
    try {
      setBulkDeleting(true);
      const res = await fetch('/api/alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      if (!json.success) {
        console.error('Bulk delete failed:', json.error);
      } else {
        refreshAlerts();
        clearSelection();
      }
    } catch (err) {
      console.error('Bulk delete exception:', err);
    } finally {
      setBulkDeleting(false);
    }
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-primary border-t-transparent"></div>
          <span className="text-muted-foreground">Loading alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <div className="px-4 py-8 mx-auto max-w-7xl md:px-6 md:py-12">
          <PageHeader title="Alert Management" subtitle="Monitor and manage emergency alerts" />

          <div className="grid grid-cols-2 gap-3 mb-8 md:grid-cols-5 md:gap-4">
            {[
              {
                key: 'total',
                label: 'Total',
                value: stats.total,
                color:
                  'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-700 dark:text-slate-200',
                icon: Building,
              },
              {
                key: 'low',
                label: 'Low',
                value: stats.low,
                color:
                  'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 text-blue-700 dark:text-blue-200',
                icon: ChevronsDown,
              },
              {
                key: 'medium',
                label: 'Medium',
                value: stats.medium,
                color:
                  'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 text-amber-700 dark:text-amber-200',
                icon: UsersRound,
              },
              {
                key: 'high',
                label: 'High',
                value: stats.high,
                color:
                  'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 text-orange-700 dark:text-orange-200',
                icon: ChevronsUp,
              },
              {
                key: 'critical',
                label: 'Critical',
                value: stats.critical,
                color:
                  'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 text-red-700 dark:text-red-200',
                icon: CloudAlert,
              },
            ].map((stat) => (
              <div
                key={stat.key}
                className={`bg-linear-to-br ${stat.color} rounded-lg p-4 md:p-6 border border-white/50 dark:border-white/10 transition-transform duration-200 hover:scale-105`}
              >
                <div className="mb-1 text-xl font-bold md:text-2xl">{stat.value}</div>
                <div className="text-xs font-medium md:text-sm opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute w-4 h-4 -translate-y-1/2 left-4 top-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search alerts by title or content..."
                  className="h-10 pl-10 border rounded-lg bg-card border-input"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Filter and Create Button */}
              <div className="flex items-center gap-3">
                <Select value={alertLevelFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[140px] md:w-40 bg-card border border-input rounded-lg h-10">
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

                <Button onClick={openCreateModal} className="gap-2 rounded-lg" size="default">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Alert</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>

            {/* Results Info */}
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAlerts.length)} of{' '}
              {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
            </div>
          </div>

          <div className="overflow-hidden border rounded-lg shadow-sm bg-card border-border">
            {/* Mobile View */}
            <div className="block divide-y md:hidden divide-border">
              {paginatedAlerts.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="mb-1 font-medium text-foreground">
                    {alerts.length === 0 ? 'No alerts yet' : 'No alerts found'}
                  </p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {alerts.length === 0
                      ? 'Create your first alert to get started'
                      : 'Try adjusting your search or filter'}
                  </p>
                  {alerts.length === 0 && (
                    <Button onClick={openCreateModal} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Alert
                    </Button>
                  )}
                </div>
              ) : (
                paginatedAlerts.map((alert) => {
                  const config =
                    alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig];
                  const LevelIcon = config?.icon || Bell;
                  return (
                    <div
                      key={alert.id}
                      className="p-4 transition-colors duration-200 hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${config?.dotColor}`}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-1 font-semibold truncate text-foreground">
                            {alert.title || 'Untitled Alert'}
                          </h3>
                          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                            {alert.content || 'No content'}
                          </p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge
                              variant="secondary"
                              className={alertLevelColor(alert.alert_level)}
                            >
                              <LevelIcon className="w-3 h-3 mr-1" />
                              {config?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(alert)}
                            className="w-8 h-8 rounded-md hover:bg-muted"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAlertSheet(alert)}
                            className="w-8 h-8 rounded-md hover:bg-muted"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
                            className="w-8 h-8 rounded-md hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              {paginatedAlerts.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="mb-1 font-medium text-foreground">
                    {alerts.length === 0 ? 'No alerts yet' : 'No alerts found'}
                  </p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {alerts.length === 0
                      ? 'Create your first alert to get started'
                      : 'Try adjusting your search or filter'}
                  </p>
                  {alerts.length === 0 && (
                    <Button onClick={openCreateModal} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Alert
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-2">
                      {selectedIds.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSelection}
                          disabled={bulkDeleting}
                          className="h-8"
                        >
                          Clear
                        </Button>
                      )}
                      {selectedIds.size > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          disabled={selectedIds.size === 0 || bulkDeleting}
                          className="h-8 m-2"
                        >
                          {bulkDeleting ? (
                            <span className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-current rounded-full border-t-transparent animate-spin" />
                              Deleting...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-8">
                          <button
                            onClick={toggleSelectAll}
                            className="h-4 w-4 rounded border border-border flex items-center justify-center text-[10px] bg-background hover:bg-muted"
                            aria-label="Select all"
                          >
                            {selectedIds.size === paginatedAlerts.length &&
                            paginatedAlerts.length > 0
                              ? '✓'
                              : ''}
                          </button>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">Title</TableHead>
                        <TableHead className="font-semibold text-foreground">Content</TableHead>
                        <TableHead className="font-semibold text-foreground">Level</TableHead>
                        <TableHead className="font-semibold text-foreground">Created</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-right text-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAlerts.map((alert) => {
                        const config =
                          alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig];
                        const LevelIcon = config?.icon || Bell;
                        return (
                          <TableRow
                            key={alert.id}
                            className="transition-colors duration-200 border-border hover:bg-muted/50"
                          >
                            <TableCell className="w-8">
                              <button
                                onClick={() => toggleSelect(alert.id)}
                                className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                                  selectedIds.has(alert.id)
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-border bg-background hover:bg-muted'
                                }`}
                                aria-label={
                                  selectedIds.has(alert.id) ? 'Unselect alert' : 'Select alert'
                                }
                              >
                                {selectedIds.has(alert.id) ? '✓' : ''}
                              </button>
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${config?.dotColor}`} />
                                <span className="max-w-[200px] truncate">
                                  {alert.title || 'Untitled Alert'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="max-w-[300px] truncate">
                                {alert.content || 'No content'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={alertLevelColor(alert.alert_level)}
                              >
                                <LevelIcon className="w-3 h-3 mr-1" />
                                {config?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(alert.created_at).toLocaleDateString()} ·{' '}
                              {new Date(alert.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
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
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(alert)}
                                  className="w-8 h-8 rounded-md hover:bg-muted"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openAlertSheet(alert)}
                                  className="w-8 h-8 rounded-md hover:bg-muted"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(alert.id)}
                                  className="w-8 h-8 rounded-md hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          </div>

          {filteredAlerts.length > 0 && totalPages > 1 && (
            <div className="flex flex-col gap-4 mt-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="gap-1 rounded-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && array[index - 1] < page - 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0 rounded-md"
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
                  className="gap-1 rounded-md"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>

        {/* Modal and Sheet */}
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
            } catch {}
          }}
          alert={editingAlert}
          onSave={
            editingAlert ? (data: AlertUpdate) => handleUpdate(editingAlert.id, data) : handleCreate
          }
          loading={modalLoading}
        />

        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) setSelectedAlert(null);
          }}
        >
          <SheetContent className="sm:max-w-2xl">
            {selectedAlert && (
              <div className="flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle>Alert Details</SheetTitle>
                  <SheetDescription>Complete information about this alert</SheetDescription>
                </SheetHeader>

                <div className="flex-1 py-6 space-y-6 overflow-auto">
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      ID
                    </Label>
                    <div className="mt-2 font-mono text-sm break-all">{selectedAlert.id}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Title
                    </Label>
                    <div className="mt-2 font-medium text-foreground">
                      {selectedAlert.title || 'Untitled Alert'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Content
                    </Label>
                    <div className="mt-2 text-sm whitespace-pre-wrap text-foreground">
                      {selectedAlert.content || 'No content'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Level
                    </Label>
                    <div className="mt-2">
                      <Badge className={alertLevelColor(selectedAlert.alert_level)}>
                        {
                          alertLevelConfig[
                            selectedAlert.alert_level as keyof typeof alertLevelConfig
                          ]?.label
                        }
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Status
                    </Label>
                    <div className="mt-2">
                      <Badge variant={selectedAlert.deleted_at ? 'destructive' : 'default'}>
                        {selectedAlert.deleted_at ? 'Deleted' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Created
                    </Label>
                    <div className="mt-2 text-sm text-foreground">
                      {new Date(selectedAlert.created_at).toLocaleDateString()} at{' '}
                      {new Date(selectedAlert.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
  onSave: (data: AlertCreateRequest | AlertUpdate) => void;
  loading?: boolean;
}

function AlertModal({ isOpen, onClose, alert, onSave, loading = false }: AlertModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    alert_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notification_method: 'app_push' as 'app_push' | 'app' | 'sms' | 'both',
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
      } catch {}
    }

    if (alert) {
      setFormData({
        title: alert.title || '',
        content: alert.content || '',
        alert_level: (alert.alert_level as 'low' | 'medium' | 'high' | 'critical') || 'medium',
        notification_method: 'app_push', // Default for existing alerts
      });
    } else {
      setFormData({
        title: '',
        content: '',
        alert_level: 'medium',
        notification_method: 'app_push', // Default for new alerts
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
    } catch {}
  }, [formData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>{alert ? 'Edit Alert' : 'Create New Alert'}</DialogTitle>
          <DialogDescription>
            {alert
              ? 'Update the alert information below.'
              : 'Fill in the details to create a new emergency alert.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title" className="text-sm font-semibold">
              Alert Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="E.g., System Maintenance, Security Breach"
              required
              disabled={loading}
              className="mt-2 bg-background"
            />
          </div>

          <div>
            <Label htmlFor="content" className="text-sm font-semibold">
              Alert Content *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Provide detailed information about the alert..."
              required
              rows={5}
              disabled={loading}
              className="mt-2 resize-none bg-background"
            />
          </div>

          <div>
            <Label htmlFor="alert_level" className="text-sm font-semibold">
              Alert Level
            </Label>
            <HeroSelect
              aria-label="Alert Level"
              labelPlacement="outside"
              className="max-w-xs mt-2"
              selectedKeys={[formData.alert_level]}
              isDisabled={loading}
              onSelectionChange={(keys: Set<React.Key> | 'all') => {
                if (keys === 'all') return; // not expected in single-select, but guard anyway
                const value = Array.from(keys)[0] as 'low' | 'medium' | 'high' | 'critical';
                setFormData((prev) => ({ ...prev, alert_level: value }));
              }}
            >
              <HeroSelectItem key="low">Low Priority</HeroSelectItem>
              <HeroSelectItem key="medium">Medium Priority</HeroSelectItem>
              <HeroSelectItem key="high">High Priority</HeroSelectItem>
              <HeroSelectItem key="critical">Critical Priority</HeroSelectItem>
            </HeroSelect>
          </div>

          <div>
            <Label htmlFor="notification_method" className="text-sm font-semibold">
              Notification Method
            </Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { value: 'app_push', label: 'Push + Email', icon: Rocket },
                { value: 'app', label: 'Email', icon: Mail },
                { value: 'sms', label: 'SMS', icon: Phone },
                { value: 'both', label: 'All', icon: Megaphone },
              ].map((m) => {
                const active = formData.notification_method === m.value;
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        notification_method: m.value as 'app_push' | 'app' | 'sms' | 'both',
                      }))
                    }
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 ${
                      active
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-muted text-foreground/70 border-border hover:bg-primary/10'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-primary'}`} />
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div className="p-3 mt-3 text-xs leading-relaxed rounded-md bg-muted/40 text-muted-foreground">
              {formData.notification_method === 'app_push' && (
                <span>Push + email: fast delivery with inbox backup.</span>
              )}
              {formData.notification_method === 'app' && (
                <span>Email only: slower but reaches inbox; good for summaries.</span>
              )}
              {formData.notification_method === 'sms' && (
                <span>SMS only: use for urgent offline scenarios (may incur cost).</span>
              )}
              {formData.notification_method === 'both' && (
                <span>All methods: maximum reach (push, email, SMS) for critical events.</span>
              )}
            </div>
            <p className="text-[10px] mt-2 text-muted-foreground italic">
              Tip: Prefer Push + Email for most alerts. Reserve SMS for urgent or life-safety cases.
            </p>
          </div>

          <DialogFooter className="gap-3 pt-4 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="bg-transparent rounded-md"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2 rounded-md">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current rounded-full animate-spin border-t-transparent"></div>
                  {alert ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
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
