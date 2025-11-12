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
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground">Loading alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <PageHeader title="Alert Management" subtitle="Monitor and manage emergency alerts" />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4 mb-8">
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
                className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 md:p-6 border border-white/50 dark:border-white/10 transition-transform duration-200 hover:scale-105`}
              >
                <div className="text-xl md:text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm font-medium opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search alerts by title or content..."
                  className="pl-10 bg-card border border-input rounded-lg h-10"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Filter and Create Button */}
              <div className="flex gap-3 items-center">
                <Select value={alertLevelFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[140px] md:w-[160px] bg-card border border-input rounded-lg h-10">
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
                  <Plus className="h-4 w-4" />
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

          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-border">
              {paginatedAlerts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">
                    {alerts.length === 0 ? 'No alerts yet' : 'No alerts found'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alerts.length === 0
                      ? 'Create your first alert to get started'
                      : 'Try adjusting your search or filter'}
                  </p>
                  {alerts.length === 0 && (
                    <Button onClick={openCreateModal} className="gap-2">
                      <Plus className="h-4 w-4" />
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
                      className="p-4 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`h-3 w-3 rounded-full mt-1.5 flex-shrink-0 ${config?.dotColor}`}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate mb-1">
                            {alert.title || 'Untitled Alert'}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {alert.content || 'No content'}
                          </p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge
                              variant="secondary"
                              className={alertLevelColor(alert.alert_level)}
                            >
                              <LevelIcon className="h-3 w-3 mr-1" />
                              {config?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(alert)}
                            className="h-8 w-8 rounded-md hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAlertSheet(alert)}
                            className="h-8 w-8 rounded-md hover:bg-muted"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
                            className="h-8 w-8 rounded-md hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
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
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">
                    {alerts.length === 0 ? 'No alerts yet' : 'No alerts found'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alerts.length === 0
                      ? 'Create your first alert to get started'
                      : 'Try adjusting your search or filter'}
                  </p>
                  {alerts.length === 0 && (
                    <Button onClick={openCreateModal} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Alert
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground">Title</TableHead>
                      <TableHead className="font-semibold text-foreground">Content</TableHead>
                      <TableHead className="font-semibold text-foreground">Level</TableHead>
                      <TableHead className="font-semibold text-foreground">Created</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">
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
                          className="border-border hover:bg-muted/50 transition-colors duration-200"
                        >
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
                              <LevelIcon className="h-3 w-3 mr-1" />
                              {config?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
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
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(alert)}
                                className="h-8 w-8 rounded-md hover:bg-muted"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAlertSheet(alert)}
                                className="h-8 w-8 rounded-md hover:bg-muted"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(alert.id)}
                                className="h-8 w-8 rounded-md hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
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
              )}
            </div>
          </div>

          {filteredAlerts.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="gap-1 rounded-md"
                >
                  <ChevronLeft className="h-4 w-4" />
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
                  <ChevronRight className="h-4 w-4" />
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
              <div className="flex h-full flex-col">
                <SheetHeader>
                  <SheetTitle>Alert Details</SheetTitle>
                  <SheetDescription>Complete information about this alert</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-auto space-y-6 py-6">
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      ID
                    </Label>
                    <div className="font-mono text-sm break-all mt-2">{selectedAlert.id}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Title
                    </Label>
                    <div className="font-medium text-foreground mt-2">
                      {selectedAlert.title || 'Untitled Alert'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Content
                    </Label>
                    <div className="whitespace-pre-wrap text-sm text-foreground mt-2">
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
                    <div className="text-sm text-foreground mt-2">
                      {new Date(selectedAlert.created_at).toLocaleDateString()} at{' '}
                      {new Date(selectedAlert.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
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
              className="mt-2 bg-background resize-none"
            />
          </div>

          <div>
            <Label htmlFor="alert_level" className="text-sm font-semibold">
              Alert Level
            </Label>
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
              <SelectTrigger className="mt-2 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="critical">Critical Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notification_method" className="text-sm font-semibold">
              Notification Method
            </Label>
            <div className="mt-2 space-y-3">
              {[
                {
                  value: 'app_push',
                  title: 'Push + Email',
                  description: 'Instant notifications + email backup',
                  icon: Rocket,
                  badge: 'Recommended',
                  color: 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800',
                  selectedColor: 'border-blue-400 bg-blue-100 dark:bg-blue-900',
                },
                {
                  value: 'app',
                  title: 'Email Only',
                  description: 'Traditional email notifications',
                  icon: Mail,
                  badge: null,
                  color: 'border-gray-200 bg-gray-50 dark:bg-gray-950 dark:border-gray-800',
                  selectedColor: 'border-gray-400 bg-gray-100 dark:bg-gray-900',
                },
                {
                  value: 'sms',
                  title: 'SMS Only',
                  description: 'For offline users (charges apply)',
                  icon: Phone,
                  badge: 'Offline Users',
                  color: 'border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800',
                  selectedColor: 'border-orange-400 bg-orange-100 dark:bg-orange-900',
                },
                {
                  value: 'both',
                  title: 'All Methods',
                  description: 'Push + Email + SMS (maximum reach)',
                  icon: Megaphone,
                  badge: 'Maximum Reach',
                  color: 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800',
                  selectedColor: 'border-green-400 bg-green-100 dark:bg-green-900',
                },
              ].map((method) => (
                <div
                  key={method.value}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      notification_method: method.value as 'app_push' | 'app' | 'sms' | 'both',
                    }))
                  }
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:scale-[1.02] ${
                    formData.notification_method === method.value
                      ? method.selectedColor
                      : method.color
                  } ${loading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {
                      <method.icon className="h-[20px] w-[20px] text-foreground/70 mt-1 flex-shrink-0" />
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{method.title}</h4>
                        {method.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.notification_method === method.value
                          ? 'border-primary bg-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {formData.notification_method === method.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              note: Push notifications are instant and free. Use SMS for critical emergencies only.
            </p>
          </div>

          <DialogFooter className="gap-3 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-md bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-md gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  {alert ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
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
