'use client';

import { PageHeader } from '@/app/components/page-header';
import { getActivityStatColor } from '@/app/core/utils/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tables } from '@/database.types';
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Filter,
  LifeBuoy,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type Log = Tables<'logs'> & {
  users: {
    id: string;
    full_name: string;
    email: string | null;
    role: string | null;
  } | null;
};

type User = Tables<'users'>;

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchLogs();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, dateRange]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Filter to show only admins and sub_admins
        const adminUsers = data.data?.filter(
          (u: User) => u.role === 'admin' || u.role === 'sub_admin',
        );
        setUsers(adminUsers || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '500' });

      if (selectedUser !== 'all') {
        params.append('userId', selectedUser);
      }

      if (dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();

        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }

        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleExport = () => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toLocaleString();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Activity Logs Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .role-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .role-admin { background-color: #fee2e2; color: #991b1b; }
            .role-sub_admin { background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Activity Logs Report</h1>
            <p>Generated on: ${timestamp}</p>
            <p>Total Logs: ${filteredLogs.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">ID</th>
                <th style="width: 150px;">Date & Time</th>
                <th style="width: 120px;">User</th>
                <th style="width: 80px;">Role</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs
                .map(
                  (log) => `
                <tr>
                  <td>#${log.id}</td>
                  <td>${new Date(log.created_at).toLocaleString()}</td>
                  <td>${log.users?.full_name || 'System'}</td>
                  <td>
                    <span class="role-badge role-${log.users?.role || 'system'}">
                      ${log.users?.role?.toUpperCase() || 'SYSTEM'}
                    </span>
                  </td>
                  <td>${log.content}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
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

  const filteredLogs = logs.filter(
    (log) =>
      log.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getActivityTypeColor = (content: string) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('create')) return 'bg-green-100 text-green-800';
    if (lowerContent.includes('update')) return 'bg-blue-100 text-blue-800';
    if (lowerContent.includes('delete')) return 'bg-red-100 text-red-800';
    if (lowerContent.includes('view')) return 'bg-gray-100 text-gray-800';
    return 'bg-purple-100 text-purple-800';
  };

  const getActivityIcon = (content: string) => {
    const lowerContent = content.toLowerCase();
    const iconClass = 'w-4 h-4';

    if (lowerContent.includes('[alert]'))
      return <AlertTriangle className={`${iconClass} text-orange-600`} />;
    if (lowerContent.includes('[evacuation]'))
      return <Building2 className={`${iconClass} text-blue-600`} />;
    if (lowerContent.includes('[rescue]'))
      return <LifeBuoy className={`${iconClass} text-red-600`} />;
    if (lowerContent.includes('[user]'))
      return <Users className={`${iconClass} text-purple-600`} />;
    if (lowerContent.includes('[admin]')) return <Shield className={`${iconClass} text-red-700`} />;
    if (lowerContent.includes('[report]'))
      return <FileText className={`${iconClass} text-gray-600`} />;
    if (lowerContent.includes('[chat]'))
      return <MessageCircle className={`${iconClass} text-green-600`} />;
    if (lowerContent.includes('[setting]'))
      return <Settings className={`${iconClass} text-gray-700`} />;
    return <FileText className={`${iconClass} text-gray-500`} />;
  };

  const toggleLogExpansion = (logId: number) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const parseLogDetails = (content: string) => {
    // Extract details after the pipe separator
    const parts = content.split(' | ');
    if (parts.length > 1) {
      // First part is the main message, rest are details
      const mainMessage = parts[0];
      const details = parts.slice(1).map((detail) => {
        const [key, ...valueParts] = detail.split(': ');
        return {
          key: key.trim(),
          value: valueParts.join(': ').trim(),
        };
      });
      return { mainMessage, details };
    }
    return { mainMessage: content, details: [] };
  };

  const isDeleteAction = (content: string) => {
    return content?.toLowerCase().includes('delete');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading activity logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50 md:bg-background md:p-6">
      <div className="mx-auto space-y-6 max-w-7xl">
        <PageHeader
          title="Activity Logs"
          subtitle="Monitor all admin and sub-admin activities"
          action={
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className={`p-4 rounded-lg ${getActivityStatColor('total')}`}>
            <div className="text-2xl font-bold ">{logs.length}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </div>
          <div className={`p-4 rounded-lg ${getActivityStatColor('create')}`}>
            <div className="text-2xl font-bold ">
              {logs.filter((log) => log.content?.toLowerCase().includes('create')).length}
            </div>
            <div className="text-sm text-gray-600">Create Actions</div>
          </div>
          <div className={`p-4 rounded-lg ${getActivityStatColor('update')}`}>
            <div className="text-2xl font-bold ">
              {logs.filter((log) => log.content?.toLowerCase().includes('update')).length}
            </div>
            <div className="text-sm ">Update Actions</div>
          </div>
          <div className={`p-4 rounded-lg ${getActivityStatColor('delete')}`}>
            <div className="text-2xl font-bold ">
              {logs.filter((log) => log.content?.toLowerCase().includes('delete')).length}
            </div>
            <div className="text-sm text-gray-600">Delete Actions</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <Input
              type="text"
              placeholder="Search activities or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-500">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead className="w-[100px]">Role</TableHead>
                    <TableHead>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const { mainMessage, details } = parseLogDetails(log.content || '');
                    const hasDetails = details.length > 0;
                    const isExpanded = expandedLogs.has(log.id);
                    const showExpandButton = hasDetails && isDeleteAction(log.content || '');

                    return (
                      <>
                        <TableRow key={log.id}>
                          <TableCell className="font-medium text-gray-600">#{log.id}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                                <span className="text-sm font-medium text-gray-600">
                                  {log.users?.full_name?.charAt(0).toUpperCase() || 'S'}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {log.users?.full_name || 'System'}
                                </span>
                                {log.users?.email && (
                                  <span className="text-xs text-gray-500">{log.users.email}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                log.users?.role === 'admin'
                                  ? 'bg-red-100 text-red-800'
                                  : log.users?.role === 'sub_admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {log.users?.role?.toUpperCase() || 'SYSTEM'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">{getActivityIcon(log.content || '')}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={`${getActivityTypeColor(log.content || '')} text-xs`}
                                  >
                                    {log.content?.includes('CREATE')
                                      ? 'CREATE'
                                      : log.content?.includes('UPDATE')
                                      ? 'UPDATE'
                                      : log.content?.includes('DELETE')
                                      ? 'DELETE'
                                      : log.content?.includes('SEND')
                                      ? 'SEND'
                                      : log.content?.includes('VIEW')
                                      ? 'VIEW'
                                      : 'ACTION'}
                                  </Badge>
                                  {showExpandButton && (
                                    <button
                                      onClick={() => toggleLogExpansion(log.id)}
                                      className="text-gray-500 transition-colors hover:text-gray-700"
                                      title={
                                        isExpanded ? 'Hide details' : 'Show deleted content details'
                                      }
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-gray-700">{mainMessage}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && hasDetails && (
                          <TableRow key={`${log.id}-details`} className="bg-gray-50">
                            <TableCell colSpan={5}>
                              <div className="px-4 py-3 border-l-4 border-red-300 bg-red-50/50">
                                <div className="mb-2 text-xs font-semibold text-gray-700 uppercase">
                                  Deleted Content Details
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                  {details.map((detail, index) => (
                                    <div
                                      key={index}
                                      className="p-2 bg-white border border-gray-200 rounded"
                                    >
                                      <div className="text-xs font-medium text-gray-600">
                                        {detail.key}
                                      </div>
                                      <div className="text-sm text-gray-900 mt-0.5 break-words">
                                        {detail.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No activity logs found</p>
              <p className="mt-1 text-sm">
                {searchQuery || selectedUser !== 'all' || dateRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Activity logs will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
