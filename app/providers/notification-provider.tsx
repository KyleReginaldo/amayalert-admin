'use client';

import { supabase } from '@/app/client/supabase';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'report' | 'rescue' | 'alert' | 'evacuation' | 'user';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Fetch recent items on mount to seed notifications
  useEffect(() => {
    const fetchRecent = async () => {
      // Fetch recent reports (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [reportsRes, rescuesRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id, reason, reported_by, created_at')
          .gte('created_at', yesterday)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('rescues')
          .select('id, title, status, priority, emergency_type, created_at')
          .gte('created_at', yesterday)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const initial: Notification[] = [];

      if (reportsRes.data) {
        for (const r of reportsRes.data) {
          initial.push({
            id: `report-${r.id}`,
            type: 'report',
            title: 'New Report',
            description: `Report: ${r.reason}`,
            timestamp: r.created_at,
            read: false,
            actionUrl: '/reports',
          });
        }
      }

      if (rescuesRes.data) {
        for (const r of rescuesRes.data) {
          initial.push({
            id: `rescue-${r.id}`,
            type: 'rescue',
            title: `Rescue Request: ${r.title}`,
            description: `${r.emergency_type || 'Emergency'} - ${r.priority || 'Normal'} priority`,
            timestamp: r.created_at,
            read: false,
            actionUrl: '/rescue',
          });
        }
      }

      // Sort by timestamp descending
      initial.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(initial.slice(0, 50));
    };

    fetchRecent();
  }, []);

  // Real-time subscriptions for new events
  useEffect(() => {
    const channel = supabase.channel('admin-notifications');

    // New reports
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reports' },
      (payload) => {
        const row = payload.new as { id: number; reason: string; created_at: string };
        addNotification({
          type: 'report',
          title: 'New Report',
          description: `Report: ${row.reason}`,
          timestamp: row.created_at,
          actionUrl: '/reports',
        });
      },
    );

    // New rescue requests
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'rescues' },
      (payload) => {
        const row = payload.new as {
          id: number;
          title: string;
          emergency_type: string | null;
          priority: string | null;
          created_at: string;
        };
        addNotification({
          type: 'rescue',
          title: `Rescue Request: ${row.title}`,
          description: `${row.emergency_type || 'Emergency'} - ${row.priority || 'Normal'} priority`,
          timestamp: row.created_at,
          actionUrl: '/rescue',
        });
      },
    );

    // New alerts
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alert' },
      (payload) => {
        const row = payload.new as {
          id: number;
          title: string;
          alert_level: string;
          created_at: string;
        };
        addNotification({
          type: 'alert',
          title: `New Alert: ${row.title}`,
          description: `Alert level: ${row.alert_level}`,
          timestamp: row.created_at,
          actionUrl: '/alert',
        });
      },
    );

    // Evacuation center status changes
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'evacuation_centers' },
      (payload) => {
        const row = payload.new as {
          id: number;
          name: string;
          status: string;
          current_occupancy: number | null;
          capacity: number | null;
          created_at: string;
        };
        const oldRow = payload.old as { status?: string };
        if (oldRow.status !== row.status) {
          addNotification({
            type: 'evacuation',
            title: `Evacuation: ${row.name}`,
            description: `Status changed to ${row.status}`,
            timestamp: new Date().toISOString(),
            actionUrl: '/evacuation',
          });
        }
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
