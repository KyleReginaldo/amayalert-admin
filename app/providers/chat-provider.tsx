'use client';

import { supabase } from '@/app/client/supabase';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ChatContextType {
  totalUnreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current admin user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Function to fetch total unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver', currentUserId)
      .is('seen_at', null);

    if (!error && data) {
      setTotalUnreadCount(data.length);
    }
  }, [currentUserId]);

  // Initial load of unread count
  useEffect(() => {
    if (currentUserId) {
      refreshUnreadCount();
    }
  }, [currentUserId, refreshUnreadCount]);

  // Real-time subscription for unread count updates
  useEffect(() => {
    if (!currentUserId) return;

    // Clean up any existing channel for safety (Supabase handles duplicates, but explicit remove helps during hot reloads)
    const channel = supabase.channel('admin-chat-unread');

    // INSERT: New incoming message for current user increments if unseen
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver=eq.${currentUserId}`,
      },
      (payload) => {
        const newRow = payload.new as { seen_at?: string | null };
        if (!newRow?.seen_at) {
          setTotalUnreadCount((prev) => prev + 1);
        } else {
          refreshUnreadCount();
        }
      },
    );

    // UPDATE: Message marked seen (transition to seen_at set) should decrement
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver=eq.${currentUserId}`,
      },
      (payload) => {
        const newRow = payload.new as { seen_at?: string | null };
        const oldRow = payload.old as { seen_at?: string | null };
        if (oldRow && oldRow.seen_at === null && newRow?.seen_at) {
          setTotalUnreadCount((prev) => Math.max(0, prev - 1));
        } else {
          refreshUnreadCount();
        }
      },
    );

    // DELETE: If an unread message was deleted, decrement; else fallback refresh
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `receiver=eq.${currentUserId}`,
      },
      (payload) => {
        const oldRow = payload.old as { seen_at?: string | null };
        if (oldRow && oldRow.seen_at === null) {
          setTotalUnreadCount((prev) => Math.max(0, prev - 1));
        } else {
          refreshUnreadCount();
        }
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refreshUnreadCount]);

  // Periodic fallback refresh (guards against missed realtime events / network hiccups)
  useEffect(() => {
    if (!currentUserId) return;
    const id = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // 30s interval
    return () => clearInterval(id);
  }, [currentUserId, refreshUnreadCount]);

  return (
    <ChatContext.Provider value={{ totalUnreadCount, refreshUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
