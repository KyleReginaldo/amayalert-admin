'use client';

import { PageHeader } from '@/app/components/page-header';
import { useAlerts } from '@/app/providers/alerts-provider';
import { useData } from '@/app/providers/data-provider';
import { useEvacuation } from '@/app/providers/evacuation-provider';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertTriangle, Building2, Download, Loader2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const Dashboard = () => {
  // Get data from separate providers
  const { alerts, alertsLoading, refreshAlerts } = useAlerts();
  const { evacuationCenters, evacuationLoading, refreshEvacuationCenters } = useEvacuation();
  const { users, userStats, usersLoading, refreshUsers } = useData();

  const [isExporting, setIsExporting] = useState(false);
  const [exportDate, setExportDate] = useState<Date>(new Date());
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<string>(format(today, 'yyyy-MM-dd'));
  const exportDay = format(exportDate, 'yyyy-MM-dd');

  // Overall loading state
  const loading = alertsLoading || evacuationLoading || usersLoading;

  // Refresh all data function
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshAlerts(), refreshEvacuationCenters(), refreshUsers()]);
  }, [refreshAlerts, refreshEvacuationCenters, refreshUsers]);

  const exportToPDF = () => {
    try {
      setIsExporting(true);

      const [year, month, day] = exportDay.split('-');
      const reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayName = reportDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const timestamp = new Date().toLocaleString();

      // Filter data by selected day
      const filteredAlerts = alerts.filter((alert) => {
        if (!alert.created_at) return false;
        const alertDate = new Date(alert.created_at);
        return (
          alertDate.getFullYear() === parseInt(year) &&
          alertDate.getMonth() === parseInt(month) - 1 &&
          alertDate.getDate() === parseInt(day)
        );
      });

      const filteredUsers = users.filter((user) => {
        if (!user.created_at) return false;
        const userDate = new Date(user.created_at);
        return (
          userDate.getFullYear() === parseInt(year) &&
          userDate.getMonth() === parseInt(month) - 1 &&
          userDate.getDate() === parseInt(day)
        );
      });

      const filteredEvacuationCenters = evacuationCenters.filter((center) => {
        const stamp = center.updated_at || center.created_at;
        if (!stamp) return false;
        const cDate = new Date(stamp);
        return (
          cDate.getFullYear() === parseInt(year) &&
          cDate.getMonth() === parseInt(month) - 1 &&
          cDate.getDate() === parseInt(day)
        );
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
            <p>Report Period: ${dayName}</p>
            <p>Generated on: ${timestamp}</p>
          </div>

          <div class="section">
            <h2>Overview Statistics</h2>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${dayStats.totalUsers.toLocaleString()}</div>
                <div class="stat-label">New Users</div>
              </div>
              <div class="stat">
                <div class="stat-value">${dayStats.activeAlerts}</div>
                <div class="stat-label">Active Alerts</div>
              </div>
              <div class="stat">
                <div class="stat-value">${dayStats.evacuationCenters}</div>
                <div class="stat-label">Evacuation Centers</div>
              </div>
              <div class="stat">
                <div class="stat-value">${dayStats.criticalAlerts}</div>
                <div class="stat-label">Critical Alerts</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Alerts for ${dayName}</h2>
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
                ${
                  dayAlerts.length > 0
                    ? dayAlerts
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
                        .join('')
                    : '<tr><td colspan="5" style="text-align: center; color: #666;">No alerts for this period</td></tr>'
                }
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>New Users in ${dayName}</h2>
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
                ${
                  dayUsers.length > 0
                    ? dayUsers
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
                        .join('')
                    : '<tr><td colspan="4" style="text-align: center; color: #666;">No new users for this period</td></tr>'
                }
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
                ${
                  filteredEvacuationCenters.length > 0
                    ? filteredEvacuationCenters
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
                        .join('')
                    : '<tr><td colspan="5" style="text-align: center; color: #666;">No evacuation center updates for this period</td></tr>'
                }
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

  const handleExport = () => {
    exportToPDF();
  };

  useEffect(() => {
    if (alerts.length === 0 && evacuationCenters.length === 0 && users.length === 0) {
      refreshAll();
    }
  }, [alerts, evacuationCenters, users, refreshAll]);

  const stats = useMemo(() => {
    const [yearStr, monthStr, dayStr] = selectedDay.split('-');
    const selYear = parseInt(yearStr, 10);
    const selMonth = parseInt(monthStr, 10) - 1; // zero-based
    const selDay = parseInt(dayStr, 10);

    // Filter alerts/users for selected day
    const dayAlerts = alerts.filter((a) => {
      if (!a.created_at) return false;
      const d = new Date(a.created_at);
      return d.getFullYear() === selYear && d.getMonth() === selMonth && d.getDate() === selDay;
    });

    const dayUsers = users.filter((u) => {
      if (!u.created_at) return false;
      const d = new Date(u.created_at);
      return d.getFullYear() === selYear && d.getMonth() === selMonth && d.getDate() === selDay;
    });

    const dayEvacuations = evacuationCenters.filter((c) => {
      const stamp = c.updated_at || c.created_at;
      if (!stamp) return false;
      const d = new Date(stamp);
      return d.getFullYear() === selYear && d.getMonth() === selMonth && d.getDate() === selDay;
    });

    return {
      totalUsers: dayUsers.length, // show new users in selected day
      activeAlerts: dayAlerts.filter((a) => !a.deleted_at).length,
      evacuationCenters: dayEvacuations.length,
      criticalAlerts: dayAlerts.filter((a) => a.alert_level === 'critical').length,
      userGrowth: dayUsers.length, // for selected day
      alertsToday: dayAlerts.filter((a) => {
        if (!a.created_at) return false;
        const ad = new Date(a.created_at).toDateString();
        return ad === new Date().toDateString();
      }).length,
      availableCenters: dayEvacuations.filter((center) => center.status === 'open').length,
      responseTime: '4.2 min',
      dayAlerts,
      dayUsers,
      dayEvacuations,
    };
  }, [alerts, evacuationCenters, users, selectedDay]);

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
          status: 'active',
        })),
    [stats.dayUsers],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50 md:bg-background md:p-6">
      <div className="mx-auto space-y-6 max-w-7xl">
        {/* Header */}
        <PageHeader
          title="Dashboard"
          subtitle="Overview of alerts, users, and evacuation centers"
          action={
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDay}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDay(val);
                  if (val) setExportDate(new Date(val));
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                className="gap-2 border-gray-300"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export Report
              </Button>
            </div>
          }
        />

        {/* Minimal Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="mt-1 text-xs text-green-600">+{stats.userGrowth} this day</div>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.activeAlerts}</div>
            <div className="text-sm text-gray-600">Active Alerts</div>
            <div className="mt-1 text-xs text-gray-500">{stats.criticalAlerts} critical</div>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.evacuationCenters}</div>
            <div className="text-sm text-gray-600">Evacuation Centers</div>
            <div className="mt-1 text-xs text-gray-500">{stats.availableCenters} available</div>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.responseTime}</div>
            <div className="text-sm text-gray-600">Avg Response</div>
            <div className="mt-1 text-xs text-gray-500">12% better</div>
          </div>
        </div>

        {/* Chart Analytics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Alert Severity Distribution */}
          <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Alert Severity ({selectedDay})
                </h2>
                <span className="text-sm text-gray-500">{recentAlerts.length} in day</span>
              </div>
            </div>
            <div className="p-6">
              {recentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {/* Doughnut Chart Representation */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      {(() => {
                        const severityCounts = recentAlerts.reduce((acc, alert) => {
                          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        const total = recentAlerts.length;
                        const segments = [
                          {
                            label: 'critical',
                            count: severityCounts.critical || 0,
                            color: '#ef4444',
                          },
                          { label: 'high', count: severityCounts.high || 0, color: '#f97316' },
                          { label: 'medium', count: severityCounts.medium || 0, color: '#eab308' },
                          { label: 'low', count: severityCounts.low || 0, color: '#22c55e' },
                        ].filter((segment) => segment.count > 0);

                        // Calculate angles for each segment
                        let currentAngle = 0;
                        const segmentsWithAngles = segments.map((segment) => {
                          const angle = (segment.count / total) * 360;
                          const result = { ...segment, startAngle: currentAngle, angle };
                          currentAngle += angle;
                          return result;
                        });

                        return (
                          <div className="relative w-full h-full">
                            {/* SVG Chart */}
                            <svg
                              className="w-full h-full transform -rotate-90"
                              viewBox="0 0 200 200"
                            >
                              {segmentsWithAngles.map((segment, index) => {
                                const radius = 80;
                                const innerRadius = 50;
                                const centerX = 100;
                                const centerY = 100;

                                const startAngleRad = (segment.startAngle * Math.PI) / 180;
                                const endAngleRad =
                                  ((segment.startAngle + segment.angle) * Math.PI) / 180;

                                const x1 = centerX + radius * Math.cos(startAngleRad);
                                const y1 = centerY + radius * Math.sin(startAngleRad);
                                const x2 = centerX + radius * Math.cos(endAngleRad);
                                const y2 = centerY + radius * Math.sin(endAngleRad);

                                const ix1 = centerX + innerRadius * Math.cos(startAngleRad);
                                const iy1 = centerY + innerRadius * Math.sin(startAngleRad);
                                const ix2 = centerX + innerRadius * Math.cos(endAngleRad);
                                const iy2 = centerY + innerRadius * Math.sin(endAngleRad);

                                const largeArcFlag = segment.angle > 180 ? 1 : 0;

                                const pathData = [
                                  `M ${x1} ${y1}`,
                                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                  `L ${ix2} ${iy2}`,
                                  `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}`,
                                  'Z',
                                ].join(' ');

                                return (
                                  <path
                                    key={index}
                                    d={pathData}
                                    fill={segment.color}
                                    className="transition-opacity hover:opacity-80"
                                  />
                                );
                              })}
                            </svg>

                            {/* Center content */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{total}</div>
                                <div className="text-xs text-gray-500">Alerts</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const severityCounts = recentAlerts.reduce((acc, alert) => {
                        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const severityColors = {
                        critical: 'bg-red-500',
                        high: 'bg-orange-500',
                        medium: 'bg-yellow-500',
                        low: 'bg-green-500',
                      };

                      return Object.entries(severityCounts).map(([severity, count]) => (
                        <div key={severity} className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              severityColors[severity as keyof typeof severityColors]
                            }`}
                          ></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">{severity}</span>
                              <span className="text-sm text-gray-600">{count}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {((count / recentAlerts.length) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                  <p>No alert data available</p>
                </div>
              )}
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  User Growth (ending {selectedDay})
                </h2>
                <span className="text-sm text-gray-500">{recentUsers.length} new users</span>
              </div>
            </div>
            <div className="p-6">
              {recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {/* Clean Line Chart */}
                  <div className="h-48">
                    {(() => {
                      // Group users by month for the last 6 months
                      // Base end month on selectedDay instead of current real-time month
                      const [yearStr, monthStr, dayStr] = selectedDay.split('-');
                      const endDate = new Date(
                        parseInt(yearStr, 10),
                        parseInt(monthStr, 10) - 1,
                        parseInt(dayStr, 10),
                      );
                      const months = [];
                      for (let i = 5; i >= 0; i--) {
                        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
                        months.push({
                          name: date.toLocaleDateString('en-US', { month: 'short' }),
                          users: users.filter((user) => {
                            const userDate = new Date(user.created_at);
                            return (
                              userDate.getMonth() === date.getMonth() &&
                              userDate.getFullYear() === date.getFullYear()
                            );
                          }).length,
                        });
                      }

                      const maxUsers = Math.max(...months.map((m) => m.users), 1);
                      const chartWidth = 400;
                      const chartHeight = 160;
                      const padding = 40;

                      // Calculate points for straight lines
                      const points = months.map((month, index) => {
                        const x =
                          padding + (index * (chartWidth - 2 * padding)) / (months.length - 1);
                        const y =
                          chartHeight -
                          padding -
                          (month.users / maxUsers) * (chartHeight - 2 * padding);
                        return { x, y, users: month.users, name: month.name };
                      });

                      // Create straight line path
                      const linePath = points.reduce((path, point, index) => {
                        return index === 0
                          ? `M ${point.x} ${point.y}`
                          : `${path} L ${point.x} ${point.y}`;
                      }, '');

                      // Create area path for gradient fill
                      const areaPath = `${linePath} L ${points[points.length - 1].x} ${
                        chartHeight - padding
                      } L ${points[0].x} ${chartHeight - padding} Z`;

                      return (
                        <div className="relative w-full h-full">
                          <svg
                            className="w-full h-full"
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                          >
                            <defs>
                              <linearGradient
                                id="userGrowthGradient"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>

                            {/* Background grid */}
                            {[...Array(4)].map((_, i) => {
                              const y = padding + (i * (chartHeight - 2 * padding)) / 3;
                              return (
                                <line
                                  key={i}
                                  x1={padding}
                                  y1={y}
                                  x2={chartWidth - padding}
                                  y2={y}
                                  stroke="#f1f5f9"
                                  strokeWidth="1"
                                  strokeDasharray="2,2"
                                />
                              );
                            })}

                            {/* Area fill */}
                            <path d={areaPath} fill="url(#userGrowthGradient)" />

                            {/* Main line */}
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Data points */}
                            {points.map((point, index) => (
                              <circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="#3b82f6"
                                className="transition-all cursor-pointer hover:r-6"
                              />
                            ))}

                            {/* Month labels */}
                            {points.map((point, index) => (
                              <text
                                key={index}
                                x={point.x}
                                y={chartHeight - 15}
                                textAnchor="middle"
                                className="text-xs fill-gray-500"
                                fontSize="11"
                              >
                                {point.name}
                              </text>
                            ))}

                            {/* Value labels */}
                            {points.map((point, index) => (
                              <text
                                key={index}
                                x={point.x}
                                y={point.y - 10}
                                textAnchor="middle"
                                className="text-xs font-medium fill-blue-600"
                                fontSize="11"
                              >
                                {point.users}
                              </text>
                            ))}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Growth Metrics */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        +{userStats.usersThisMonth}
                      </div>
                      <div className="text-xs text-gray-500">This Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {userStats.usersLastMonth}
                      </div>
                      <div className="text-xs text-gray-500">Last Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {userStats.usersThisYear}
                      </div>
                      <div className="text-xs text-gray-500">This Year</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {userStats.usersLastYear}
                      </div>
                      <div className="text-xs text-gray-500">Last Year</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3" />
                  <p>No user data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Sign-Up History */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">History ({selectedDay})</h2>
              <span className="text-sm text-gray-500">{stats.dayUsers.length} total</span>
            </div>
          </div>
          <div className="p-6">
            {stats.dayUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4 font-medium text-gray-700">Name</th>
                      <th className="py-2 pr-4 font-medium text-gray-700">Email</th>
                      <th className="py-2 pr-4 font-medium text-gray-700">Role</th>
                      <th className="py-2 pr-4 font-medium text-gray-700">Signed Up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.dayUsers
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
                      )
                      .map((user) => (
                        <tr key={user.id} className="border-b last:border-b-0">
                          <td className="py-2 pr-4 whitespace-nowrap max-w-[200px] truncate">
                            {user.full_name || 'Unknown User'}
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap max-w-[220px] truncate">
                            {user.email || '—'}
                          </td>
                          <td className="py-2 pr-4 capitalize">{user.role || 'user'}</td>
                          <td className="py-2 pr-4 text-gray-600">
                            {new Date(user.created_at!).toLocaleDateString()}{' '}
                            {new Date(user.created_at!).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <p>No users signed up in this day</p>
              </div>
            )}
          </div>
        </div>

        {/* Evacuation Centers Overview */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Evacuation Centers Overview</h2>
              <span className="text-sm text-gray-500">{stats.dayEvacuations.length} total</span>
            </div>
          </div>
          <div className="p-6">
            {stats.dayEvacuations.length > 0 ? (
              <div className="space-y-6">
                {/* Status Distribution */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {(() => {
                    const statusCounts = stats.dayEvacuations.reduce((acc, center) => {
                      const status = center.status || 'closed';
                      acc[status] = (acc[status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const statusConfig = {
                      open: { color: 'bg-green-500', label: 'Open', textColor: 'text-green-600' },
                      full: { color: 'bg-red-500', label: 'Full', textColor: 'text-red-600' },
                      closed: { color: 'bg-gray-500', label: 'Closed', textColor: 'text-gray-600' },
                    };

                    return Object.entries(statusConfig).map(([status, config]) => {
                      const count = statusCounts[status] || 0;
                      const percentage =
                        stats.dayEvacuations.length > 0
                          ? (count / stats.dayEvacuations.length) * 100
                          : 0;

                      return (
                        <div
                          key={status}
                          className="p-4 text-center border border-gray-200 rounded-lg"
                        >
                          <div
                            className={`w-16 h-16 ${config.color} rounded-full mx-auto mb-3 flex items-center justify-center`}
                          >
                            <Building2 className="w-8 h-8 text-white" />
                          </div>
                          <div className={`text-2xl font-bold ${config.textColor}`}>{count}</div>
                          <div className="text-sm text-gray-600">{config.label}</div>
                          <div className="mt-1 text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Capacity Analysis */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="mb-4 font-medium text-gray-900 text-md">Capacity Analysis</h3>
                  <div className="space-y-3">
                    {stats.dayEvacuations.slice(0, 8).map((center) => {
                      const capacity = center.capacity || 0;
                      const occupancy = center.current_occupancy || 0;
                      const occupancyRate = capacity > 0 ? (occupancy / capacity) * 100 : 0;

                      const getStatusColor = (rate: number) => {
                        if (rate >= 90) return 'bg-red-500';
                        if (rate >= 70) return 'bg-yellow-500';
                        return 'bg-green-500';
                      };

                      return (
                        <div key={center.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {center.name}
                              </p>
                              <span className="text-xs text-gray-500">
                                {occupancy}/{capacity}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(
                                  occupancyRate,
                                )}`}
                                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 min-w-[40px] text-right">
                            {occupancyRate.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {stats.dayEvacuations.length > 8 && (
                    <div className="mt-4 text-center">
                      <span className="text-sm text-gray-500">
                        +{stats.dayEvacuations.length - 8} more centers
                      </span>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {stats.dayEvacuations
                          .reduce((sum, center) => sum + (center.capacity || 0), 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Capacity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {stats.dayEvacuations
                          .reduce((sum, center) => sum + (center.current_occupancy || 0), 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Current Occupancy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {stats.dayEvacuations.filter((center) => center.status === 'open').length}
                      </div>
                      <div className="text-xs text-gray-500">Available Now</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {(() => {
                          const totalCapacity = stats.dayEvacuations.reduce(
                            (sum, center) => sum + (center.capacity || 0),
                            0,
                          );
                          const totalOccupancy = stats.dayEvacuations.reduce(
                            (sum, center) => sum + (center.current_occupancy || 0),
                            0,
                          );
                          return totalCapacity > 0
                            ? ((totalOccupancy / totalCapacity) * 100).toFixed(1)
                            : '0';
                        })()}
                        %
                      </div>
                      <div className="text-xs text-gray-500">Overall Usage</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3" />
                <p>No evacuation centers data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
