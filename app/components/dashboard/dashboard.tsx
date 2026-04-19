'use client';

import { PageHeader } from '@/app/components/page-header';
import { useAlerts } from '@/app/providers/alerts-provider';
import { useData } from '@/app/providers/data-provider';
import { useEvacuation } from '@/app/providers/evacuation-provider';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Building2,
  CalendarIcon,
  Clock,
  Download,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const config: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        config[severity] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {severity}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    open: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    full: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    closed: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        config[status] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {status}
    </span>
  );
};

const Dashboard = () => {
  const { alerts, alertsLoading, refreshAlerts } = useAlerts();
  const { evacuationCenters, evacuationLoading, refreshEvacuationCenters } = useEvacuation();
  const { users, userStats, usersLoading, refreshUsers } = useData();

  const [isExporting, setIsExporting] = useState(false);
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);

  const formatDateDisplay = (date: Date) => {
    try {
      return format(date, 'MMMM d, yyyy');
    } catch {
      return date.toLocaleDateString();
    }
  };

  const periodLabel =
    startDate.toDateString() === endDate.toDateString()
      ? formatDateDisplay(startDate)
      : `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`;

  const loading = alertsLoading || evacuationLoading || usersLoading;

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshAlerts(), refreshEvacuationCenters(), refreshUsers()]);
  }, [refreshAlerts, refreshEvacuationCenters, refreshUsers]);

  const exportToPDF = () => {
    try {
      setIsExporting(true);

      const startDateObj = startDate;
      const endDateObj = endDate;
      const periodName =
        startDate.toDateString() === endDate.toDateString()
          ? startDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : `${startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      const timestamp = new Date().toLocaleString();

      const startTimestamp = new Date(startDate).setHours(0, 0, 0, 0);
      const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);

      const filteredAlerts = alerts.filter((alert) => {
        if (!alert.created_at) return false;
        const alertTime = new Date(alert.created_at).getTime();
        return alertTime >= startTimestamp && alertTime <= endTimestamp;
      });

      const filteredUsers = users.filter((user) => {
        if (!user.created_at) return false;
        const userTime = new Date(user.created_at).getTime();
        return userTime >= startTimestamp && userTime <= endTimestamp;
      });

      const filteredEvacuationCenters = evacuationCenters.filter((center) => {
        const stamp = center.updated_at || center.created_at;
        if (!stamp) return false;
        const centerTime = new Date(stamp).getTime();
        return centerTime >= startTimestamp && centerTime <= endTimestamp;
      });

      const dayStats = {
        totalUsers: filteredUsers.length,
        activeAlerts: filteredAlerts.filter((alert) => !alert.deleted_at).length,
        evacuationCenters: filteredEvacuationCenters.length,
        criticalAlerts: filteredAlerts.filter((alert) => alert.alert_level === 'critical').length,
      };

      const dayAlerts = filteredAlerts.slice(0, 20).map((alert) => ({
        id: alert.id,
        title: alert.title || 'Untitled Alert',
        severity: alert.alert_level || 'medium',
        time: new Date(alert.created_at).toLocaleTimeString(),
        date: new Date(alert.created_at).toLocaleDateString(),
        status: alert.deleted_at ? 'deleted' : 'active',
      }));

      const dayUsers = filteredUsers.slice(0, 20).map((user) => ({
        id: user.id,
        name: user.full_name || 'Unknown User',
        email: user.email,
        role: user.role || 'user',
        joinDate: user.created_at,
        status: 'active',
      }));

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
            <p>Report Period: ${periodName}</p>
            <p>Generated on: ${timestamp}</p>
          </div>
          <div class="section">
            <h2>Overview Statistics</h2>
            <div class="stats">
              <div class="stat"><div class="stat-value">${dayStats.totalUsers.toLocaleString()}</div><div class="stat-label">New Users</div></div>
              <div class="stat"><div class="stat-value">${dayStats.activeAlerts}</div><div class="stat-label">Active Alerts</div></div>
              <div class="stat"><div class="stat-value">${dayStats.evacuationCenters}</div><div class="stat-label">Evacuation Centers</div></div>
              <div class="stat"><div class="stat-value">${dayStats.criticalAlerts}</div><div class="stat-label">Critical Alerts</div></div>
            </div>
          </div>
          <div class="section">
            <h2>Alerts for ${periodName}</h2>
            <table>
              <thead><tr><th>ID</th><th>Title</th><th>Level</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                ${dayAlerts.length > 0 ? dayAlerts.map((alert) => `<tr><td>#${alert.id}</td><td>${alert.title}</td><td>${alert.severity}</td><td>${alert.time}</td><td>${alert.status}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align: center; color: #666;">No alerts for this period</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>New Users in ${periodName}</h2>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Join Date</th></tr></thead>
              <tbody>
                ${dayUsers.length > 0 ? dayUsers.map((user) => `<tr><td>${user.name}</td><td>${user.email}</td><td>${user.role}</td><td>${new Date(user.joinDate).toLocaleDateString()}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align: center; color: #666;">No new users for this period</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Evacuation Centers</h2>
            <table>
              <thead><tr><th>Name</th><th>Status</th><th>Occupancy</th><th>Capacity</th><th>Address</th></tr></thead>
              <tbody>
                ${filteredEvacuationCenters.length > 0 ? filteredEvacuationCenters.map((center) => `<tr><td>${center.name}</td><td>${(center.status || 'closed').toUpperCase()}</td><td>${center.current_occupancy || 0}</td><td>${center.capacity || 0}</td><td>${center.address}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align: center; color: #666;">No evacuation center updates for this period</td></tr>'}
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
        setTimeout(() => { printWindow.print(); }, 500);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (alerts.length === 0 && evacuationCenters.length === 0 && users.length === 0) {
      refreshAll();
    }
  }, [alerts, evacuationCenters, users, refreshAll]);

  const stats = useMemo(() => {
    const startTimestamp = startDate.getTime();
    const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);

    const dayAlerts = alerts.filter((a) => {
      if (!a.created_at) return false;
      const time = new Date(a.created_at).getTime();
      return time >= startTimestamp && time <= endTimestamp;
    });

    const dayUsers = users.filter((u) => {
      if (!u.created_at) return false;
      const time = new Date(u.created_at).getTime();
      return time >= startTimestamp && time <= endTimestamp;
    });

    const dayEvacuations = evacuationCenters.filter((c) => {
      const stamp = c.updated_at || c.created_at;
      if (!stamp) return false;
      const time = new Date(stamp).getTime();
      return time >= startTimestamp && time <= endTimestamp;
    });

    return {
      totalUsers: dayUsers.length,
      activeAlerts: dayAlerts.filter((a) => !a.deleted_at).length,
      evacuationCenters: dayEvacuations.length,
      criticalAlerts: dayAlerts.filter((a) => a.alert_level === 'critical').length,
      userGrowth: dayUsers.length,
      alertsToday: dayAlerts.filter((a) => {
        if (!a.created_at) return false;
        return new Date(a.created_at).toDateString() === new Date().toDateString();
      }).length,
      availableCenters: dayEvacuations.filter((c) => c.status === 'open').length,
      responseTime: '4.2 min',
      dayAlerts,
      dayUsers,
      dayEvacuations,
    };
  }, [alerts, evacuationCenters, users, startDate, endDate]);

  const recentAlerts = useMemo(
    () =>
      stats.dayAlerts
        .slice()
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 20)
        .map((alert) => ({
          id: alert.id,
          title: alert.title || 'Untitled Alert',
          severity: alert.alert_level || 'medium',
          time: new Date(alert.created_at).toLocaleTimeString(),
          date: new Date(alert.created_at).toLocaleDateString(),
          status: alert.deleted_at ? 'deleted' : 'active',
        })),
    [stats.dayAlerts],
  );

  const recentUsers = useMemo(
    () =>
      stats.dayUsers
        .slice()
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 20)
        .map((user) => ({
          id: user.id,
          name: user.full_name || 'Unknown User',
          email: user.email,
          role: user.role || 'user',
          joinDate: user.created_at,
        })),
    [stats.dayUsers],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      sub: `${stats.userGrowth} in period`,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Active Alerts',
      value: stats.activeAlerts,
      sub: `${stats.criticalAlerts} critical`,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: stats.criticalAlerts > 0 ? `${stats.criticalAlerts} critical` : 'No critical',
      trendUp: false,
    },
    {
      label: 'Evacuation Centers',
      value: stats.evacuationCenters,
      sub: `${stats.availableCenters} available`,
      icon: Building2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: `${stats.availableCenters} open`,
      trendUp: true,
    },
    {
      label: 'Avg Response Time',
      value: stats.responseTime,
      sub: 'Past 30 days',
      icon: Clock,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      trend: '▲ 12% better',
      trendUp: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6">
      <div className="mx-auto space-y-6 max-w-7xl">

        {/* Header */}
        <PageHeader
          title="Dashboard"
          subtitle="Overview of alerts, users, and evacuation centers"
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-9 gap-2 border-gray-200 bg-white text-gray-700 text-sm font-normal shadow-none hover:bg-gray-50',
                      !startDate && 'text-gray-400',
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date > new Date() || date > endDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-gray-300 text-sm">→</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-9 gap-2 border-gray-200 bg-white text-gray-700 text-sm font-normal shadow-none hover:bg-gray-50',
                      !endDate && 'text-gray-400',
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date > new Date() || date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                onClick={exportToPDF}
                disabled={isExporting}
                size="sm"
                className="h-9 gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-none cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Export Report
              </Button>
            </div>
          }
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <div className={cn('p-2 rounded-lg', card.iconBg)}>
                    <Icon className={cn('w-4 h-4', card.iconColor)} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-400">{card.sub}</p>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      card.trendUp ? 'text-emerald-600' : 'text-amber-600',
                    )}
                  >
                    {card.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Alert Severity Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Alert Severity Distribution</h2>
                <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 rounded-full px-3 py-1 border border-gray-100">
                {recentAlerts.length} alerts
              </span>
            </div>
            <div className="p-6">
              {recentAlerts.length > 0 ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-center">
                    <div className="relative w-44 h-44">
                      {(() => {
                        const severityCounts = recentAlerts.reduce((acc, alert) => {
                          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        const total = recentAlerts.length;
                        const segments = [
                          { label: 'critical', count: severityCounts.critical || 0, color: '#ef4444' },
                          { label: 'high', count: severityCounts.high || 0, color: '#f97316' },
                          { label: 'medium', count: severityCounts.medium || 0, color: '#f59e0b' },
                          { label: 'low', count: severityCounts.low || 0, color: '#10b981' },
                        ].filter((s) => s.count > 0);

                        let currentAngle = 0;
                        const segmentsWithAngles = segments.map((segment) => {
                          const angle = (segment.count / total) * 360;
                          const result = { ...segment, startAngle: currentAngle, angle };
                          currentAngle += angle;
                          return result;
                        });

                        return (
                          <div className="relative w-full h-full">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                              {segmentsWithAngles.map((segment, index) => {
                                const radius = 82;
                                const innerRadius = 54;
                                const cx = 100, cy = 100;
                                const startRad = (segment.startAngle * Math.PI) / 180;
                                const endRad = ((segment.startAngle + segment.angle) * Math.PI) / 180;
                                const x1 = cx + radius * Math.cos(startRad);
                                const y1 = cy + radius * Math.sin(startRad);
                                const x2 = cx + radius * Math.cos(endRad);
                                const y2 = cy + radius * Math.sin(endRad);
                                const ix1 = cx + innerRadius * Math.cos(startRad);
                                const iy1 = cy + innerRadius * Math.sin(startRad);
                                const ix2 = cx + innerRadius * Math.cos(endRad);
                                const iy2 = cy + innerRadius * Math.sin(endRad);
                                const largeArc = segment.angle > 180 ? 1 : 0;
                                const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
                                return (
                                  <path
                                    key={index}
                                    d={d}
                                    fill={segment.color}
                                    className="transition-opacity hover:opacity-75"
                                  />
                                );
                              })}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{total}</p>
                                <p className="text-xs text-gray-400">Total</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const severityCounts = recentAlerts.reduce((acc, alert) => {
                        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const config: Record<string, { dot: string; label: string }> = {
                        critical: { dot: 'bg-red-500', label: 'Critical' },
                        high: { dot: 'bg-orange-500', label: 'High' },
                        medium: { dot: 'bg-amber-400', label: 'Medium' },
                        low: { dot: 'bg-emerald-500', label: 'Low' },
                      };

                      return Object.entries(severityCounts).map(([severity, count]) => (
                        <div key={severity} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50">
                          <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', config[severity]?.dot ?? 'bg-gray-400')} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700">
                              {config[severity]?.label ?? severity}
                            </p>
                            <p className="text-xs text-gray-400">
                              {count} · {((count / recentAlerts.length) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No alerts in this period</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting the date range</p>
                </div>
              )}
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">User Growth Chart</h2>
                <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 rounded-full px-3 py-1 border border-gray-100">
                {recentUsers.length} new
              </span>
            </div>
            <div className="p-6">
              {recentUsers.length > 0 ? (
                <div className="space-y-5">
                  <div className="h-44">
                    {(() => {
                      const endDateObj = endDate;
                      const months = [];
                      for (let i = 5; i >= 0; i--) {
                        const date = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - i, 1);
                        months.push({
                          name: date.toLocaleDateString('en-US', { month: 'short' }),
                          users: users.filter((user) => {
                            const d = new Date(user.created_at);
                            return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                          }).length,
                        });
                      }

                      const maxUsers = Math.max(...months.map((m) => m.users), 1);
                      const W = 400, H = 160, PAD = 40;

                      const points = months.map((month, i) => ({
                        x: PAD + (i * (W - 2 * PAD)) / (months.length - 1),
                        y: H - PAD - (month.users / maxUsers) * (H - 2 * PAD),
                        users: month.users,
                        name: month.name,
                      }));

                      const linePath = points.reduce(
                        (p, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`),
                        '',
                      );
                      const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - PAD} L ${points[0].x} ${H - PAD} Z`;

                      return (
                        <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`}>
                          <defs>
                            <linearGradient id="growthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {[...Array(4)].map((_, i) => {
                            const y = PAD + (i * (H - 2 * PAD)) / 3;
                            return (
                              <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                            );
                          })}
                          <path d={areaPath} fill="url(#growthGrad)" />
                          <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          {points.map((pt, i) => (
                            <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                          ))}
                          {points.map((pt, i) => (
                            <text key={i} x={pt.x} y={H - 12} textAnchor="middle" fill="#9ca3af" fontSize="10">{pt.name}</text>
                          ))}
                          {points.map((pt, i) => (
                            <text key={i} x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="600">{pt.users}</text>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                    {[
                      { label: 'This Month', value: `+${userStats.usersThisMonth}`, color: 'text-emerald-600' },
                      { label: 'Last Month', value: userStats.usersLastMonth, color: 'text-blue-600' },
                      { label: 'This Year', value: userStats.usersThisYear, color: 'text-violet-600' },
                      { label: 'Last Year', value: userStats.usersLastYear, color: 'text-gray-600' },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <p className={cn('text-base font-bold tabular-nums', item.color)}>{item.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No user data in this period</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting the date range</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Sign-Up History Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">History</h2>
              <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 rounded-full px-3 py-1 border border-gray-100">
              {stats.dayUsers.length} users
            </span>
          </div>

          {stats.dayUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Signed Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.dayUsers
                    .slice()
                    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px] truncate whitespace-nowrap">
                          {user.full_name || 'Unknown User'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 max-w-[220px] truncate whitespace-nowrap">
                          {user.email || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 tabular-nums whitespace-nowrap">
                          {new Date(user.created_at!).toLocaleDateString()}{' '}
                          <span className="text-gray-400">
                            {new Date(user.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No sign-ups in this period</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the date range</p>
            </div>
          )}
        </div>

        {/* Evacuation Centers Overview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Evacuation Centers</h2>
              <p className="text-xs text-gray-400 mt-0.5">Capacity and status overview</p>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 rounded-full px-3 py-1 border border-gray-100">
              {stats.dayEvacuations.length} centers
            </span>
          </div>

          {stats.dayEvacuations.length > 0 ? (
            <div className="p-5 space-y-6">

              {/* Status Cards */}
              <div className="grid grid-cols-3 gap-4">
                {(() => {
                  const statusCounts = stats.dayEvacuations.reduce((acc, center) => {
                    const s = center.status || 'closed';
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const statusConfig = [
                    { key: 'open', label: 'Open', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
                    { key: 'full', label: 'Full', iconBg: 'bg-red-50', iconColor: 'text-red-600', valueColor: 'text-red-600' },
                    { key: 'closed', label: 'Closed', iconBg: 'bg-gray-100', iconColor: 'text-gray-500', valueColor: 'text-gray-600' },
                  ];

                  return statusConfig.map(({ key, label, iconBg, iconColor, valueColor }) => {
                    const count = statusCounts[key] || 0;
                    const pct = stats.dayEvacuations.length > 0 ? ((count / stats.dayEvacuations.length) * 100).toFixed(0) : '0';
                    return (
                      <div key={key} className="flex flex-col gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
                          <Building2 className={cn('w-4.5 h-4.5', iconColor)} />
                        </div>
                        <div>
                          <p className={cn('text-2xl font-bold tabular-nums', valueColor)}>{count}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{label} · {pct}%</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Capacity Bars */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Capacity Analysis</p>
                <div className="space-y-3">
                  {stats.dayEvacuations.slice(0, 8).map((center) => {
                    const capacity = center.capacity || 0;
                    const occupancy = center.current_occupancy || 0;
                    const rate = capacity > 0 ? (occupancy / capacity) * 100 : 0;
                    const barColor = rate >= 90 ? 'bg-red-500' : rate >= 70 ? 'bg-amber-400' : 'bg-emerald-500';

                    return (
                      <div key={center.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-medium text-gray-800 truncate">{center.name}</p>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <StatusBadge status={center.status || 'closed'} />
                              <span className="text-xs tabular-nums text-gray-400">{occupancy}/{capacity}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-300', barColor)}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs tabular-nums font-medium text-gray-500 w-9 text-right flex-shrink-0">
                          {rate.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                  {stats.dayEvacuations.length > 8 && (
                    <p className="text-xs text-gray-400 pt-1">
                      +{stats.dayEvacuations.length - 8} more centers
                    </p>
                  )}
                </div>
              </div>

              {/* Summary Row */}
              <div className="border-t border-gray-100 pt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {(() => {
                  const totalCap = stats.dayEvacuations.reduce((s, c) => s + (c.capacity || 0), 0);
                  const totalOcc = stats.dayEvacuations.reduce((s, c) => s + (c.current_occupancy || 0), 0);
                  const availableNow = stats.dayEvacuations.filter((c) => c.status === 'open').length;
                  const usage = totalCap > 0 ? ((totalOcc / totalCap) * 100).toFixed(1) : '0';
                  return [
                    { label: 'Total Capacity', value: totalCap.toLocaleString(), color: 'text-blue-600' },
                    { label: 'Current Occupancy', value: totalOcc.toLocaleString(), color: 'text-emerald-600' },
                    { label: 'Available Now', value: availableNow, color: 'text-violet-600' },
                    { label: 'Overall Usage', value: `${usage}%`, color: 'text-amber-600' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-gray-50">
                      <p className={cn('text-lg font-bold tabular-nums', item.color)}>{item.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No evacuation center data</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the date range</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
