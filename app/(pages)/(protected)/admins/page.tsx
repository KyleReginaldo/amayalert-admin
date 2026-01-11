'use client';

import { supabase } from '@/app/client/supabase';
import { PageHeader } from '@/app/components/page-header';
import { getAdminStatColor } from '@/app/core/utils/utils';
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
import { Database } from '@/database.types';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Crown,
  Edit,
  Eye,
  Loader2,
  Plus,
  Save,
  Search,
  Shield,
  Square,
  Trash2,
  UserCheck,
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

export default function AdminsPage() {
  const { users, usersLoading, refreshUsers, addUser, updateUser, removeUser } = useData();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

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

  // Filter only admins (excluding current user)
  const admins = users.filter(
    (user) => user.role === 'sub_admin' && (!currentUserId || user.id !== currentUserId),
  );

  // Filter by search term
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreate = async (userData: UserInsert) => {
    try {
      setModalLoading(true);

      // Get current user ID from Supabase

      const response = await usersAPI.createUser({
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number || '',
        role: 'sub_admin',
        gender: userData.gender || null,
        modules: userData.modules || [],
        id: userData.id || crypto.randomUUID(),
      });

      if (response.success && response.data) {
        addUser(response.data);
        setIsModalOpen(false);
        alert(
          `✅ Admin created successfully!\n\n` +
            `An email has been sent to ${userData.email} with:\n` +
            `• Login credentials\n` +
            `• Sign-in link\n` +
            `• Module access details\n\n` +
            `The new admin can now access the system.`,
        );
      } else {
        console.error('Failed to create admin:', response.error);
        alert(`Failed to create admin: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to create admin:', error);
      alert('Failed to create admin. Please try again.');
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
        role: 'sub_admin', // Keep sub_admin role
        gender: userData.gender || null,
        modules: userData.modules || [],
        userId,
      });

      if (response.success && response.data) {
        updateUser(id, response.data);
        setIsModalOpen(false);
        setEditingAdmin(null);
      } else {
        console.error('Failed to update admin:', response.error);
        alert(`Failed to update admin: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to update admin:', error);
      alert('Failed to update admin. Please try again.');
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

    if (confirm('Are you sure you want to remove admin privileges from this user?')) {
      try {
        // Get current user ID from Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id;

        const response = await usersAPI.deleteUser(id, userId);
        if (response.success) {
          removeUser(id);
        } else {
          console.error('Failed to delete admin:', response.error);
          alert(`Failed to delete admin: ${response.error}`);
        }
      } catch (error) {
        console.error('Failed to delete admin:', error);
        alert('Failed to delete admin. Please try again.');
      }
    }
  };

  const handleDemoteToUser = async (id: string) => {
    if (currentUserId && id === currentUserId) {
      alert('You cannot demote your own account.');
      return;
    }

    if (confirm('Are you sure you want to demote this admin to a regular user?')) {
      try {
        setModalLoading(true);
        const admin = admins.find((a) => a.id === id);
        if (!admin) return;

        const response = await usersAPI.updateUser(id, {
          role: 'user',
        });

        if (response.success && response.data) {
          updateUser(id, response.data);
          alert('Admin successfully demoted to user.');
        } else {
          console.error('Failed to demote admin:', response.error);
          alert(`Failed to demote admin: ${response.error}`);
        }
      } catch (error) {
        console.error('Failed to demote admin:', error);
        alert('Failed to demote admin. Please try again.');
      } finally {
        setModalLoading(false);
      }
    }
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setIsModalOpen(true);
  };

  const openEditModal = (admin: User) => {
    setEditingAdmin(admin);
    setIsModalOpen(true);
  };

  const openAdminSheet = (admin: User) => {
    setSelectedAdmin(admin);
    setIsSheetOpen(true);
  };

  // Calculate statistics
  const stats = {
    total: admins.length,
    withPhone: admins.filter((a) => a.phone_number && a.phone_number.length > 0).length,
    male: admins.filter((a) => (a.gender || '').toLowerCase() === 'male').length,
    female: admins.filter((a) => (a.gender || '').toLowerCase() === 'female').length,
  };

  if (usersLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading admins...</span>
        </div>
      </div>
    );
  }

  // Empty state when no admins exist
  if (!usersLoading && admins.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 md:bg-background">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="max-w-md mx-auto text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full">
                  <Shield className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">No Admins Found</h2>
                <p className="mb-6 text-gray-600">
                  Get started by adding your first admin to the system.
                </p>
              </div>

              <div className="space-y-4">
                <Button onClick={openCreateModal} className="w-full gap-2 md:w-auto">
                  <Plus className="w-4 h-4" />
                  Add First Admin
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAdmin(null);
          }}
          admin={editingAdmin}
          onSave={
            editingAdmin
              ? (data) => handleUpdate(editingAdmin.id, data as UserUpdate)
              : (data) => handleCreate(data as UserInsert)
          }
          loading={modalLoading}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50 md:bg-background md:p-6">
      <div className="mx-auto space-y-6 max-w-7xl">
        {/* Header */}
        <PageHeader
          title="Admin Management"
          subtitle="Manage administrator accounts and permissions"
          action={
            <Button onClick={openCreateModal} className="gap-2 bg-[#4988C4] cursor-pointer">
              <Plus className="w-4 h-4" />
              Add Admin
            </Button>
          }
        />

        {/* Minimal Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={`p-4 rounded-lg ${getAdminStatColor('total')}`}>
            <div className="text-2xl font-bold ">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Admins</div>
          </div>
          <div className={`p-4 rounded-lg ${getAdminStatColor('with-phone')}`}>
            <div className="text-2xl font-bold ">{stats.withPhone}</div>
            <div className="text-sm text-gray-600">With Phone</div>
          </div>
          <div className={`p-4 rounded-lg ${getAdminStatColor('male')}`}>
            <div className="text-2xl font-bold ">{stats.male}</div>
            <div className="text-sm text-gray-600">Male</div>
          </div>
          <div className={`p-4 rounded-lg ${getAdminStatColor('female')}`}>
            <div className="text-2xl font-bold ">{stats.female}</div>
            <div className="text-sm text-gray-600">Female</div>
          </div>
        </div>

        {/* Search Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <Input
              placeholder="Search admins..."
              className="w-full pl-10 border-gray-300 focus:border-gray-400 md:w-md"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Admins Table */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
          {/* Mobile View - Stack Cards */}
          <div className="block md:hidden">
            <div className="divide-y divide-gray-200">
              {paginatedAdmins.length > 0 ? (
                paginatedAdmins.map((admin) => {
                  return (
                    <div key={admin.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {admin.full_name || 'No Name'}
                            </p>
                            <Badge className="text-xs text-red-700 border-red-200 bg-red-50">
                              <Crown className="w-3 h-3 mr-1" />
                              Sub Admin
                            </Badge>
                            {admin.gender && (
                              <Badge
                                className={`text-xs ${
                                  admin.gender.toLowerCase() === 'male'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-pink-50 text-pink-700 border-pink-200'
                                }`}
                              >
                                {admin.gender}
                              </Badge>
                            )}
                          </div>
                          <p className="mb-1 text-xs text-gray-500">{admin.email}</p>
                          <p className="text-xs text-gray-500">
                            Modules: {admin.modules?.length || 0} / 8
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Phone: {admin.phone_number || 'Not provided'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              Joined {new Date(admin.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(admin)}
                            disabled={currentUserId === admin.id}
                            className="w-8 h-8 text-gray-600 rounded-full hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              currentUserId === admin.id
                                ? 'Cannot edit your own account'
                                : 'Edit admin'
                            }
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdminSheet(admin)}
                            className="w-8 h-8 text-gray-600 rounded-full hover:text-gray-900"
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(admin.id)}
                            disabled={currentUserId === admin.id}
                            className="w-8 h-8 text-gray-600 rounded-full hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              currentUserId === admin.id
                                ? 'Cannot delete your own account'
                                : 'Delete admin'
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
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <p>No admins found</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            {paginatedAdmins.length > 0 ? (
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="w-[30%] font-medium text-gray-900">Admin</TableHead>
                    <TableHead className="w-[10%] font-medium text-gray-900">Gender</TableHead>
                    <TableHead className="w-[20%] font-medium text-gray-900">Phone</TableHead>
                    <TableHead className="w-[20%] font-medium text-gray-900">Joined</TableHead>
                    <TableHead className="w-[20%] font-medium text-gray-900 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAdmins.map((admin) => {
                    return (
                      <TableRow key={admin.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell className="w-[30%]">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">
                                {admin.full_name || 'No Name'}
                              </div>
                              <Badge className="text-xs text-red-700 border-red-200 bg-red-50">
                                <Crown className="w-3 h-3 mr-1" />
                                Sub Admin
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">{admin.email}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                variant="outline"
                                className="text-xs text-purple-700 border-purple-200 bg-purple-50"
                              >
                                {admin.modules?.length || 0} / 8 modules
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[10%]">
                          {admin.gender ? (
                            <Badge
                              className={`text-xs ${
                                admin.gender.toLowerCase() === 'male'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-pink-50 text-pink-700 border-pink-200'
                              }`}
                            >
                              {admin.gender}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="w-[20%] text-gray-600">
                          <div className="text-sm">{admin.phone_number || 'Not provided'}</div>
                        </TableCell>
                        <TableCell className="w-[20%] text-gray-600">
                          <div className="text-sm">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="w-[20%] text-right">
                          <div className="flex items-center justify-end gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDemoteToUser(admin.id)}
                              disabled={currentUserId === admin.id}
                              className="w-8 h-8 text-gray-600 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                currentUserId === admin.id
                                  ? 'Cannot demote your own account'
                                  : 'Demote to user'
                              }
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(admin)}
                              disabled={currentUserId === admin.id}
                              className="w-8 h-8 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                currentUserId === admin.id
                                  ? 'Cannot edit your own account'
                                  : 'Edit admin'
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdminSheet(admin)}
                              className="w-8 h-8 text-gray-600 hover:text-gray-900"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(admin.id)}
                              disabled={currentUserId === admin.id}
                              className="w-8 h-8 text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                currentUserId === admin.id
                                  ? 'Cannot delete your own account'
                                  : 'Delete admin'
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
                <Shield className="w-8 h-8 mx-auto mb-2" />
                <p>No admins found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredAdmins.length > itemsPerPage && (
            <div className="p-4 border-t border-gray-200">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredAdmins.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAdmin(null);
        }}
        admin={editingAdmin}
        onSave={
          editingAdmin
            ? (data) => handleUpdate(editingAdmin.id, data as UserUpdate)
            : (data) => handleCreate(data as UserInsert)
        }
        loading={modalLoading}
      />

      {/* Right-side Admin Details Sheet */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setSelectedAdmin(null);
        }}
      >
        <SheetContent className="sm:max-w-xl">
          {selectedAdmin && (
            <div className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Admin Details</SheetTitle>
                <SheetDescription>Administrator profile information.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-3 overflow-auto text-sm text-gray-700">
                <div>
                  <div className="text-xs text-gray-500">Full name</div>
                  <div>{selectedAdmin.full_name || 'No Name'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div>{selectedAdmin.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Role</div>
                  <div className="inline-flex items-center gap-2">
                    <Badge className="text-xs text-red-700 border-red-200 bg-red-50">
                      <Crown className="w-3 h-3 mr-1" />
                      Sub Admin
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div>{selectedAdmin.phone_number || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Gender</div>
                  <div>
                    {selectedAdmin.gender ? (
                      <Badge
                        className={`text-xs ${
                          selectedAdmin.gender.toLowerCase() === 'male'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-pink-50 text-pink-700 border-pink-200'
                        }`}
                      >
                        {selectedAdmin.gender}
                      </Badge>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Joined</div>
                  <div>{new Date(selectedAdmin.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Module Access</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedAdmin.modules && selectedAdmin.modules.length > 0 ? (
                      selectedAdmin.modules.map((module) => (
                        <Badge
                          key={module}
                          variant="outline"
                          className="text-xs text-blue-700 capitalize border-blue-200 bg-blue-50"
                        >
                          {module}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No modules assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsSheetOpen(false);
                    openEditModal(selectedAdmin);
                  }}
                  disabled={currentUserId === selectedAdmin.id}
                  title={
                    currentUserId === selectedAdmin.id
                      ? 'Cannot edit your own account'
                      : 'Edit admin'
                  }
                >
                  Edit
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Modal component for creating/editing admins
interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: User | null;
  onSave: (data: UserInsert | UserUpdate) => void;
  loading?: boolean;
}

function AdminModal({ isOpen, onClose, admin, onSave, loading = false }: AdminModalProps) {
  type ModuleType = Database['public']['Enums']['modules'];

  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    phone_number: string;
    gender: string;
    modules: ModuleType[];
  }>({
    full_name: '',
    email: '',
    phone_number: '',
    gender: '',
    modules: [],
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
    if (digits.startsWith('63')) {
      return digits.slice(2, 12);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    if (digits.length === 10 && digits.startsWith('9')) {
      return digits;
    }
    return '';
  };

  const availableModules: { value: ModuleType; label: string }[] = [
    { value: 'rescue', label: 'Rescue Operations' },
    { value: 'alert', label: 'Alerts' },
    { value: 'evacuation', label: 'Evacuation Centers' },
    { value: 'user', label: 'User Management' },
    { value: 'admin', label: 'Admin Management' },
    { value: 'report', label: 'Reports' },
    { value: 'chat', label: 'Chat' },
  ];

  useEffect(() => {
    if (admin) {
      setFormData({
        full_name: admin.full_name || '',
        email: admin.email || '',
        phone_number: admin.phone_number || '',
        gender: admin.gender || '',
        modules: admin.modules || [],
      });
      const local = parseStoredPhoneToLocal(admin.phone_number || '');
      setPhoneLocal(local);
      setPhoneError(validatePhoneLocal(local));
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone_number: '',
        gender: '',
        modules: [],
      });
      setPhoneLocal('');
      setPhoneError(null);
    }
  }, [admin]);

  const toggleModule = (moduleValue: ModuleType) => {
    setFormData((prev) => {
      const modules = prev.modules.includes(moduleValue)
        ? prev.modules.filter((m) => m !== moduleValue)
        : [...prev.modules, moduleValue];
      return { ...prev, modules };
    });
  };

  const toggleAllModules = () => {
    setFormData((prev) => {
      const allSelected = prev.modules.length === availableModules.length;
      return {
        ...prev,
        modules: (allSelected ? [] : availableModules.map((m) => m.value)) as ModuleType[],
      };
    });
  };

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
          <DialogTitle>{admin ? 'Edit Admin' : 'Create New Admin'}</DialogTitle>
          <DialogDescription>
            {admin
              ? 'Update the administrator information below.'
              : 'Fill in the details to create a new admin account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Doe"
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
              placeholder="john@example.com"
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Module Access</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAllModules}
                disabled={loading}
                className="h-8 text-xs"
              >
                {formData.modules.length === availableModules.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 p-4 overflow-y-auto border border-gray-200 rounded-lg sm:grid-cols-2 max-h-60">
              {availableModules.map((module) => {
                const isSelected = formData.modules.includes(module.value);
                return (
                  <button
                    key={module.value}
                    type="button"
                    onClick={() => toggleModule(module.value)}
                    disabled={loading}
                    className={`flex items-center gap-2 p-3 border rounded-lg transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSelected ? (
                      <CheckSquare className="flex-shrink-0 w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="flex-shrink-0 w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={`text-sm ${
                        isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {module.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {formData.modules.length} of {availableModules.length} modules
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!phoneError}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {admin ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {admin ? 'Update Admin' : 'Create Admin'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
