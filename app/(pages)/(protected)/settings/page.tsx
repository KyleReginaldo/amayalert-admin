'use client';

import { supabase } from '@/app/client/supabase';
import { PageHeader } from '@/app/components/page-header';
import TopRightDialog from '@/app/components/top-right-dialog';
import usersAPI from '@/app/lib/users-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ChevronDown, Save, Search, ShieldCheck, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';


type Status = { type: 'success' | 'error' | 'info'; title?: string; message: string } | null;

interface AppUser {
  id: string;
  full_name: string;
  email: string | null;
  device_token: string | null;
}

interface PushTestResult {
  userId: string;
  userName: string;
  deviceTokenStored: boolean;
  targeting: 'device_token' | 'external_id';
  success: boolean;
  recipients: number;
  error: string | null;
  raw: unknown;
  testedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Push Notification Tester
// ──────────────────────────────────────────────────────────────────────────────
function PushTesterCard() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<PushTestResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users?role=user');
        const json = await res.json() as { success: boolean; data?: AppUser[] };
        if (json.success && json.data) setUsers(json.data);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredUsers = inputValue.trim()
    ? users.filter((u) =>
        `${u.full_name} ${u.email ?? ''}`.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : users;

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  const selectUser = (u: AppUser) => {
    setSelectedUserId(u.id);
    setInputValue(u.full_name + (u.email ? ` (${u.email})` : ''));
    setOpen(false);
  };

  const clearSelection = () => {
    setSelectedUserId('');
    setInputValue('');
    setOpen(false);
  };

  const runTest = async (targetUserId: string) => {
    const res = await fetch('/api/test-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId, testType: 'push' }),
    });
    const json = await res.json() as {
      success: boolean;
      user?: { name: string; deviceToken: string | null };
      results?: {
        push: {
          success: boolean;
          recipients: number;
          targeting: 'device_token' | 'external_id';
          deviceTokenStored: boolean;
          error: string | null;
          raw: unknown;
        };
      };
      error?: string;
    };

    if (!json.success) {
      return {
        userId: targetUserId,
        userName: json.user?.name ?? targetUserId,
        deviceTokenStored: false,
        targeting: 'external_id' as const,
        success: false,
        recipients: 0,
        error: json.error ?? 'Request failed',
        raw: json,
        testedAt: new Date().toLocaleTimeString(),
      };
    }

    const push = json.results!.push;
    return {
      userId: targetUserId,
      userName: json.user?.name ?? targetUserId,
      deviceTokenStored: push.deviceTokenStored,
      targeting: push.targeting,
      success: push.success && push.recipients > 0,
      recipients: push.recipients,
      error: push.error,
      raw: push.raw,
      testedAt: new Date().toLocaleTimeString(),
    };
  };

  const handleTestOne = async () => {
    if (!selectedUserId) return;
    setTesting(true);
    try {
      const result = await runTest(selectedUserId);
      setLogs((prev) => [result, ...prev]);
    } finally {
      setTesting(false);
    }
  };

  const handleTestAll = async () => {
    if (users.length === 0) return;
    setTesting(true);
    try {
      const results: PushTestResult[] = [];
      for (const u of users) {
        const result = await runTest(u.id);
        results.push(result);
      }
      setLogs((prev) => [...results, ...prev]);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notification Testing</CardTitle>
        <CardDescription>
          Send a test push to a specific user and inspect the OneSignal response to diagnose
          delivery issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Combobox user selector */}
        <div className="space-y-1.5">
          <Label>Select user</Label>
          <div ref={containerRef} className="relative">
            {/* Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSelectedUserId('');
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={loadingUsers ? 'Loading users…' : 'Search by name or email…'}
                disabled={loadingUsers || testing}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {!inputValue && (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              )}
            </div>

            {/* Dropdown */}
            {open && !loadingUsers && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                {filteredUsers.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No users found.</p>
                ) : (
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {filteredUsers.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectUser(u);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex flex-col ${
                            u.id === selectedUserId ? 'bg-accent/60' : ''
                          }`}
                        >
                          <span className="font-medium">{u.full_name}</span>
                          {u.email && (
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button onClick={handleTestOne} disabled={!selectedUserId || testing}>
            {testing ? 'Sending…' : 'Test selected'}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestAll}
            disabled={users.length === 0 || testing}
          >
            Test all ({users.length})
          </Button>
        </div>

        {/* Device token status for selected user */}
        {selectedUser && (
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm space-y-1">
            <p className="font-medium">{selectedUser.full_name}</p>
            <p className="text-muted-foreground text-xs">ID: {selectedUser.id}</p>
            <p className="text-xs flex items-center gap-1">
              {selectedUser.device_token ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-700 dark:text-green-400">
                    Device token stored — will target by subscription ID
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400">
                    No device token — will target by external_id (requires mobile app to call
                    OneSignal.login)
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Results</p>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`rounded-md border px-4 py-3 text-sm space-y-2 ${
                    log.success
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="font-medium">{log.userName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{log.testedAt}</span>
                  </div>

                  <div className="text-xs space-y-1 text-muted-foreground pl-6">
                    <p>
                      Targeting:{' '}
                      <span className="font-mono text-foreground">{log.targeting}</span>
                      {' · '}Device token:{' '}
                      <span className={log.deviceTokenStored ? 'text-green-600' : 'text-amber-600'}>
                        {log.deviceTokenStored ? 'stored' : 'not stored'}
                      </span>
                    </p>
                    <p>
                      Recipients:{' '}
                      <span className={`font-semibold ${log.recipients > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {log.recipients}
                      </span>
                    </p>
                    {log.error && (
                      <p className="text-red-600 dark:text-red-400">Error: {log.error}</p>
                    )}
                  </div>

                  <details className="pl-6">
                    <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                      Raw OneSignal response
                    </summary>
                    <pre className="mt-1 text-[11px] overflow-x-auto rounded bg-black/5 dark:bg-white/5 p-2 font-mono">
                      {JSON.stringify(log.raw, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          If recipients = 0 with no error, the mobile app likely hasn't called{' '}
          <code className="font-mono">OneSignal.login(userId)</code> or the device token is
          unregistered.
        </p>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Settings Page
// ──────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error || new Error('No active user');
        if (!mounted) return;
        setUserId(data.user.id);
        setEmail(data.user.email || '');

        const res = await usersAPI.getUser(data.user.id);
        if (res.success && res.data) {
          setFullName(res.data.full_name || '');
        } else {
          const metaFull = (data.user.user_metadata as { full_name?: unknown } | null)?.full_name;
          const metaName = typeof metaFull === 'string' ? metaFull : '';
          setFullName(metaName);
        }
      } catch (e) {
        setStatus({
          type: 'error',
          title: 'Load failed',
          message: e instanceof Error ? e.message : 'Unable to load profile',
        });
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canSaveName = useMemo(() => !!userId && fullName.trim().length > 1, [userId, fullName]);
  const canChangePass = useMemo(
    () => currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword,
    [currentPassword, newPassword, confirmPassword],
  );

  const handleSaveName = async () => {
    if (!userId) return;
    setSavingName(true);
    setStatus(null);
    try {
      const result = await usersAPI.updateUser(userId, { full_name: fullName.trim() });
      if (!result.success) throw new Error(result.error || 'Failed to update name');
      setStatus({ type: 'success', title: 'Profile updated', message: 'Your name has been saved.' });
    } catch (e) {
      setStatus({
        type: 'error',
        title: 'Update failed',
        message: e instanceof Error ? e.message : 'Unable to update name',
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!canChangePass) return;
    setChangingPass(true);
    setStatus(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus({
        type: 'success',
        title: 'Password changed',
        message: 'Use your new password next time you sign in.',
      });
    } catch (e) {
      setStatus({
        type: 'error',
        title: 'Change failed',
        message: e instanceof Error ? e.message : 'Unable to change password',
      });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-background sm:p-6">
      <div className="max-w-[800px] mx-auto space-y-6">
        <PageHeader title="Settings" subtitle="Manage your account info and security" />

        <TopRightDialog
          open={!!status}
          variant={
            status?.type === 'error' ? 'error' : status?.type === 'success' ? 'success' : 'info'
          }
          title={status?.title}
          message={status?.message}
          onClose={() => setStatus(null)}
          inline
        />

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  disabled={loadingProfile}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveName} disabled={!canSaveName || savingName}>
                <Save className="w-4 h-4 mr-2" />
                {savingName ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4" /> Enter current password and new password (8+
                characters).
              </p>
              <Button
                variant="secondary"
                onClick={handleChangePassword}
                disabled={!canChangePass || changingPass}
              >
                {changingPass ? 'Changing…' : 'Change password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Push Notification Tester */}
        <PushTesterCard />
      </div>
    </div>
  );
}
