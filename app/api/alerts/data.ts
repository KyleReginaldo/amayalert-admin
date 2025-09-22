// Types
export interface Post {
  id: number;
  content: string;
  user: string;
  visibility: 'public' | 'private' | 'admin_only';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  type: 'information' | 'announcement' | 'warning' | 'emergency';
  created_at: string;
  updated_at?: string;
}

// In-memory storage (replace with database in production)
export const alertsData: Post[] = [
  {
    id: 1,
    content: 'Emergency evacuation alert for downtown area due to flooding',
    user: 'Emergency Services',
    visibility: 'public',
    urgency: 'critical',
    location: 'Downtown District',
    type: 'emergency',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    content: 'Scheduled maintenance on water supply system',
    user: 'City Utilities',
    visibility: 'public',
    urgency: 'medium',
    location: 'North Side',
    type: 'announcement',
    created_at: '2024-01-14T14:20:00Z',
  },
  {
    id: 3,
    content: 'Road closure on Main Street for construction',
    user: 'Transportation Dept',
    visibility: 'public',
    urgency: 'low',
    location: 'Main Street',
    type: 'information',
    created_at: '2024-01-13T09:15:00Z',
  },
  {
    id: 4,
    content: 'High wind warning for coastal areas',
    user: 'Weather Service',
    visibility: 'public',
    urgency: 'high',
    location: 'Coastal Areas',
    type: 'warning',
    created_at: '2024-01-12T16:45:00Z',
  },
  {
    id: 5,
    content: 'Internal security protocol update',
    user: 'Security Team',
    visibility: 'admin_only',
    urgency: 'medium',
    location: 'All Facilities',
    type: 'information',
    created_at: '2024-01-11T11:30:00Z',
  },
];

// Helper functions for data manipulation
export const getAllAlerts = () => alertsData;

export const getAlertById = (id: number) => alertsData.find((post) => post.id === id);

export const createAlert = (newAlert: Omit<Post, 'id' | 'created_at'>) => {
  const newId = Math.max(...alertsData.map((p) => p.id), 0) + 1;
  const alert: Post = {
    ...newAlert,
    id: newId,
    created_at: new Date().toISOString(),
  };
  alertsData.push(alert);
  return alert;
};

export const updateAlert = (id: number, updates: Partial<Omit<Post, 'id' | 'created_at'>>) => {
  const index = alertsData.findIndex((post) => post.id === id);
  if (index === -1) return null;

  alertsData[index] = {
    ...alertsData[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return alertsData[index];
};

export const deleteAlert = (id: number) => {
  const index = alertsData.findIndex((post) => post.id === id);
  if (index === -1) return null;

  return alertsData.splice(index, 1)[0];
};

// Filtering functions
export const filterAlerts = (filters: {
  search?: string;
  type?: string;
  urgency?: string;
  visibility?: string;
}) => {
  let filtered = [...alertsData];

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (post) =>
        post.content?.toLowerCase().includes(search) ||
        post.location?.toLowerCase().includes(search) ||
        post.user?.toLowerCase().includes(search),
    );
  }

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter((post) => post.type === filters.type);
  }

  if (filters.urgency && filters.urgency !== 'all') {
    filtered = filtered.filter((post) => post.urgency === filters.urgency);
  }

  if (filters.visibility && filters.visibility !== 'all') {
    filtered = filtered.filter((post) => post.visibility === filters.visibility);
  }

  // Sort by created date (newest first)
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return filtered;
};
