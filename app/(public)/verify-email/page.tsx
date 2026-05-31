'use client';

import { supabase } from '@/app/client/supabase';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type State = 'loading' | 'success' | 'already' | 'error';

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!uid) {
      setState('error');
      setMessage('Invalid verification link — no user ID found.');
      return;
    }

    const verify = async () => {
      try {
        const { data: user, error: fetchErr } = await supabase
          .from('users')
          .select('verification_status, full_name, email')
          .eq('id', uid)
          .single();

        if (fetchErr || !user) {
          setState('error');
          setMessage('User not found. The link may be invalid or expired.');
          return;
        }

        if (user.verification_status === 'verified') {
          setState('already');
          setMessage(
            `${user.full_name ?? user.email ?? 'This account'} is already verified.`,
          );
          return;
        }

        const { error: updateErr } = await supabase
          .from('users')
          .update({ verification_status: 'verified' })
          .eq('id', uid);

        if (updateErr) throw updateErr;

        setState('success');
        setMessage(
          `${user.full_name ?? user.email ?? 'Account'} has been verified successfully!`,
        );
      } catch (e) {
        setState('error');
        setMessage('Something went wrong. Please try again or contact support.');
        console.error(e);
      }
    };

    verify();
  }, [uid]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-white"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400 leading-none">Barangay Amaya V</p>
            <p className="font-bold text-gray-900 text-sm leading-tight">Amayalert</p>
          </div>
        </div>

        {state === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying…</h1>
            <p className="text-gray-500 text-sm">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <p className="text-xs text-gray-400">
              You can now close this page and return to the Amayalert app.
            </p>
          </>
        )}

        {state === 'already' && (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-blue-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Already Verified</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <p className="text-xs text-gray-400">No further action needed.</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <p className="text-xs text-gray-400">
              Please request a new verification email from the app.
            </p>
          </>
        )}

        <p className="mt-8 text-xs text-gray-300 border-t pt-6">
          Barangay Amaya V, Tanza, Cavite · Amayalert
        </p>
      </div>
    </div>
  );
}

// ── Page (wraps in Suspense — required for useSearchParams in Next.js 14+) ────
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
