'use client';

import { supabase } from '@/app/client/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Global auth state cache to prevent loading screens on navigation
let globalAuthState: {
  isAuthenticated: boolean;
  isChecked: boolean;
  userId?: string;
} = {
  isAuthenticated: false,
  isChecked: false,
};

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(!globalAuthState.isChecked);
  const [isAuthenticated, setIsAuthenticated] = useState(globalAuthState.isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async (forceCheck = false) => {
      try {
        // If already checked and authenticated, skip unless forced
        if (globalAuthState.isChecked && globalAuthState.isAuthenticated && !forceCheck) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        setError(null);

        // Only show loading if we haven't checked before or if forced
        if (!globalAuthState.isChecked || forceCheck) {
          setIsLoading(true);
        }

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          setError('Authentication check timed out. Please try refreshing the page.');
          setIsLoading(false);
        }, 10000); // 10 second timeout

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          clearTimeout(timeoutId);
          globalAuthState = { isAuthenticated: false, isChecked: true };
          router.push('/signin');
          return;
        }

        if (!session?.user) {
          console.log('No active session found');
          clearTimeout(timeoutId);
          globalAuthState = { isAuthenticated: false, isChecked: true };
          router.push('/signin');
          return;
        }

        // Check if user is admin (only if user changed or not cached)
        if (!globalAuthState.userId || globalAuthState.userId !== session.user.id || forceCheck) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          clearTimeout(timeoutId);

          if (userError) {
            console.error('Error fetching user role:', userError);
            globalAuthState = { isAuthenticated: false, isChecked: true };
            setError('Failed to verify admin privileges. Please try signing in again.');
            setIsLoading(false);
            return;
          }

          if (userData?.role !== 'admin') {
            globalAuthState = { isAuthenticated: false, isChecked: true };
            setError('Admin access required. Please contact your administrator.');
            setIsLoading(false);
            return;
          }

          // Update global cache
          globalAuthState = {
            isAuthenticated: true,
            isChecked: true,
            userId: session.user.id,
          };
        }

        // All checks passed
        clearTimeout(timeoutId);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Authentication check failed:', err);
        globalAuthState = { isAuthenticated: false, isChecked: true };
        setError('Authentication failed. Please try signing in again.');
        setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Clear cache on sign out
        globalAuthState = { isAuthenticated: false, isChecked: true };
        router.push('/signin');
      } else if (event === 'SIGNED_IN') {
        // Force recheck on sign in
        checkAuth(true);
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  // Loading state with modern design
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 animate-pulse">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Access</h2>
            <p className="text-gray-600 text-sm">Checking your admin credentials...</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full animate-pulse"
              style={{ width: '70%' }}
            ></div>
          </div>

          <p className="text-xs text-gray-500">This may take a few seconds...</p>
        </div>
      </div>
    );
  }

  // Error state with modern design
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 text-sm mb-6">{error}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/signin')}
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white py-2.5 px-4 rounded-xl font-medium hover:from-red-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback (shouldn't reach here)
  return null;
}
