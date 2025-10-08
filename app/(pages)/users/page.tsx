'use client';

import { supabase } from '@/app/client/supabase';
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
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
          className="gap-1 h-8 border-gray-300"
        >
          <ChevronLeft className="h-3 w-3" />
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
          className="gap-1 h-8 border-gray-300"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3 w-3" />
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

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
      const response = await usersAPI.createUser({
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number || '',
        role: userData.role as 'admin' | 'user',
        id: userData.id || crypto.randomUUID(),
      });

      if (response.success && response.data) {
        addUser(response.data);
        setIsModalOpen(false);
      } else {
        console.error('Failed to create user:', response.error);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (id: string, userData: UserUpdate) => {
    try {
      setModalLoading(true);
      const response = await usersAPI.updateUser(id, {
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        role: userData.role as 'admin' | 'user',
      });

      if (response.success && response.data) {
        updateUser(id, response.data);
        setIsModalOpen(false);
        setEditingUser(null);
      } else {
        console.error('Failed to update user:', response.error);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Prevent deleting own account
    if (currentUserId && id === currentUserId) {
      alert('You cannot delete your own account.');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await usersAPI.deleteUser(id);
        if (response.success) {
          removeUser(id);
        } else {
          console.error('Failed to delete user:', response.error);
        }
      } catch (error) {
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

  if (usersLoading && users.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  // Empty state when no users exist
  if (!usersLoading && users.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 md:bg-background">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
                  <UsersIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Users Found</h2>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first user to the system.
                </p>
              </div>

              <div className="space-y-4">
                <Button onClick={openCreateModal} className="w-full md:w-auto gap-2">
                  <Plus className="h-4 w-4" />
                  Add First User
                </Button>
              </div>
            </div>
          </div>
        </div>

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
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 md:bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 text-sm">Manage user accounts, roles, and permissions</p>
          </div>
          <Button onClick={openCreateModal} className="gap-2 w-full md:w-auto">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Minimal Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">With Phone</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.regular}</div>
            <div className="text-sm text-gray-600">Users</div>
          </div>
        </div>

        {/* Minimal Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-10 border-gray-300 focus:border-gray-400"
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
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                            <p className="font-medium text-sm text-gray-900">
                              {user.full_name || 'No Name'}
                            </p>
                            <Badge className={`${getRoleColor(user.role)} text-xs`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{user.email}</p>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            disabled={currentUserId === user.id}
                            className="h-8 w-8 rounded-full text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              currentUserId === user.id
                                ? 'Cannot edit your own account'
                                : 'Edit user'
                            }
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={currentUserId === user.id}
                            className="h-8 w-8 rounded-full text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              currentUserId === user.id
                                ? 'Cannot delete your own account'
                                : 'Delete user'
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            {paginatedUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="font-medium text-gray-900">User</TableHead>
                    <TableHead className="font-medium text-gray-900">Role</TableHead>
                    <TableHead className="font-medium text-gray-900">Phone</TableHead>
                    <TableHead className="font-medium text-gray-900">Joined</TableHead>
                    <TableHead className="font-medium text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50 border-gray-200">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(user.role)} text-xs`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="text-sm">{user.phone_number || 'Not provided'}</div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              disabled={currentUserId === user.id}
                              className="h-8 w-8 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                currentUserId === user.id
                                  ? 'Cannot edit your own account'
                                  : 'Edit user'
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              disabled={currentUserId === user.id}
                              className="h-8 w-8 text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                currentUserId === user.id
                                  ? 'Cannot delete your own account'
                                  : 'Delete user'
                              }
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="h-8 w-8 mx-auto mb-2" />
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
        </div>
      </div>

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
    </div>
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
    role: 'user' as 'admin' | 'user',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email,
        phone_number: user.phone_number || '',
        role: user.role || 'user',
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'user',
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+6390000000000"
              disabled={loading}
              className="mt-2"
            />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {user ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
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
