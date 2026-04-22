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

const STORAGE_KEY = 'admin_notif_read_ids';

function loadReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    // Cap at 1000 to prevent unbounded growth; keep newest (tail)
    const arr = Array.from(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-1000)));
  } catch {}
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'read'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const readIds = loadReadIds();
    const newNotif: Notification = { ...notif, id, read: readIds.has(id) };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const ids = loadReadIds();
    ids.add(id);
    saveReadIds(ids);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const ids = loadReadIds();
      prev.forEach((n) => ids.add(n.id));
      saveReadIds(ids);
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications((prev) => {
      const ids = loadReadIds();
      prev.forEach((n) => ids.add(n.id));
      saveReadIds(ids);
      return [];
    });
  }, []);

  // Seed notifications from recent DB records on mount
  useEffect(() => {
    const fetchRecent = async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const readIds = loadReadIds();

      const [reportsRes, rescuesRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id, reason, created_at')
          .gte('created_at', yesterday)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('rescues')
          .select('id, title, status, priority, emergency_type, created_at')
          .gte('created_at', yesterday)
          // Completed/resolved rescues are no longer action items — skip them
          .not('status', 'in', '("completed","resolved","cancelled")')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const initial: Notification[] = [];

      if (reportsRes.data) {
        for (const r of reportsRes.data) {
          const id = `report-${r.id}`;
          initial.push({
            id,
            type: 'report',
            title: 'New Report',
            description: `Report: ${r.reason}`,
            timestamp: r.created_at,
            read: readIds.has(id),
            actionUrl: '/reports',
          });
        }
      }

      if (rescuesRes.data) {
        for (const r of rescuesRes.data) {
          const id = `rescue-${r.id}`;
          initial.push({
            id,
            type: 'rescue',
            title: `Rescue Request: ${r.title}`,
            description: `${r.emergency_type || 'Emergency'} - ${r.priority || 'Normal'} priority`,
            timestamp: r.created_at,
            read: readIds.has(id),
            actionUrl: '/rescue',
          });
        }
      }

      initial.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(initial.slice(0, 50));
    };

    fetchRecent();
  }, []);

  // Remove rescue notification when it gets completed/resolved/cancelled
  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications-rescue-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rescues' },
        (payload) => {
          const row = payload.new as { id: number; status: string };
          if (['completed', 'resolved', 'cancelled'].includes(row.status)) {
            const id = `rescue-${row.id}`;
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            // Also mark as read in storage so it won't reappear after refresh
            const ids = loadReadIds();
            ids.add(id);
            saveReadIds(ids);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Real-time subscriptions for new events
  useEffect(() => {
    const channel = supabase.channel('admin-notifications');

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

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'evacuation_centers' },
      (payload) => {
        const row = payload.new as {
          id: number;
          name: string;
          status: string;
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

    return () => { supabase.removeChannel(channel); };
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}>
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
