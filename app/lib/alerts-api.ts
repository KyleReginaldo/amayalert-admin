import { Database } from '@/database.types';

// Use database types for the alert table
export type Alert = Database['public']['Tables']['alert']['Row'];
export type AlertInsert = Database['public']['Tables']['alert']['Insert'];
export type AlertUpdate = Database['public']['Tables']['alert']['Update'];

export interface NotificationStatus {
  sent: number;
  errors: string[];
}

export interface NotificationSummary {
  sms: NotificationStatus;
  email: NotificationStatus;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
  notifications?: NotificationSummary;
}

export interface AlertFilters {
  search?: string;
  alert_level?: string;
}

const API_BASE_URL = '/api/alerts';

class AlertsAPI {
  // GET /api/alerts - Fetch all alerts with optional filtering
  async getAllAlerts(filters?: AlertFilters): Promise<ApiResponse<Alert[]>> {
    try {
      const searchParams = new URLSearchParams();

      if (filters?.search) searchParams.append('search', filters.search);
      if (filters?.alert_level) searchParams.append('alert_level', filters.alert_level);

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
      console.error('Error fetching alerts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      };
    }
  }

  // GET /api/alerts/[id] - Fetch a specific alert
  async getAlert(id: number): Promise<ApiResponse<Alert>> {
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
      console.error('Error fetching alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alert',
      };
    }
  }

  // POST /api/alerts - Create a new alert
  async createAlert(alertData: AlertInsert): Promise<ApiResponse<Alert>> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create alert',
      };
    }
  }

  // PUT /api/alerts/[id] - Update an existing alert
  async updateAlert(id: number, alertData: AlertUpdate): Promise<ApiResponse<Alert>> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update alert',
      };
    }
  }

  // DELETE /api/alerts/[id] - Delete an alert
  async deleteAlert(id: number): Promise<ApiResponse<Alert>> {
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
      console.error('Error deleting alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete alert',
      };
    }
  }

  // Helper method to send/publish an alert (for future implementation)
  async sendAlert(id: number): Promise<ApiResponse<Alert>> {
    try {
      // This could be a separate endpoint in the future
      // For now, we'll just fetch the alert to simulate sending
      return await this.getAlert(id);
    } catch (error) {
      console.error('Error sending alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send alert',
      };
    }
  }
}

// Export singleton instance
export const alertsAPI = new AlertsAPI();

// Export default
export default alertsAPI;
