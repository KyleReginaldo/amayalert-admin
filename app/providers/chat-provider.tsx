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

    const channel = supabase
      .channel('admin-chat-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new as { receiver?: string; sender?: string; seen_at?: string | null };

        // Refresh count when messages are inserted, updated, or deleted
        if (payload.eventType === 'INSERT') {
          // If new message to current admin
          if (row?.receiver === currentUserId) {
            setTotalUnreadCount((prev) => prev + 1);
          }
        } else if (payload.eventType === 'UPDATE') {
          // If message was marked as seen
          const oldRow = payload.old as { receiver?: string; seen_at?: string | null };
          if (
            row?.receiver === currentUserId &&
            oldRow?.seen_at === null &&
            row?.seen_at !== null
          ) {
            setTotalUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

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
