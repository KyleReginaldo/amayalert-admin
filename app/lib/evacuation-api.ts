import { Database } from '@/database.types';

// Types
export type EvacuationCenter = Database['public']['Tables']['evacuation_centers']['Row'];
export type EvacuationCenterInsert =
  Database['public']['Tables']['evacuation_centers']['Insert'] & {
    userId?: string;
  };
export type EvacuationCenterUpdate =
  Database['public']['Tables']['evacuation_centers']['Update'] & {
    userId?: string;
  };
export type EvacuationStatus = Database['public']['Enums']['evacuation_status'];

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export interface EvacuationFilters {
  search?: string;
  status?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

export interface GoogleMapsLocation {
  lat: number;
  lng: number;
  address: string;
  placeId?: string;
}

const API_BASE_URL = '/api/evacuation';

class EvacuationAPI {
  // GET /api/evacuation - Fetch all evacuation centers with optional filtering
  async getAllEvacuationCenters(
    filters?: EvacuationFilters,
  ): Promise<ApiResponse<EvacuationCenter[]>> {
    try {
      const searchParams = new URLSearchParams();

      if (filters?.search) searchParams.append('search', filters.search);
      if (filters?.status) searchParams.append('status', filters.status);
      if (filters?.minCapacity) searchParams.append('minCapacity', filters.minCapacity.toString());
      if (filters?.maxCapacity) searchParams.append('maxCapacity', filters.maxCapacity.toString());

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
      console.error('Error fetching evacuation centers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch evacuation centers',
      };
    }
  }

  // GET /api/evacuation/[id] - Fetch a specific evacuation center
  async getEvacuationCenter(id: number): Promise<ApiResponse<EvacuationCenter>> {
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
      console.error('Error fetching evacuation center:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch evacuation center',
      };
    }
  }

  // POST /api/evacuation - Create a new evacuation center
  async createEvacuationCenter(
    centerData: EvacuationCenterInsert,
  ): Promise<ApiResponse<EvacuationCenter>> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(centerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating evacuation center:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create evacuation center',
      };
    }
  }

  // PUT /api/evacuation/[id] - Update an existing evacuation center
  async updateEvacuationCenter(
    id: number,
    centerData: Partial<EvacuationCenterUpdate>,
  ): Promise<ApiResponse<EvacuationCenter>> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(centerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating evacuation center:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update evacuation center',
      };
    }
  }

  // DELETE /api/evacuation/[id] - Delete an evacuation center
  async deleteEvacuationCenter(
    id: number,
    userId?: string,
  ): Promise<ApiResponse<EvacuationCenter>> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting evacuation center:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete evacuation center',
      };
    }
  }

  // Helper method for geocoding address to coordinates
  async geocodeAddress(address: string): Promise<GoogleMapsLocation | null> {
    try {
      // This would use Google Maps Geocoding API
      // For now, returning a placeholder - you'll need to implement actual geocoding
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  // Helper method for reverse geocoding coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      // This would use Google Maps Reverse Geocoding API
      // For now, returning a placeholder - you'll need to implement actual reverse geocoding
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      const result = await response.json();
      return result.address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }
}

// Export singleton instance
export const evacuationAPI = new EvacuationAPI();

// Export default
export default evacuationAPI;
