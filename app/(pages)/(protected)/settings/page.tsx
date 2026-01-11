'use client';

import { supabase } from '@/app/client/supabase';
import { PageHeader } from '@/app/components/page-header';
import TopRightDialog from '@/app/components/top-right-dialog';
import usersAPI from '@/app/lib/users-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Status = { type: 'success' | 'error' | 'info'; title?: string; message: string } | null;

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

  // Load current session and profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error || new Error('No active user');
        if (!mounted) return;
        setUserId(data.user.id);
        setEmail(data.user.email || '');

        // Fetch profile from our API to get full_name
        const res = await usersAPI.getUser(data.user.id);
        if (res.success && res.data) {
          setFullName(res.data.full_name || '');
        } else {
          // fallback to user metadata name if present
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
      setStatus({
        type: 'success',
        title: 'Profile updated',
        message: 'Your name has been saved.',
      });
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
      // First verify the current password by attempting to sign in with it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // If current password is verified, update to new password
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/signin';
    }
  };

  return (
    <div className="min-h-screen p-4 bg-background sm:p-6">
      <div className="max-w-[800px] mx-auto space-y-6">
        <PageHeader title="Settings" subtitle="Manage your account info and security" />

        {/* Alerts */}
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
      </div>
    </div>
  );
}
