import { Database } from '@/database.types';

// Types
export type Rescue = Database['public']['Tables']['rescues']['Row'];
export type RescueInsert = Database['public']['Tables']['rescues']['Insert'];
export type RescueUpdate = Database['public']['Tables']['rescues']['Update'];
export type RescueStatus = Database['public']['Enums']['rescue_status'];

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export interface RescueFilters {
  search?: string;
  status?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
}

export interface RescueLocation {
  lat: number;
  lng: number;
  address?: string;
}

const API_BASE_URL = '/api/rescues';

class RescueAPI {
  // GET /api/rescues - Fetch all rescues with optional filtering
  async getAllRescues(filters?: RescueFilters): Promise<ApiResponse<Rescue[]>> {
    try {
      const searchParams = new URLSearchParams();

      if (filters?.search) searchParams.append('search', filters.search);
      if (filters?.status) searchParams.append('status', filters.status);
      if (filters?.priority) searchParams.append('priority', filters.priority.toString());
      if (filters?.startDate) searchParams.append('startDate', filters.startDate);
      if (filters?.endDate) searchParams.append('endDate', filters.endDate);

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
      console.error('Error fetching rescues:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rescues',
      };
    }
  }

  // GET /api/rescues/[id] - Fetch a specific rescue
  async getRescue(id: string): Promise<ApiResponse<Rescue>> {
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
      console.error('Error fetching rescue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rescue',
      };
    }
  }

  // POST /api/rescues - Create a new rescue
  async createRescue(rescueData: RescueInsert): Promise<ApiResponse<Rescue>> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rescueData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating rescue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create rescue',
      };
    }
  }

  // PUT /api/rescues/[id] - Update an existing rescue
  async updateRescue(id: string, rescueData: Partial<RescueUpdate>): Promise<ApiResponse<Rescue>> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rescueData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating rescue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update rescue',
      };
    }
  }

  // DELETE /api/rescues/[id] - Delete a rescue
  async deleteRescue(id: string): Promise<ApiResponse<Rescue>> {
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
      console.error('Error deleting rescue:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete rescue',
      };
    }
  }

  // PUT /api/rescues/[id]/status - Update rescue status
  async updateRescueStatus(
    id: string,
    status: RescueStatus,
    completedAt?: string,
  ): Promise<ApiResponse<Rescue>> {
    try {
      const updateData: Partial<RescueUpdate> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed' && completedAt) {
        updateData.completed_at = completedAt;
      }

      return await this.updateRescue(id, updateData);
    } catch (error) {
      console.error('Error updating rescue status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update rescue status',
      };
    }
  }

  // Helper method to format rescue priority
  formatPriority(priority: number): string {
    switch (priority) {
      case 1:
        return 'Critical';
      case 2:
        return 'High';
      case 3:
        return 'Medium';
      case 4:
        return 'Low';
      default:
        return 'Unknown';
    }
  }

  // Helper method to get priority color
  getPriorityColor(priority: number): string {
    switch (priority) {
      case 1:
        return 'text-red-600 bg-red-50 border-red-200';
      case 2:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 3:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 4:
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  // Helper method to format status
  formatStatus(status: RescueStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  // Helper method to get status color
  getStatusColor(status: RescueStatus): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'in_progress':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'completed':
        return 'text-green-700 bg-green-100 border-green-300';
      case 'cancelled':
        return 'text-red-700 bg-red-100 border-red-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  }
}

// Export singleton instance
export const rescueAPI = new RescueAPI();

// Export default
export default rescueAPI;
