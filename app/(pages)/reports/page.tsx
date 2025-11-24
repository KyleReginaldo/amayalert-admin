'use client';

import { supabase } from '@/app/client/supabase';
import ModuleGuard from '@/app/components/module-guard';
import { PageHeader } from '@/app/components/page-header';
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
  SheetFooter,
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
import { Database } from '@/database.types';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileWarning,
  Flag,
  Image as ImageIcon,
  MessageSquare,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Report = Database['public']['Tables']['reports']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type UserProfile = Database['public']['Tables']['users']['Row'];

interface ReportWithDetails extends Report {
  post_details: Post | null;
  reported_by_details: UserProfile | null;
  reporter_name: string;
}

const ITEMS_PER_PAGE = 10;

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(
          `
          *,
          post_details:posts(
            id,
            content,
            media_url,
            created_at,
            updated_at,
            user,
            visibility
          ),
          reported_by_details:users!reports_reported_by_fkey(
            id,
            full_name,
            email,
            profile_picture
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      const reportsWithDetails = (data || []).map((report: Record<string, unknown>) => {
        const reportData = report as {
          reported_by_details?: { full_name?: string } | null;
        };
        return {
          ...report,
          reporter_name: reportData.reported_by_details?.full_name || 'Unknown User',
        };
      }) as ReportWithDetails[];

      setReports(reportsWithDetails);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    setDeletingPost(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postToDelete);

      if (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
        return;
      }

      await fetchReports();
      setShowDeleteDialog(false);
      setPostToDelete(null);
      alert('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setDeletingPost(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    // Filter by search term
    const matchesSearch =
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.post_details?.content || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by selected month and year
    const reportDate = new Date(report.created_at);
    const matchesMonth = reportDate.getMonth().toString() === selectedMonth;
    const matchesYear = reportDate.getFullYear().toString() === selectedYear;

    return matchesSearch && matchesMonth && matchesYear;
  });

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonBadge = (reason: string) => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('spam')) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    } else if (reasonLower.includes('inappropriate') || reasonLower.includes('offensive')) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else if (reasonLower.includes('misinformation') || reasonLower.includes('fake')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    } else {
      return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const totalReports = filteredReports.length;
  const uniquePostsReported = new Set(filteredReports.map((r) => r.post)).size;
  const reportsToday = filteredReports.filter((r) => {
    const today = new Date().toDateString();
    return new Date(r.created_at).toDateString() === today;
  }).length;

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const exportToCSV = () => {
    const monthName = months[parseInt(selectedMonth)];
    const csvHeaders = [
      'Reporter Name',
      'Reporter Email',
      'Reason',
      'Post Content',
      'Has Media',
      'Reported Date',
      'Reported Time',
    ];

    const csvRows = filteredReports.map((report) => [
      report.reporter_name,
      report.reported_by_details?.email || 'N/A',
      report.reason,
      `"${(report.post_details?.content || 'N/A').replace(/"/g, '""')}"`,
      report.post_details?.media_url ? 'Yes' : 'No',
      formatDate(report.created_at),
      formatTime(report.created_at),
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_${monthName}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <ModuleGuard requiredModule="report">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Reports Management"
            subtitle="Manage reported posts and take appropriate actions"
          />
          <Button onClick={exportToCSV} className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Filter Controls */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">Filter by Period</label>
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1 focus-within:ring-1 focus-within:ring-primary transition-all">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-6 flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-medium text-red-700">Total Reports</p>
                <p className="text-3xl font-bold text-red-800">{totalReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-medium text-orange-700">Posts Reported</p>
                <p className="text-2xl font-bold text-orange-800">{uniquePostsReported}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-medium text-blue-700">Today&apos;s Reports</p>
                <p className="text-2xl font-bold text-blue-800">{reportsToday}</p>
              </div>
            </div>
          </Card>
        </div>

        {paginatedReports.length === 0 ? (
          <div className="text-center py-12">
            <FileWarning className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No reports match your search.' : 'No reports found.'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                    REPORTER
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                    REASON
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                    POST CONTENT
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                    REPORTED
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 text-right">
                    ACTIONS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((report, index) => (
                  <TableRow
                    key={report.id}
                    className={`hover:bg-muted/30 transition-colors border-none ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    <TableCell className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{report.reporter_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {report.reported_by_details?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Badge
                        variant="outline"
                        className={`${getReasonBadge(report.reason)} border text-xs`}
                      >
                        {report.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="max-w-[300px] space-y-2">
                        <div className="text-sm text-foreground line-clamp-2">
                          {report.post_details?.content || 'Content not available'}
                        </div>
                        {report.post_details?.media_url && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ImageIcon className="h-3 w-3" />
                            Has media attachment
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="text-sm text-foreground">
                          {formatDate(report.created_at)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(report.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          className="h-8 w-8 p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPostToDelete(report.post);
                            setShowDeleteDialog(true);
                          }}
                          className="h-8 w-8 p-0 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{' '}
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredReports.length)} of{' '}
                  {filteredReports.length} reports
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {/* Report Details Sheet */}
        {selectedReport && (
          <Sheet open={true} onOpenChange={() => setSelectedReport(null)}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Flag className="h-5 w-5 text-red-500" />
                  <SheetTitle>Report Details</SheetTitle>
                </div>
                <SheetDescription>Review the details of this reported post</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* Reporter Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Reporter Information
                  </h4>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{selectedReport.reporter_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedReport.reported_by_details?.email || 'No email available'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Report Details */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Report Details
                  </h4>
                  <Card className="p-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reason</label>
                      <div className="mt-1">
                        <Badge variant="outline" className={getReasonBadge(selectedReport.reason)}>
                          {selectedReport.reason}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Reported On
                      </label>
                      <div className="mt-1 text-sm">
                        {formatDate(selectedReport.created_at)} at{' '}
                        {formatTime(selectedReport.created_at)}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Post Content */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Reported Post
                  </h4>
                  <Card className="p-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Content</label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                        {selectedReport.post_details?.content || 'No content available'}
                      </div>
                    </div>
                    {selectedReport.post_details?.media_url && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Media</label>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          Media attachment present
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Posted On</label>
                      <div className="mt-1 text-sm">
                        {selectedReport.post_details?.created_at
                          ? `${formatDate(selectedReport.post_details.created_at)} at ${formatTime(
                              selectedReport.post_details.created_at,
                            )}`
                          : 'Date not available'}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <SheetFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPostToDelete(selectedReport.post);
                    setSelectedReport(null);
                    setShowDeleteDialog(true);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Post
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Delete Post
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this reported post? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deletingPost}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePost}
                disabled={deletingPost}
                className="gap-2"
              >
                {deletingPost ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deletingPost ? 'Deleting...' : 'Delete Post'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleGuard>
  );
}
