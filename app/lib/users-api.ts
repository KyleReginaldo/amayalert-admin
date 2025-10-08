import { Database } from '@/database.types';

// Use database types for the users table
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type UserRole = Database['public']['Enums']['user_role'];

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  created_after?: string;
  created_before?: string;
}

export interface UserStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
  userGrowth: number;
}

const API_BASE_URL = '/api/users';

class UsersAPI {
  // GET /api/users - Fetch all users with optional filtering
  async getAllUsers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    try {
      const searchParams = new URLSearchParams();

      if (filters?.search) searchParams.append('search', filters.search);
      if (filters?.role) searchParams.append('role', filters.role);
      if (filters?.created_after) searchParams.append('created_after', filters.created_after);
      if (filters?.created_before) searchParams.append('created_before', filters.created_before);

      const url = `${API_BASE_URL}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }

  // GET /api/users/[id] - Fetch a specific user
  async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
      };
    }
  }

  // POST /api/users - Create a new user
  async createUser(userData: UserInsert): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        // Try to get detailed error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the status message
          errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  // PUT /api/users/[id] - Update an existing user
  async updateUser(id: string, userData: UserUpdate): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  // DELETE /api/users/[id] - Delete a user
  async deleteUser(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  }

  // Helper method to get user statistics
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await this.getAllUsers();

      if (!response.success || !response.data) {
        return {
          totalUsers: 0,
          adminUsers: 0,
          regularUsers: 0,
          recentUsers: 0,
          userGrowth: 0,
        };
      }

      const users = response.data;
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentUsers = users.filter((user) => new Date(user.created_at) > oneWeekAgo).length;

      const usersThisMonth = users.filter((user) => new Date(user.created_at) > oneMonthAgo).length;

      const usersLastMonth = users.filter((user) => {
        const userDate = new Date(user.created_at);
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        return userDate > twoMonthsAgo && userDate <= oneMonthAgo;
      }).length;

      const userGrowth =
        usersLastMonth > 0
          ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
          : usersThisMonth > 0
          ? 100
          : 0;

      return {
        totalUsers: users.length,
        adminUsers: users.filter((user) => user.role === 'admin').length,
        regularUsers: users.filter((user) => user.role === 'user').length,
        recentUsers,
        userGrowth: Math.round(userGrowth * 10) / 10, // Round to 1 decimal place
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return {
        totalUsers: 0,
        adminUsers: 0,
        regularUsers: 0,
        recentUsers: 0,
        userGrowth: 0,
      };
    }
  }

  // Helper method to get recent users for dashboard
  async getRecentUsers(limit: number = 5): Promise<User[]> {
    try {
      const response = await this.getAllUsers();

      if (!response.success || !response.data) {
        return [];
      }

      return response.data
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent users:', error);
      return [];
    }
  }

  // Helper method to update user role
  async updateUserRole(id: string, role: UserRole): Promise<ApiResponse<User>> {
    return this.updateUser(id, { role });
  }

  // Helper method to search users
  async searchUsers(searchTerm: string): Promise<ApiResponse<User[]>> {
    return this.getAllUsers({ search: searchTerm });
  }

  // Helper method to get users by role
  async getUsersByRole(role: UserRole): Promise<ApiResponse<User[]>> {
    return this.getAllUsers({ role });
  }
}

// Export singleton instance
export const usersAPI = new UsersAPI();

// Export default
export default usersAPI;
