'use client';

import { useData } from '@/app/providers/data-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  Bell,
  Building2,
  Clock,
  Download,
  Loader2,
  MapPin,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const Dashboard = () => {
  // Get data from context instead of local state
  const {
    alerts,
    evacuationCenters,
    users,
    userStats,
    alertsLoading,
    evacuationLoading,
    usersLoading,
    refreshAll,
  } = useData();

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Overall loading state
  const loading = alertsLoading || evacuationLoading || usersLoading;

  // Simple PDF export functionality
  const exportToPDF = () => {
    try {
      setIsExporting(true);

      const timestamp = new Date().toLocaleString();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Amayalert Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .section { margin: 30px 0; }
            .section h2 { font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .stat { padding: 15px; border: 1px solid #ddd; }
            .stat-value { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .stat-label { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Amayalert Report</h1>
            <p>Generated on: ${timestamp}</p>
          </div>

          <div class="section">
            <h2>Overview Statistics</h2>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${stats.totalUsers.toLocaleString()}</div>
                <div class="stat-label">Total Users</div>
              </div>
              <div class="stat">
                <div class="stat-value">${stats.activeAlerts}</div>
                <div class="stat-label">Active Alerts</div>
              </div>
              <div class="stat">
                <div class="stat-value">${stats.evacuationCenters}</div>
                <div class="stat-label">Evacuation Centers</div>
              </div>
              <div class="stat">
                <div class="stat-value">${stats.criticalAlerts}</div>
                <div class="stat-label">Critical Alerts</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Recent Alerts</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Level</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${recentAlerts
                  .map(
                    (alert) => `
                  <tr>
                    <td>#${alert.id}</td>
                    <td>${alert.title}</td>
                    <td>${alert.severity}</td>
                    <td>${alert.time}</td>
                    <td>${alert.status}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Recent Users</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                ${recentUsers
                  .map(
                    (user) => `
                  <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${new Date(user.joinDate).toLocaleDateString()}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Evacuation Centers</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Occupancy</th>
                  <th>Capacity</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                ${evacuationCenters
                  .map(
                    (center) => `
                  <tr>
                    <td>${center.name}</td>
                    <td>${(center.status || 'closed').toUpperCase()}</td>
                    <td>${center.current_occupancy || 0}</td>
                    <td>${center.capacity || 0}</td>
                    <td>${center.address}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle export action
  const handleExport = () => {
    exportToPDF();
  };

  // Auto-refresh data when component mounts
  useEffect(() => {
    if (alerts.length === 0 && evacuationCenters.length === 0 && users.length === 0) {
      refreshAll();
    }
  }, [alerts, evacuationCenters, users, refreshAll]);

  // Calculate statistics from cached data
  const stats = useMemo(
    () => ({
      totalUsers: userStats.totalUsers,
      activeAlerts: alerts.filter(
        (alert) => !alert.deleted_at, // Active alerts are not deleted
      ).length,
      evacuationCenters: evacuationCenters.length,
      criticalAlerts: alerts.filter((alert) => alert.alert_level === 'critical').length,
      userGrowth: userStats.userGrowth,
      alertsToday: alerts.filter(
        (alert) =>
          alert.created_at &&
          new Date(alert.created_at).toDateString() === new Date().toDateString(),
      ).length,
      availableCenters: evacuationCenters.filter((center) => center.status === 'open').length,
      responseTime: '4.2 min',
    }),
    [alerts, evacuationCenters, userStats],
  );

  // Prepare recent data for display
  const recentAlerts = alerts.slice(0, 5).map((alert) => ({
    id: alert.id,
    title: alert.title || 'Untitled Alert',
    severity: alert.alert_level || 'medium',
    time: new Date(alert.created_at).toLocaleTimeString(),
    status: alert.deleted_at ? 'deleted' : 'active', // Use deleted_at to determine status
  }));

  const recentUsers = users.slice(0, 5).map((user) => ({
    id: user.id,
    name: user.full_name || 'Unknown User',
    email: user.email,
    role: user.role || 'user',
    joinDate: user.created_at,
    status: 'active', // Default since no status field
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Real-time overview of emergency management system
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />+{stats.userGrowth}% this month
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Alerts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeAlerts}</p>
                  <p className="text-sm text-orange-600 flex items-center mt-1">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {stats.criticalAlerts} critical
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Evacuation Centers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.evacuationCenters}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <Building2 className="h-3 w-3 mr-1" />
                    {stats.availableCenters} operational
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.responseTime}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    12% faster than target
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Alerts */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Bell className="h-5 w-5 mr-2 text-orange-600" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : alert.severity === 'high'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.status}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent users</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evacuation Centers Status */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Building2 className="h-5 w-5 mr-2 text-green-600" />
              Evacuation Centers Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evacuationCenters.length > 0 ? (
                evacuationCenters.slice(0, 5).map((center) => (
                  <div
                    key={center.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{center.name}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {center.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Occupancy</p>
                        <p className="text-sm font-medium">
                          {center.current_occupancy || 0}/{center.capacity || 0}
                        </p>
                      </div>
                      <Badge
                        variant={
                          center.status === 'open'
                            ? 'default'
                            : center.status === 'full'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {center.status || 'closed'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-8 w-8 mx-auto mb-2" />
                  <p>No evacuation centers found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
