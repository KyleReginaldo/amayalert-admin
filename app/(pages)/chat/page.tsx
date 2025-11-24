'use client';

import { supabase } from '@/app/client/supabase';
import AuthWrapper from '@/app/components/auth-wrapper';
import ModuleGuard from '@/app/components/module-guard';
import { PageHeader } from '@/app/components/page-header';
import { useData } from '@/app/providers/data-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Database } from '@/database.types';
import { Loader2, Paperclip, Search, Send, User as UserIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Message = Database['public']['Tables']['messages']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function ChatPage() {
  const { users, usersLoading, refreshUsers } = useData();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load current admin user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Function to fetch unread message counts for all users
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUserId) return;

    const unreadCountsMap: Record<string, number> = {};

    // Get all users except current admin
    const usersToCheck = users.filter((u) => u.id !== currentUserId);

    for (const user of usersToCheck) {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('sender', user.id)
        .eq('receiver', currentUserId)
        .is('seen_at', null);

      if (!error && data) {
        unreadCountsMap[user.id] = data.length;
      }
    }

    setUnreadCounts(unreadCountsMap);
  }, [currentUserId, users]);

  // Fetch unread counts when current user is set or users change
  useEffect(() => {
    if (currentUserId && users.length > 0) {
      fetchUnreadCounts();
    }
  }, [currentUserId, users, fetchUnreadCounts]);

  // Ensure users are loaded
  useEffect(() => {
    if (!usersLoading && users.length === 0) {
      refreshUsers();
    }
  }, [users, usersLoading, refreshUsers]);

  // Filter users for left pane (exclude current admin)
  const filteredUsers = useMemo(() => {
    const s = search.toLowerCase();
    return users
      .filter((u) => (currentUserId ? u.id !== currentUserId : true))
      .filter((u) =>
        [u.full_name, u.email, u.phone_number].some(
          (v) => v?.toLowerCase().includes(s) && !v?.toLowerCase().includes('guest'),
        ),
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [users, search, currentUserId]);

  // Fetch conversation when selected user changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId || !selectedUser) return;
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender.eq.${currentUserId},receiver.eq.${selectedUser.id}),and(sender.eq.${selectedUser.id},receiver.eq.${currentUserId})`,
        )
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Failed to fetch messages:', error);
      } else {
        setMessages(data || []);
        // mark as seen
        await supabase
          .from('messages')
          .update({ seen_at: new Date().toISOString() })
          .or(`and(sender.eq.${selectedUser.id},receiver.eq.${currentUserId},seen_at.is.null)`);

        // Update unread count for this user to 0
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedUser.id]: 0,
        }));
      }
      setLoadingMessages(false);
      scrollToBottom();
    };
    fetchMessages();
    // We intentionally re-run when selectedUser changes to refetch the thread
  }, [currentUserId, selectedUser]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel('admin-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const row = (payload.new || payload.old) as Message;
        if (!row) return;
        const involvesAdmin = row.sender === currentUserId || row.receiver === currentUserId;

        if (payload.eventType === 'INSERT') {
          // If this is a new message to admin from a user
          if (row.receiver === currentUserId && row.sender !== currentUserId) {
            // Update unread count for this user
            setUnreadCounts((prev) => ({
              ...prev,
              [row.sender]: (prev[row.sender] || 0) + 1,
            }));
          }

          // If message involves selected user, add to current conversation
          const involvesSelected = selectedUser
            ? row.sender === selectedUser.id || row.receiver === selectedUser.id
            : false;

          if (involvesAdmin && involvesSelected) {
            setMessages((prev) => [...prev, row]);
            if (row.receiver === currentUserId) {
              // mark seen immediately since conversation is open
              supabase
                .from('messages')
                .update({ seen_at: new Date().toISOString() })
                .eq('id', row.id);

              // Update unread count for this user to 0 since we're viewing the conversation
              setUnreadCounts((prev) => ({
                ...prev,
                [row.sender]: 0,
              }));
            }
            scrollToBottom();
          }
        } else if (payload.eventType === 'UPDATE') {
          // Handle message updates (like seen status)
          const involvesSelected = selectedUser
            ? row.sender === selectedUser.id || row.receiver === selectedUser.id
            : false;
          if (involvesAdmin && involvesSelected) {
            setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
          }
        } else if (payload.eventType === 'DELETE') {
          // Handle message deletions
          const involvesSelected = selectedUser
            ? row.sender === selectedUser.id || row.receiver === selectedUser.id
            : false;
          if (involvesAdmin && involvesSelected) {
            setMessages((prev) => prev.filter((m) => m.id !== row.id));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUserId]);

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || !currentUserId || !selectedUser) return;
    setSending(true);

    let attachment_url = null;

    // Upload image if selected
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('bucket', 'chat-attachments');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          attachment_url = uploadResult.url;
        } else {
          console.error('Failed to upload image');
          setSending(false);
          return;
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        setSending(false);
        return;
      }
    }

    const { error } = await supabase.from('messages').insert({
      content: input.trim() || (selectedFile ? 'Image' : ''),
      sender: currentUserId,
      receiver: selectedUser.id,
      attachment_url,
    } as Database['public']['Tables']['messages']['Insert']);

    if (error) {
      console.error('Failed to send message:', error);
      setSending(false);
      return;
    }

    // Send push notification via server-side API (non-blocking, no CORS issues)
    try {
      const pushResponse = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: attachment_url ? 'Sent an image' : input.trim(),
          userId: selectedUser.id,
          attachment_url,
        }),
      });

      if (!pushResponse.ok) {
        const errorData = await pushResponse.json();
        console.warn(
          'Push notification failed (non-blocking):',
          errorData.error || 'Unknown error',
        );
      }
    } catch (pushError) {
      console.warn('Push notification failed (non-blocking):', pushError);
      // Continue with chat functionality even if push fails
    }

    setSending(false);
    setInput('');
    clearFileSelection();
    scrollToBottomSoon();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
  };
  const scrollToBottomSoon = () => setTimeout(scrollToBottom, 50);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ConversationHeader = () => (
    <div className="px-4 py-3 border-b bg-white">
      {selectedUser ? (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{selectedUser.full_name}</div>
            <div className="text-xs text-gray-500">{selectedUser.email}</div>
          </div>
          <div className="ml-auto">
            <Badge variant="outline">Direct</Badge>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">Select a user to start chatting</div>
      )}
    </div>
  );

  return (
    <AuthWrapper>
      <ModuleGuard requiredModule="chat">
        <div className="min-h-screen bg-gray-50 md:bg-background p-4 md:p-6">
          <div className="mx-auto max-w-7xl h-[calc(100vh-120px)]">
            {/* Header */}
            <PageHeader title="Admin Chat" subtitle="Chat with users in real-time" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* Left: Users list */}
              <div className="bg-white border rounded-lg overflow-hidden flex flex-col">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {usersLoading ? (
                    <div className="p-4 text-sm text-gray-500">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No users found</div>
                  ) : (
                    <ul className="divide-y">
                      {filteredUsers.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className={`w-full text-left p-3 flex items-center gap-3 hover:bg-gray-50 ${
                              selectedUser?.id === u.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {u.full_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{u.email}</div>
                            </div>
                            {unreadCounts[u.id] > 0 && (
                              <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                {unreadCounts[u.id]}
                              </Badge>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right: Conversation */}
              <div className="md:col-span-2 bg-white border rounded-lg overflow-hidden flex flex-col h-full">
                <ConversationHeader />

                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
                  {loadingMessages && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation...
                    </div>
                  )}
                  {!selectedUser && !loadingMessages && (
                    <div className="text-center text-sm text-gray-500 mt-10">
                      Pick a user from the left to view messages.
                    </div>
                  )}
                  {selectedUser && messages.length === 0 && !loadingMessages && (
                    <div className="text-center text-sm text-gray-500 mt-10">No messages yet.</div>
                  )}

                  {messages.map((m) => {
                    const isMine = m.sender === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm border ${
                            isMine
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-800 border-gray-200'
                          }`}
                        >
                          {m.attachment_url ? (
                            <Image
                              src={m.attachment_url}
                              alt="attachment"
                              width={200}
                              height={200}
                              className="h-[200px] w-auto rounded-lg object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">{m.content}</div>
                          )}
                          <div
                            className={`text-[10px] mt-1 ${
                              isMine ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {isMine && <span className="ml-2">{m.seen_at ? 'Seen' : 'Sent'}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-white">
                  {/* Image preview */}
                  {previewUrl && (
                    <div className="mb-3 relative">
                      <div className="relative inline-block">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={128}
                          height={128}
                          className="max-w-32 max-h-32 rounded-lg border object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={clearFileSelection}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                      disabled={sending}
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <Input
                      placeholder={
                        selectedUser ? 'Type a message…' : 'Select a user to start chatting'
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={!selectedUser || sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!selectedUser || sending || (!input.trim() && !selectedFile)}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModuleGuard>
    </AuthWrapper>
  );
}
