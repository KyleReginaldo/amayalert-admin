'use client';

import { supabase } from '@/app/client/supabase';
import { PageHeader } from '@/app/components/page-header';
import UsersLiveMap from '@/app/components/UsersLiveMap';
import { getUserStatColor } from '@/app/core/utils/utils';
import usersAPI, { User, UserInsert, UserUpdate } from '@/app/lib/users-api';
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
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Edit,
  Eye,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Load users on component mount
  useEffect(() => {
    if (users.length === 0 && !usersLoading) {
      refreshUsers();
    }
  }, [users.length, usersLoading, refreshUsers]);

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

  // Filter and paginate users (excluding current user)
  const filteredUsers = users.filter((user) => {
    // Exclude current user from the list
    if (currentUserId && user.id === currentUserId) {
      return false;
    }

    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
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

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
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
        // Show user-friendly error message
        const errorMsg = response.message || response.error || 'Failed to update user';
        toast.error('Failed to update user');
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

  // Calculate statistics (excluding current user)
  const filteredUsersForStats = users.filter((user) => currentUserId && user.id !== currentUserId);
  const stats = {
    total: filteredUsersForStats.length,
    active: filteredUsersForStats.filter((u) => u.phone_number && u.phone_number.length > 0).length,
    admins: filteredUsersForStats.filter((u) => u.role === 'admin').length,
    regular: filteredUsersForStats.filter((u) => u.role === 'user').length,
  };
  const genderStats = {
    male: users.filter((u) => (u.gender || '').toLowerCase() === 'male').length,
    female: users.filter((u) => (u.gender || '').toLowerCase() === 'female').length,
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
        <div className="min-h-screen p-4 bg-gray-50 md:bg-background md:p-6">
          <div className="mx-auto space-y-6 max-w-7xl">
            {/* Header */}
            <PageHeader
              title="User Management"
              subtitle="Manage user accounts, roles, and permissions"
              action={
                <Button onClick={openCreateModal} className="gap-2 bg-[#4988C4] cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              }
            />

            {/* Minimal Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <div className={`p-4 rounded-lg ${getUserStatColor('total')}`}>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className={`p-4 rounded-lg ${getUserStatColor('with-phone')}`}>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-gray-600">With Phone</div>
              </div>
              <div className={`p-4 rounded-lg ${getUserStatColor('admins')}`}>
                <div className="text-2xl font-bold ">{stats.admins}</div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className={`p-4 rounded-lg ${getUserStatColor('users')}`}>
                <div className="text-2xl font-bold">{stats.regular}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className={`p-4 rounded-lg ${getUserStatColor('male')}`}>
                <div className="text-2xl font-bold">{genderStats.male}</div>
                <div className="text-sm text-gray-600">Male Users</div>
              </div>
              <div className={`p-4 rounded-lg ${getUserStatColor('female')}`}>
                <div className="text-2xl font-bold">{genderStats.female}</div>
                <div className="text-sm text-gray-600">Female Users</div>
              </div>
            </div>

            {/* Minimal Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <Input
                  placeholder="Search users..."
                  className="w-full pl-10 border-gray-300 focus:border-gray-400 md:w-md"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-300">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-end">
              <div className="inline-flex overflow-hidden border border-gray-200 rounded-md">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === 'map'
                      ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Map
                </button>
              </div>
            </div>

            {/* Users Table or Map */}
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
              {viewMode === 'map' ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                      Showing {usersWithLocation.length} users with location
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshUsers()}
                      className="gap-2"
                      disabled={usersLoading}
                      title="Refresh user locations"
                    >
                      {usersLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>Refresh</>
                      )}
                    </Button>
                  </div>
                  <UsersLiveMap users={usersWithLocation} onUserClick={(u) => openUserSheet(u)} />
                  {usersWithLocation.length === 0 && (
                    <div className="mt-3 text-sm text-center text-gray-500">
                      No users with location data to display.
                    </div>
                  )}
                </div>
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
                                  {user.full_name !== 'Guest User' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(user)}
                                      disabled={currentUserId === user.id}
                                      className="w-8 h-8 text-gray-600 rounded-full hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={
                                        currentUserId === user.id
                                          ? 'Cannot edit your own account'
                                          : 'Edit user'
                                      }
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openUserSheet(user)}
                                    className="w-8 h-8 text-gray-600 rounded-full hover:text-gray-900"
                                    title={'View details'}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(user.id)}
                                    disabled={currentUserId === user.id}
                                    className="w-8 h-8 text-gray-600 rounded-full hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={
                                      currentUserId === user.id
                                        ? 'Cannot delete your own account'
                                        : 'Delete user'
                                    }
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
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
                          <TableRow className="border-gray-200">
                            <TableHead className="w-[28%] font-medium text-gray-900">
                              User
                            </TableHead>
                            <TableHead className="w-[12%] font-medium text-gray-900">
                              Role
                            </TableHead>
                            <TableHead className="w-[10%] font-medium text-gray-900">
                              Gender
                            </TableHead>
                            <TableHead className="w-[16%] font-medium text-gray-900">
                              Phone
                            </TableHead>
                            <TableHead className="w-[16%] font-medium text-gray-900">
                              Joined
                            </TableHead>
                            <TableHead className="w-[18%] font-medium text-gray-900 text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedUsers.map((user) => {
                            const RoleIcon = getRoleIcon(user.role);
                            return (
                              <TableRow key={user.id} className="border-gray-200 hover:bg-gray-50">
                                <TableCell className="w-[28%]">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {user.full_name || 'No Name'}
                                    </div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="w-[12%]">
                                  <Badge className={`${getRoleColor(user.role)} text-xs`}>
                                    <RoleIcon className="w-3 h-3 mr-1" />
                                    {user.role || 'user'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-[10%]">
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
                                <TableCell className="w-[16%] text-gray-600">
                                  <div className="text-sm">
                                    {user.phone_number || 'Not provided'}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[16%] text-gray-600">
                                  <div className="text-sm">
                                    {new Date(user.created_at).toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell className="w-[18%] text-right">
                                  <div className="flex items-center justify-end gap-1 ml-auto">
                                    {user.full_name !== 'Guest User' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditModal(user)}
                                        disabled={currentUserId === user.id}
                                        className="w-8 h-8 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={
                                          currentUserId === user.id
                                            ? 'Cannot edit your own account'
                                            : 'Edit user'
                                        }
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openUserSheet(user)}
                                      className="w-8 h-8 text-gray-600 hover:text-gray-900"
                                      title={'View details'}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(user.id)}
                                      disabled={currentUserId === user.id}
                                      className="w-8 h-8 text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={
                                        currentUserId === user.id
                                          ? 'Cannot delete your own account'
                                          : 'Delete user'
                                      }
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
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
        <SheetContent className="sm:max-w-xl">
          {selectedUser && (
            <div className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>User Details</SheetTitle>
                <SheetDescription>Read-only profile snapshot.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-3 overflow-auto text-sm text-gray-700">
                <div>
                  <div className="text-xs text-gray-500">Full name</div>
                  <div>{selectedUser.full_name || 'No Name'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div>{selectedUser.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Role</div>
                  <div className="inline-flex items-center gap-2">
                    <Badge className={`${getRoleColor(selectedUser.role)} text-xs`}>
                      {selectedUser.role || 'user'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div>{selectedUser.phone_number || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Gender</div>
                  <div>
                    {selectedUser.gender ? (
                      <Badge
                        className={`text-xs ${
                          selectedUser.gender.toLowerCase() === 'male'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-pink-50 text-pink-700 border-pink-200'
                        }`}
                      >
                        {selectedUser.gender}
                      </Badge>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Joined</div>
                  <div>{new Date(selectedUser.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                  Close
                </Button>
                {selectedUser.full_name !== 'Guest User' && (
                  <Button
                    onClick={() => {
                      setIsSheetOpen(false);
                      openEditModal(selectedUser);
                    }}
                    disabled={currentUserId === selectedUser.id}
                    title={
                      currentUserId === selectedUser.id
                        ? 'Cannot edit your own account'
                        : 'Edit user'
                    }
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
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
        role: user.role || 'user',
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
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value as 'admin' | 'user',
                }))
              }
              disabled={loading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
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
