'use client';

import { supabase } from '@/app/client/supabase';
import UsersLiveMap from '@/app/components/UsersLiveMap';
import usersAPI, { User, UserInsert, UserUpdate } from '@/app/lib/users-api';
import { buildExcelReport, buildReportHtml, openPrintWindow } from '@/app/lib/report-export';
import { ExportPopover } from '@/app/components/export-popover';
import { useData } from '@/app/providers/data-provider';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Ban,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Edit,
  Eye,
  ListFilter,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  UserCheck,
  User as UserIcon,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationControlsProps) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-gray-500">
        Showing {startIndex + 1}-{endIndex} of {totalItems}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="h-8 gap-1 border-gray-300"
        >
          <ChevronLeft className="w-3 h-3" />
          <span className="hidden sm:inline">Prev</span>
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
                  {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="w-8 h-8 p-0 text-xs border-gray-300"
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
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-8 gap-1 border-gray-300"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const { users, usersLoading, refreshUsers, addUser, updateUser, removeUser } = useData();
  const searchParams = useSearchParams();

  const [isExporting, setIsExporting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [fitSignal, setFitSignal] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [statusLoading, setStatusLoading] = useState<{ userId: string; status: string } | null>(
    null,
  );
  const [verifLoading, setVerifLoading] = useState<string | null>(null);

  // Load users on component mount
  useEffect(() => {
    if (users.length === 0 && !usersLoading) {
      refreshUsers();
    }
  }, [users.length, usersLoading, refreshUsers]);

  // Deep-link: ?id=userId → auto-open that user's sheet
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (!targetId || users.length === 0) return;
    const target = users.find((u) => u.id === targetId);
    if (target) {
      setSelectedUser(target);
      setIsSheetOpen(true);
    }
  }, [searchParams, users]);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Filter and paginate users — only role === 'user', no guests
  const filteredUsers = users.filter((user) => {
    if (currentUserId && user.id === currentUserId) return false;
    if (user.role !== 'user') return false;
    if (user.full_name === 'Guest User') return false;
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesTab = true;
    if (activeTab === 'male') matchesTab = (user.gender || '').toLowerCase() === 'male';
    else if (activeTab === 'female') matchesTab = (user.gender || '').toLowerCase() === 'female';
    return matchesSearch && matchesTab;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const usersWithLocation = filteredUsers.filter(
    (u) => typeof u.latitude === 'number' && typeof u.longitude === 'number',
  ) as Array<User & { latitude: number; longitude: number }>;

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const handleCreate = async (userData: UserInsert) => {
    try {
      setModalLoading(true);

      // Get current user ID from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const response = await usersAPI.createUser({
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number || '',
        role: userData.role as 'admin' | 'user',
        gender: userData.gender || null,
        id: userData.id || crypto.randomUUID(),
        userId,
      });

      if (response.success && response.data) {
        addUser(response.data);
        setIsModalOpen(false);
        toast.success('User created successfully!');
      } else {
        // Show user-friendly error message
        const errorMsg = response.message || response.error || 'Failed to create user';
        toast.error(errorMsg);
        console.error('Failed to create user:', response.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred while creating the user. Please try again.');
      console.error('Failed to create user:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (id: string, userData: UserUpdate) => {
    try {
      setModalLoading(true);

      // Get current user ID from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const response = await usersAPI.updateUser(id, {
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        role: userData.role as 'admin' | 'user',
        gender: userData.gender || null,
        userId,
      });

      if (response.success && response.data) {
        updateUser(id, response.data);
        setIsModalOpen(false);
        setEditingUser(null);
        toast.success('User updated successfully!');
      } else {
        toast.error(response.message || response.error || 'Failed to update user');
        console.error('Failed to update user:', response.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred while updating the user. Please try again.');
      console.error('Failed to update user:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Prevent deleting own account
    if (currentUserId && id === currentUserId) {
      toast.error('You cannot delete your own account.');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      try {
        // Get current user ID from Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id;

        const response = await usersAPI.deleteUser(id, userId);
        if (response.success) {
          removeUser(id);
          toast.success('User deleted successfully!');
        } else {
          toast.error('Failed to delete user. Please try again.');
          console.error('Failed to delete user:', response.error);
        }
      } catch (error) {
        toast.error('An error occurred while deleting the user. Please try again.');
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleSuspendToggle = async (user: User) => {
    // Prevent suspending own account
    if (currentUserId && user.id === currentUserId) {
      toast.error('You cannot suspend your own account.');
      return;
    }

    const action = user.suspended ? 'Activate' : 'suspend';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        const userId = currentUser?.id;

        const response = await usersAPI.updateUser(user.id, {
          suspended: !user.suspended,
          userId,
        });

        if (response.success && response.data) {
          updateUser(user.id, response.data);
          toast.success(`User ${action == 'suspend' ? 'suspended' : 'activated'} successfully!`);
        } else {
          toast.error(`Failed to ${action} user. Please try again.`);
          console.error(`Failed to ${action} user:`, response.error);
        }
      } catch (error) {
        toast.error(`An error occurred while ${action}ing the user.`);
        console.error(`Failed to ${action} user:`, error);
      }
    }
  };

  const handleStatusChange = async (user: User, status: 'pending' | 'approved' | 'rejected') => {
    setStatusLoading({ userId: user.id, status });
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      const userId = currentUser?.id;

      const response = await usersAPI.updateUser(user.id, { status, userId });

      if (response.success && response.data) {
        updateUser(user.id, response.data);
        if (selectedUser?.id === user.id) setSelectedUser(response.data);
        toast.success(`User status changed to ${status}.`);
      } else {
        toast.error('Failed to change user status. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred while changing user status.');
      console.error('Failed to change user status:', error);
    } finally {
      setStatusLoading(null);
    }
  };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected' | null | undefined) => {
    if (!status) return null;
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return <Badge className={`text-xs capitalize ${styles[status]}`}>{status}</Badge>;
  };

  const handleVerificationChange = async (
    user: User,
    status: 'pending' | 'verified' | 'rejected',
  ) => {
    setVerifLoading(user.id);
    try {
      const { error } = await supabase
        .from('users')
        .update({ verification_status: status })
        .eq('id', user.id);
      if (error) throw error;
      const updated = { ...user, verification_status: status };
      updateUser(user.id, updated as User);
      if (selectedUser?.id === user.id) setSelectedUser(updated as User);
      toast.success(`Verification ${status === 'verified' ? 'approved' : 'rejected'}.`);
    } catch {
      toast.error('Failed to update verification status.');
    } finally {
      setVerifLoading(null);
    }
  };

  const getVerificationBadge = (
    status: 'pending' | 'verified' | 'rejected' | null | undefined,
  ) => {
    if (!status) return null;
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      verified: 'bg-blue-50 text-blue-700 border-blue-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels = { pending: 'Unverified', verified: 'Email Verified', rejected: 'Rejected' };
    return (
      <Badge className={`text-xs ${styles[status]}`}>{labels[status]}</Badge>
    );
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openUserSheet = (user: User) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'user':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'admin':
        return Crown;
      case 'user':
        return UserCheck;
      default:
        return UsersIcon;
    }
  };

  // Stats — only role === 'user', no guests
  const filteredUsersForStats = users.filter(
    (user) =>
      currentUserId &&
      user.id !== currentUserId &&
      user.role === 'user' &&
      user.full_name !== 'Guest User',
  );
  const genderStats = {
    male: filteredUsersForStats.filter((u) => (u.gender || '').toLowerCase() === 'male').length,
    female: filteredUsersForStats.filter((u) => (u.gender || '').toLowerCase() === 'female').length,
  };

  if (usersLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  const exportToPDF = (start: Date | null, end: Date | null) => {
    try {
      setIsExporting(true);
      const startTs = start ? new Date(start).setHours(0, 0, 0, 0) : null;
      const endTs   = end   ? new Date(end).setHours(23, 59, 59, 999) : null;
      const data = users.filter(u => {
        if (!u.created_at) return !startTs && !endTs;
        const ts = new Date(u.created_at).getTime();
        return (!startTs || ts >= startTs) && (!endTs || ts <= endTs);
      });
      const toRow = (u: User) => [u.full_name || 'Unknown', u.email ?? '', u.phone_number ?? '—', u.role || 'user', u.gender || '—', u.suspended ? 'Suspended' : (u.status || 'pending'), u.verification_status || 'pending', u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'];
      const timestamp = new Date().toLocaleString();
      const html = buildReportHtml({
        title: 'User Management Report',
        subtitle: start || end ? `${start?.toLocaleDateString() ?? '—'} → ${end?.toLocaleDateString() ?? '—'}` : undefined,
        timestamp,
        stats: [
          { label: 'Total', value: data.length },
          { label: 'Male', value: data.filter(u => u.gender === 'male').length },
          { label: 'Female', value: data.filter(u => u.gender === 'female').length },
          { label: 'Admins', value: data.filter(u => u.role === 'admin').length },
          { label: 'Sub-Admins', value: data.filter(u => u.role === 'sub_admin').length },
          { label: 'Suspended', value: data.filter(u => u.suspended).length },
        ],
        sections: [{ title: 'Users', headers: ['Name', 'Email', 'Phone', 'Role', 'Gender', 'Status', 'Verification', 'Join Date'], rows: data.map(toRow) }],
      });
      openPrintWindow(html);
    } catch (e) { console.error(e); alert('Export failed. Please try again.'); }
    finally { setIsExporting(false); }
  };

  const exportToExcel = (start: Date | null, end: Date | null) => {
    try {
      setIsExporting(true);
      const startTs = start ? new Date(start).setHours(0, 0, 0, 0) : null;
      const endTs   = end   ? new Date(end).setHours(23, 59, 59, 999) : null;
      const data = users.filter(u => {
        if (!u.created_at) return !startTs && !endTs;
        const ts = new Date(u.created_at).getTime();
        return (!startTs || ts >= startTs) && (!endTs || ts <= endTs);
      });
      const toRow = (u: User) => [u.full_name || 'Unknown', u.email ?? '', u.phone_number ?? '—', u.role || 'user', u.gender || '—', u.suspended ? 'Suspended' : (u.status || 'pending'), u.verification_status || 'pending', u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'];
      const timestamp = new Date().toLocaleString();
      buildExcelReport({
        title: 'User Management Report',
        filename: `users-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
        timestamp,
        stats: [
          { label: 'Total', value: data.length },
          { label: 'Male', value: data.filter(u => u.gender === 'male').length },
          { label: 'Female', value: data.filter(u => u.gender === 'female').length },
          { label: 'Admins', value: data.filter(u => u.role === 'admin').length },
          { label: 'Sub-Admins', value: data.filter(u => u.role === 'sub_admin').length },
          { label: 'Suspended', value: data.filter(u => u.suspended).length },
        ],
        sections: [{ title: 'Users', headers: ['Name', 'Email', 'Phone', 'Role', 'Gender', 'Status', 'Verification', 'Join Date'], rows: data.map(toRow) }],
        colWidths: [26, 34, 16, 12, 10, 14, 14, 14],
      });
    } catch (e) { console.error(e); alert('Export failed. Please try again.'); }
    finally { setIsExporting(false); }
  };

  return (
    <>
      {/* Empty state when no users exist */}
      {!usersLoading && users.length === 0 ? (
        <div className="min-h-screen bg-gray-50 md:bg-background">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="max-w-md mx-auto text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full">
                  <UsersIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">No Users Found</h2>
                <p className="mb-6 text-gray-600">
                  Get started by adding your first user to the system.
                </p>
              </div>

              <div className="space-y-4">
                <Button onClick={openCreateModal} className="w-full gap-2 md:w-auto">
                  <Plus className="w-4 h-4" />
                  Add First User
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen p-4 bg-[#f8fafc] md:p-6">
          <div className="mx-auto space-y-4 max-w-7xl">
            {/* Stripe-style: filter tabs + search + view toggle */}
            <div className="space-y-3">
              {/* Stat filter cards */}
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {[
                  { key: 'all', label: 'All', count: filteredUsersForStats.length },
                  { key: 'male', label: 'Male', count: genderStats.male },
                  { key: 'female', label: 'Female', count: genderStats.female },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex-1 min-w-[80px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeTab === tab.key
                        ? 'border-[#4988C4] bg-[#4988C4]/5 ring-1 ring-[#4988C4]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-500">{tab.label}</p>
                    <p className={`text-xl font-bold mt-0.5 tabular-nums leading-none ${
                      activeTab === tab.key ? 'text-[#4988C4]' : 'text-gray-900'
                    }`}>{tab.count}</p>
                  </button>
                ))}
              </div>
              {/* Search + view toggle */}
              <div className="flex items-center justify-end gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Search users..."
                    className="h-8 pl-8 text-sm w-48 border-gray-200 bg-white"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                <div className="flex border border-gray-200 rounded-md overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === 'table' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === 'map' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Map
                  </button>
                </div>
                <ExportPopover isExporting={isExporting} onExportPDF={exportToPDF} onExportExcel={exportToExcel} />
                <Button onClick={openCreateModal} className="h-8 gap-1.5 text-xs bg-[#4988C4] cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  Add User
                </Button>
              </div>
            </div>

            {/* Users Table or Map */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {viewMode === 'map' ? (
                <UsersLiveMap
                  users={usersWithLocation}
                  height="560px"
                  fitSignal={fitSignal}
                  onUserClick={(u) => openUserSheet(u)}
                  onCenterAll={() => setFitSignal((v) => v + 1)}
                />
              ) : (
                <>
                  {/* Mobile View - Stack Cards */}
                  <div className="block md:hidden">
                    <div className="divide-y divide-gray-200">
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map((user) => {
                          const RoleIcon = getRoleIcon(user.role);
                          return (
                            <div key={user.id} className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {user.full_name || 'No Name'}
                                    </p>
                                    <Badge className={`${getRoleColor(user.role)} text-xs`}>
                                      <RoleIcon className="w-3 h-3 mr-1" />
                                      {user.role}
                                    </Badge>
                                    {user.gender && (
                                      <Badge
                                        className={`text-xs ${
                                          user.gender.toLowerCase() === 'male'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-pink-50 text-pink-700 border-pink-200'
                                        }`}
                                      >
                                        {user.gender}
                                      </Badge>
                                    )}
                                    {user.suspended && (
                                      <Badge className="text-xs bg-red-100 text-red-800 border-red-300">
                                        Suspended
                                      </Badge>
                                    )}
                                    {getStatusBadge(user.status)}
                                  </div>
                                  <p className="mb-1 text-xs text-gray-500">{user.email}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      Phone: {user.phone_number || 'Not provided'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      Joined {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="w-8 h-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {user.full_name !== 'Guest User' && (
                                        <DropdownMenuItem
                                          onClick={() => openEditModal(user)}
                                          disabled={currentUserId === user.id}
                                          className="cursor-pointer"
                                        >
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => openUserSheet(user)}
                                        className="cursor-pointer"
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleSuspendToggle(user)}
                                        disabled={currentUserId === user.id}
                                        className={`cursor-pointer ${
                                          user.suspended ? 'text-green-600' : 'text-orange-600'
                                        }`}
                                      >
                                        {user.suspended ? (
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                        ) : (
                                          <Ban className="w-4 h-4 mr-2" />
                                        )}
                                        {user.suspended ? 'Unsuspend' : 'Suspend'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="cursor-pointer">
                                          <ListFilter className="w-4 h-4 mr-2" />
                                          Change Status
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {user.status !== 'pending' && (
                                            <DropdownMenuItem
                                              onClick={() => handleStatusChange(user, 'pending')}
                                              disabled={statusLoading !== null}
                                              className="cursor-pointer text-yellow-600"
                                            >
                                              {statusLoading?.userId === user.id &&
                                              statusLoading?.status === 'pending' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              ) : (
                                                <Clock className="w-4 h-4 mr-2" />
                                              )}
                                              Pending
                                            </DropdownMenuItem>
                                          )}
                                          {user.status !== 'approved' && (
                                            <DropdownMenuItem
                                              onClick={() => handleStatusChange(user, 'approved')}
                                              disabled={statusLoading !== null}
                                              className="cursor-pointer text-green-600"
                                            >
                                              {statusLoading?.userId === user.id &&
                                              statusLoading?.status === 'approved' ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              ) : (
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                              )}
                                              Approved
                                            </DropdownMenuItem>
                                          )}
                                          {user.status !== 'rejected' &&
                                            user.status !== 'approved' && (
                                              <DropdownMenuItem
                                                onClick={() => handleStatusChange(user, 'rejected')}
                                                disabled={statusLoading !== null}
                                                className="cursor-pointer text-red-600"
                                              >
                                                {statusLoading?.userId === user.id &&
                                                statusLoading?.status === 'rejected' ? (
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                  <XCircle className="w-4 h-4 mr-2" />
                                                )}
                                                Rejected
                                              </DropdownMenuItem>
                                            )}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(user.id)}
                                        disabled={currentUserId === user.id}
                                        className="text-red-600 cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <UsersIcon className="w-8 h-8 mx-auto mb-2" />
                          <p>No users found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden md:block">
                    {paginatedUsers.length > 0 ? (
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow className="border-b border-gray-100 bg-gray-50/80">
                            <TableHead className="w-[24%] px-4 py-2 text-xs font-medium text-gray-500">
                              User
                            </TableHead>
                            <TableHead className="w-[11%] px-4 py-2 text-xs font-medium text-gray-500">
                              Role
                            </TableHead>
                            <TableHead className="w-[9%] px-4 py-2 text-xs font-medium text-gray-500">
                              Gender
                            </TableHead>
                            <TableHead className="w-[14%] px-4 py-2 text-xs font-medium text-gray-500">
                              Phone
                            </TableHead>
                            <TableHead className="w-[12%] px-4 py-2 text-xs font-medium text-gray-500">
                              Joined
                            </TableHead>
                            <TableHead className="w-[12%] px-4 py-2 text-xs font-medium text-gray-500">
                              Status
                            </TableHead>
                            <TableHead className="w-[18%] px-4 py-2 text-xs font-medium text-gray-500 text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedUsers.map((user) => {
                            const RoleIcon = getRoleIcon(user.role);
                            return (
                              <TableRow
                                key={user.id}
                                className="hover:bg-gray-50/50 transition-colors border-b border-gray-100"
                              >
                                <TableCell className="w-[24%] px-4 py-2.5">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {user.full_name || 'No Name'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500">{user.email}</span>
                                      {user.suspended && (
                                        <Badge className="px-1 py-0 text-[10px] bg-red-100 text-red-800 border-red-300">
                                          Suspended
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="w-[11%] px-4 py-2.5">
                                  <Badge className={`${getRoleColor(user.role)} text-xs`}>
                                    <RoleIcon className="w-3 h-3 mr-1" />
                                    {user.role || 'user'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-[9%] px-4 py-2.5">
                                  {user.gender ? (
                                    <Badge
                                      className={`text-xs ${
                                        user.gender.toLowerCase() === 'male'
                                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                                          : 'bg-pink-50 text-pink-700 border-pink-200'
                                      }`}
                                    >
                                      {user.gender}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="w-[14%] px-4 py-2.5 text-gray-600">
                                  <div className="text-sm">
                                    {user.phone_number || 'Not provided'}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[12%] px-4 py-2.5 text-gray-600">
                                  <div className="text-sm">
                                    {new Date(user.created_at).toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[12%] px-4 py-2.5">
                                  {getStatusBadge(user.status) ?? (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="w-[18%] px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1 ml-auto">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="w-8 h-8 p-0">
                                          <span className="sr-only">Open menu</span>
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {user.full_name !== 'Guest User' && (
                                          <DropdownMenuItem
                                            onClick={() => openEditModal(user)}
                                            disabled={currentUserId === user.id}
                                            className="cursor-pointer"
                                          >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => openUserSheet(user)}
                                          className="cursor-pointer"
                                        >
                                          <Eye className="w-4 h-4 mr-2" />
                                          View details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleSuspendToggle(user)}
                                          disabled={currentUserId === user.id}
                                          className={`cursor-pointer ${
                                            user.suspended ? 'text-green-600' : 'text-orange-600'
                                          }`}
                                        >
                                          {user.suspended ? (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                          ) : (
                                            <Ban className="w-4 h-4 mr-2" />
                                          )}
                                          {user.suspended ? 'Activate' : 'Suspend'}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger className="cursor-pointer">
                                            <ListFilter className="w-4 h-4 mr-2" />
                                            Change Status
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            {user.status !== 'pending' && (
                                              <DropdownMenuItem
                                                onClick={() => handleStatusChange(user, 'pending')}
                                                disabled={statusLoading !== null}
                                                className="cursor-pointer text-yellow-600"
                                              >
                                                {statusLoading?.userId === user.id &&
                                                statusLoading?.status === 'pending' ? (
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                  <Clock className="w-4 h-4 mr-2" />
                                                )}
                                                Pending
                                              </DropdownMenuItem>
                                            )}
                                            {user.status !== 'approved' && (
                                              <DropdownMenuItem
                                                onClick={() => handleStatusChange(user, 'approved')}
                                                disabled={statusLoading !== null}
                                                className="cursor-pointer text-green-600"
                                              >
                                                {statusLoading?.userId === user.id &&
                                                statusLoading?.status === 'approved' ? (
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                                )}
                                                Approved
                                              </DropdownMenuItem>
                                            )}
                                            {user.status !== 'rejected' &&
                                              user.status !== 'approved' && (
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    handleStatusChange(user, 'rejected')
                                                  }
                                                  disabled={statusLoading !== null}
                                                  className="cursor-pointer text-red-600"
                                                >
                                                  {statusLoading?.userId === user.id &&
                                                  statusLoading?.status === 'rejected' ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  ) : (
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                  )}
                                                  Rejected
                                                </DropdownMenuItem>
                                              )}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(user.id)}
                                          disabled={currentUserId === user.id}
                                          className="text-red-600 cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <UsersIcon className="w-8 h-8 mx-auto mb-2" />
                        <p>No users found</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {filteredUsers.length > itemsPerPage && (
                    <div className="p-4 border-t border-gray-200">
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredUsers.length}
                        itemsPerPage={itemsPerPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={
          editingUser
            ? (data) => handleUpdate(editingUser.id, data as UserUpdate)
            : (data) => handleCreate(data as UserInsert)
        }
        loading={modalLoading}
      />

      {/* Right-side User Details Sheet */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <SheetContent className="sm:max-w-lg p-0 flex flex-col gap-0">
          {selectedUser && (
            <>
              {/* Hero */}
              <div className="relative bg-gradient-to-br from-[#4988C4] to-[#2d6fa8] px-6 pt-10 pb-6">
                <div className="flex flex-col items-center text-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white/20 flex items-center justify-center">
                      {selectedUser.profile_picture ? (
                        <img
                          src={selectedUser.profile_picture}
                          alt={selectedUser.full_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className="text-white text-2xl font-bold select-none"
                        style={{ display: selectedUser.profile_picture ? 'none' : 'flex' }}
                      >
                        {(selectedUser.full_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Online dot based on having location */}
                    {selectedUser.latitude && selectedUser.longitude && (
                      <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {selectedUser.full_name || 'No Name'}
                    </h2>
                    <p className="text-blue-100 text-sm mt-0.5">{selectedUser.email || '—'}</p>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <Badge className={`${getRoleColor(selectedUser.role)} text-xs border`}>
                      {selectedUser.role === 'admin' ? (
                        <Crown className="w-3 h-3 mr-1" />
                      ) : (
                        <UserCheck className="w-3 h-3 mr-1" />
                      )}
                      {selectedUser.role || 'user'}
                    </Badge>
                    {selectedUser.suspended ? (
                      <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                        <Ban className="w-3 h-3 mr-1" />
                        Suspended
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Contact Info */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Contact
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400">Email</p>
                        <p className="text-sm text-gray-800 truncate">
                          {selectedUser.email || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Phone</p>
                        <p className="text-sm text-gray-800">{selectedUser.phone_number || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Personal Info */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Personal
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <UserIcon className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Gender</p>
                        {selectedUser.gender ? (
                          <Badge
                            className={`text-xs mt-0.5 ${
                              selectedUser.gender.toLowerCase() === 'male'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-pink-50 text-pink-700 border-pink-200'
                            }`}
                          >
                            {selectedUser.gender}
                          </Badge>
                        ) : (
                          <p className="text-sm text-gray-400">—</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Birthday</p>
                        <p className="text-sm text-gray-800">
                          {selectedUser.birth_date
                            ? new Date(selectedUser.birth_date).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Joined</p>
                        <p className="text-sm text-gray-800">
                          {new Date(selectedUser.created_at).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {selectedUser.latitude && selectedUser.longitude ? (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4 text-teal-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Location</p>
                          <p className="text-xs text-gray-800 font-mono">
                            {selectedUser.latitude.toFixed(4)}, {selectedUser.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* ID Picture */}
                {selectedUser.id_picture && (
                  <>
                    <div className="border-t border-gray-100" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                        Government ID
                      </p>
                      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <img
                          src={selectedUser.id_picture}
                          alt="Government ID"
                          className="w-full object-cover max-h-52"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Verification Status */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Verification Status
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getVerificationBadge(selectedUser.verification_status as 'pending' | 'verified' | 'rejected' | null)}
                    {selectedUser.verification_status !== 'verified' && (
                      <button
                        onClick={() => handleVerificationChange(selectedUser, 'verified')}
                        disabled={verifLoading === selectedUser.id}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {verifLoading === selectedUser.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        Mark Verified
                      </button>
                    )}
                    {selectedUser.verification_status !== 'rejected' && (
                      <button
                        onClick={() => handleVerificationChange(selectedUser, 'rejected')}
                        disabled={verifLoading === selectedUser.id}
                        className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {verifLoading === selectedUser.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* User ID */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] text-gray-400">User ID</p>
                  <p className="text-xs text-gray-500 font-mono break-all mt-0.5">
                    {selectedUser.id}
                  </p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSheetOpen(false)}
                  className="mr-auto"
                >
                  Close
                </Button>
                {selectedUser.full_name !== 'Guest User' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsSheetOpen(false);
                      openEditModal(selectedUser);
                    }}
                    disabled={currentUserId === selectedUser.id}
                    className="gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                )}
                {selectedUser.status !== 'approved' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    onClick={() => handleStatusChange(selectedUser, 'approved')}
                    disabled={statusLoading !== null}
                  >
                    {statusLoading?.userId === selectedUser.id &&
                    statusLoading?.status === 'approved' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Approve
                  </Button>
                )}
                {selectedUser.status !== 'rejected' && selectedUser.status !== 'approved' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(selectedUser, 'rejected')}
                    disabled={statusLoading !== null}
                    className="gap-1.5"
                  >
                    {statusLoading?.userId === selectedUser.id &&
                    statusLoading?.status === 'rejected' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    Reject
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Modal component for creating/editing users
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: UserInsert | UserUpdate) => void;
  loading?: boolean;
}

function UserModal({ isOpen, onClose, user, onSave, loading = false }: UserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'user' as 'admin' | 'user' | 'sub_admin',
    gender: '',
  });
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhoneLocal = (value: string) => {
    if (!value) return null; // optional field
    if (!/^\d+$/.test(value)) return 'Digits only after +63';
    if (value.length !== 10) return 'Must be 10 digits after +63';
    if (!value.startsWith('9')) return 'Must start with 9 (e.g. 9XXXXXXXXX)';
    return null;
  };

  const parseStoredPhoneToLocal = (stored?: string | null) => {
    if (!stored) return '';
    const digits = (stored || '').replace(/\D/g, '');
    // If starts with country code 63
    if (digits.startsWith('63')) {
      return digits.slice(2, 12); // next 10 digits
    }
    // If local 11-digit starting with 0 (e.g., 09XXXXXXXXX)
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1); // drop leading 0 -> 10 digits
    }
    // If already 10-digit starting with 9
    if (digits.length === 10 && digits.startsWith('9')) {
      return digits;
    }
    return '';
  };

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        role: 'user',
        gender: user.gender || '',
      });
      const local = parseStoredPhoneToLocal(user.phone_number || '');
      setPhoneLocal(local);
      setPhoneError(validatePhoneLocal(local));
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'user',
        gender: '',
      });
      setPhoneLocal('');
      setPhoneError(null);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePhoneLocal(phoneLocal);
    setPhoneError(err);
    if (err) return;
    const payload = {
      ...formData,
      phone_number: phoneLocal ? `+63${phoneLocal}` : '',
    };
    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Update the user information below.'
              : 'Fill in the details to create a new user account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Janet Ayura"
              required
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="janet@example.com"
              required
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phone_number_local">Phone Number (Philippines)</Label>
            <div className="flex mt-2">
              <span className="inline-flex items-center px-3 text-sm text-gray-600 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                +63
              </span>
              <Input
                id="phone_number_local"
                type="tel"
                inputMode="numeric"
                value={phoneLocal}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const limited = raw.slice(0, 10);
                  setPhoneLocal(limited);
                  // Keep formData in sync as full international format
                  setFormData((prev) => ({
                    ...prev,
                    phone_number: limited ? `+63${limited}` : '',
                  }));
                  setPhoneError(validatePhoneLocal(limited));
                }}
                placeholder="9XXXXXXXXX"
                disabled={loading}
                className="rounded-l-none"
              />
            </div>
            {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
            {!phoneError && phoneLocal.length === 10 && (
              <p className="mt-1 text-xs text-gray-500">
                Full number will be saved as +63{phoneLocal}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  gender: value,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!phoneError}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {user ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {user ? 'Update User' : 'Create User'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
