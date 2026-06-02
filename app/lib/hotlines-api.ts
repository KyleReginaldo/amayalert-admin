import { Database } from '@/database.types';

export type Hotline = Database['public']['Tables']['emergency_hotlines']['Row'];
export type HotlineInsert = Database['public']['Tables']['emergency_hotlines']['Insert'] & { userId?: string };
export type HotlineUpdate = Database['public']['Tables']['emergency_hotlines']['Update'] & { userId?: string };

export const HOTLINE_CATEGORIES = [
  'Hospital',
  'Ambulance',
  'Police',
  'Fire',
  'Coast Guard',
  'Red Cross',
  'NDRRMC',
  'Barangay',
  'Other',
] as const;

export type HotlineCategory = (typeof HOTLINE_CATEGORIES)[number] | string;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

const BASE = '/api/hotlines';

class HotlinesAPI {
  async getAll(): Promise<ApiResponse<Hotline[]>> {
    try {
      const res = await fetch(BASE);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to fetch hotlines' };
    }
  }

  async create(data: HotlineInsert): Promise<ApiResponse<Hotline>> {
    try {
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to create hotline' };
    }
  }

  async update(id: number, data: HotlineUpdate): Promise<ApiResponse<Hotline>> {
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to update hotline' };
    }
  }

  async delete(id: number, userId?: string): Promise<ApiResponse<Hotline>> {
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to delete hotline' };
    }
  }
}

const hotlinesAPI = new HotlinesAPI();
export default hotlinesAPI;
