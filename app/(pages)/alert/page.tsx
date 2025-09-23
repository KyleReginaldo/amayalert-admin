'use client';

import alertsAPI, { Alert } from '@/app/lib/alerts-api';
import { useData } from '@/app/providers/data-provider';
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
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Bell, Clock, Edit, Plus, Save, Search, Trash2 } from 'lucide-react';
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span>Loading alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="block md:hidden min-h-screen bg-gray-50">
        {/* Mobile Content */}
        <div className="p-4">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search alerts..."
              className="pl-10 bg-gray-50 border-0 rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Alert Button */}
          <div className="mb-3">
            <Button onClick={openCreateModal} className="w-full rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs text-red-600">Critical</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-orange-600">{stats.high}</div>
              <div className="text-xs text-orange-600">High</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center justify-between mb-3">
            <Select value={alertLevelFilter} onValueChange={setAlertLevelFilter}>
              <SelectTrigger className="w-[120px] h-8 rounded-full bg-gray-100 border-0">
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
          </div>

          {/* Enhanced Mobile Card List */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const LevelIcon =
                alertLevelConfig[alert.alert_level as keyof typeof alertLevelConfig]?.icon || Bell;
              return (
                <Card
                  key={alert.id}
                  className="bg-white rounded-xl shadow-sm border-0 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
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
                        <p className="text-sm text-gray-500 mb-2">
                          {alert.content || 'No content'}
                        </p>
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
                          onClick={() => handleDelete(alert.id)}
                          className="h-8 w-8 rounded-full text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                      <span>
                        {new Date(alert.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>{alert.deleted_at ? 'Deleted' : 'Active'}</span>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No alerts found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          {/* ...existing code... (keep the current desktop layout as is) */}
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

          {/* ...existing code... (rest of the desktop layout) */}
          {/* Statistics Cards, Filters, Table, Pagination, Modal, etc. */}
          {/* ...existing code... */}
        </div>
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
    </>
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
