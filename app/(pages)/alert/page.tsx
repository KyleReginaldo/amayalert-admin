'use client';

import alertsAPI, { Alert } from '@/app/lib/alerts-api';
import { useData } from '@/app/providers/data-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertTriangle,
  Bell,
  Clock,
  Edit,
  Eye,
  Filter,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Use the API Alert type directly

// Configuration for alert levels
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
  // Get data from context
  const { alerts, alertsLoading, refreshAlerts, addAlert, updateAlert, removeAlert } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [alertLevelFilter, setAlertLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load alerts on component mount if needed
  useEffect(() => {
    if (alerts.length === 0 && !alertsLoading) {
      refreshAlerts();
    }
  }, [alerts.length, alertsLoading, refreshAlerts]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreate = async (alertData: Record<string, any>) => {
    try {
      setModalLoading(true);
      const response = await alertsAPI.createAlert(alertData);
      if (response.success && response.data) {
        addAlert(response.data);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (id: number, alertData: Record<string, any>) => {
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
    console.log('Opening create modal'); // Debug log
    setEditingAlert(null);
    setIsModalOpen(true);
  };

  const openEditModal = (alert: Alert) => {
    console.log('Opening edit modal for alert:', alert.id); // Debug log
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  // Filter alerts based on search and alert level
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAlertLevel = alertLevelFilter === 'all' || alert.alert_level === alertLevelFilter;
    return matchesSearch && matchesAlertLevel;
  });

  const totalPages = Math.ceil(filteredAlerts.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + entriesPerPage);

  const alertLevelColor = (level: string | null) =>
    alertLevelConfig[level as keyof typeof alertLevelConfig]?.color || '';

  // Calculate statistics
  const stats = {
    total: alerts.length,
    low: alerts.filter((a) => a.alert_level === 'low').length,
    medium: alerts.filter((a) => a.alert_level === 'medium').length,
    high: alerts.filter((a) => a.alert_level === 'high').length,
    critical: alerts.filter((a) => a.alert_level === 'critical').length,
  };

  if (alertsLoading && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading alerts...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Alert Management
                </h1>
                <p className="text-muted-foreground">
                  Create, manage, and monitor emergency alerts and notifications
                </p>
              </div>
            </div>
          </div>
          <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Alert</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-muted-foreground">Urgent attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
              <p className="text-xs text-muted-foreground">Medium priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low</CardTitle>
              <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
              <p className="text-xs text-muted-foreground">Low priority</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label htmlFor="search">Search alerts</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="alert_level">Alert Level</Label>
                <Select value={alertLevelFilter} onValueChange={setAlertLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-32">
                <Label htmlFor="entries">Show</Label>
                <Select
                  value={entriesPerPage.toString()}
                  onValueChange={(value) => setEntriesPerPage(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Alert Details</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAlerts.map((alert) => {
                    const LevelIcon =
                      alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig]?.icon ||
                      Bell;
                    return (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">#{alert.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <LevelIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{alert.title || 'Untitled Alert'}</div>
                              <div className="text-sm text-muted-foreground">Alert #{alert.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={alertLevelColor(alert.alert_level)}>
                            <LevelIcon className="h-3 w-3 mr-1" />
                            {alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig]
                              ?.label || alert.alert_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate" title={alert.content || ''}>
                            {alert.content || 'No content'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="text-sm">
                              <div>{new Date(alert.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(alert.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.deleted_at ? (
                            <Badge variant="destructive">Deleted</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(alert)}
                              title="Edit Alert"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(alert.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete Alert"
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

            {paginatedAlerts.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || alertLevelFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first alert to get started'}
                </p>
                {!searchTerm && alertLevelFilter === 'all' && (
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(startIndex + entriesPerPage, filteredAlerts.length)}
              </span>{' '}
              of <span className="font-medium">{filteredAlerts.length}</span> results
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
      </div>

      {/* Centralized Modal - Available for both mobile and desktop */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAlert(null);
        }}
        alert={editingAlert}
        onSave={
          editingAlert
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data: Record<string, any>) => handleUpdate(editingAlert.id, data)
            : handleCreate
        }
        loading={modalLoading}
      />
    </div>
  );
}

// Modal component for creating/editing alerts
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: Record<string, any>) => void;
  loading?: boolean;
}

function AlertModal({ isOpen, onClose, alert, onSave, loading = false }: AlertModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    alert_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });

  useEffect(() => {
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
  }, [alert]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
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
              <SelectTrigger>
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
