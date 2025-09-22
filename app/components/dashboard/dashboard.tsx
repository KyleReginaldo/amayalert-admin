'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  Clock,
  Download,
  MapPin,
  MoreVertical,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeAlerts: number;
  evacuationCenters: number;
  criticalAlerts: number;
  userGrowth: number;
  alertsToday: number;
  availableCenters: number;
  responseTime: string;
}

const sampleStats: DashboardStats = {
  totalUsers: 1247,
  activeAlerts: 8,
  evacuationCenters: 4,
  criticalAlerts: 1,
  userGrowth: 12.5,
  alertsToday: 3,
  availableCenters: 2,
  responseTime: '4.2 min',
};

const recentAlerts = [
  {
    id: 1,
    title: 'Flood warning issued for Riverside District',
    type: 'Emergency',
    severity: 'Critical',
    location: 'Riverside District',
    time: '2 hours ago',
    user: 'Emergency Team',
    status: 'Active',
  },
  {
    id: 2,
    title: 'Weather advisory for heavy rainfall',
    type: 'Warning',
    severity: 'High',
    location: 'Citywide',
    time: '6 hours ago',
    user: 'Weather Service',
    status: 'Active',
  },
  {
    id: 3,
    title: 'Traffic update on Main Highway',
    type: 'Information',
    severity: 'Medium',
    location: 'Main Highway',
    time: '8 hours ago',
    user: 'Traffic Department',
    status: 'Resolved',
  },
  {
    id: 4,
    title: 'Power outage resolved in Downtown',
    type: 'Information',
    severity: 'Low',
    location: 'Downtown',
    time: '12 hours ago',
    user: 'Utilities Department',
    status: 'Resolved',
  },
];

const recentUsers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    role: 'User',
    location: 'Downtown',
    joinDate: '2025-09-20',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    role: 'Admin',
    location: 'Riverside',
    joinDate: '2025-09-19',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Robert Johnson',
    email: 'robert.j@email.com',
    role: 'User',
    location: 'Central',
    joinDate: '2025-09-18',
    status: 'Pending',
  },
];

const evacuationCenters = [
  {
    id: 1,
    name: 'Community Center Plaza',
    status: 'Open',
    capacity: 500,
    current: 145,
    location: 'Downtown',
  },
  {
    id: 2,
    name: 'Riverside Elementary',
    status: 'Full',
    capacity: 200,
    current: 200,
    location: 'Riverside',
  },
  {
    id: 3,
    name: 'Municipal Gymnasium',
    status: 'Maintenance',
    capacity: 300,
    current: 0,
    location: 'Central',
  },
  {
    id: 4,
    name: 'Barangay Hall North',
    status: 'Open',
    capacity: 150,
    current: 67,
    location: 'North District',
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'resolved':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'open':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'full':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'user':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-full">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground text-balance">
                Emergency Command Center
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Real-time monitoring and response coordination
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download size={16} />
                Export Report
              </Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Activity size={16} />
                Live Monitor
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-chart-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-5 w-5 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-card-foreground">
                  {sampleStats.totalUsers.toLocaleString()}
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-chart-1 mr-1" />
                  <span className="text-chart-1 font-medium">+{sampleStats.userGrowth}%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Alerts
                </CardTitle>
                <Bell className="h-5 w-5 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-card-foreground">
                  {sampleStats.activeAlerts}
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-chart-2 mr-1" />
                  <span className="text-chart-2 font-medium">
                    {sampleStats.criticalAlerts} critical
                  </span>
                  <span className="text-muted-foreground ml-1">requiring attention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Evacuation Centers
                </CardTitle>
                <Building2 className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-card-foreground">
                  {sampleStats.evacuationCenters}
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <Shield className="h-4 w-4 text-chart-1 mr-1" />
                  <span className="text-chart-1 font-medium">
                    {sampleStats.availableCenters} operational
                  </span>
                  <span className="text-muted-foreground ml-1">and ready</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Response Time
                </CardTitle>
                <Clock className="h-5 w-5 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-card-foreground">
                  {sampleStats.responseTime}
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-chart-1 mr-1" />
                  <span className="text-chart-1 font-medium">12% faster</span>
                  <span className="text-muted-foreground ml-1">than target</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Recent Alerts Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-chart-2" />
                Recent Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Alert Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-card-foreground truncate max-w-48">
                            {alert.title}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {alert.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{alert.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-chart-4" />
                Recent Users
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-card-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" />
              Evacuation Centers Status
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Manage Centers
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Center Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Occupancy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {evacuationCenters.map((center) => (
                    <tr key={center.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-secondary" />
                          <span className="font-medium text-card-foreground">{center.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getStatusColor(center.status)}>
                          {center.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                center.status === 'Full'
                                  ? 'bg-chart-2'
                                  : center.current > center.capacity * 0.8
                                  ? 'bg-chart-3'
                                  : center.current > 0
                                  ? 'bg-chart-4'
                                  : 'bg-chart-1'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (center.current / center.capacity) * 100,
                                  100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-card-foreground min-w-[3rem]">
                            {center.current}/{center.capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-card-foreground">
                        {center.capacity}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {center.location}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
