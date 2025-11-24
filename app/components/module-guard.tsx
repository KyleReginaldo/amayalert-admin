'use client';

import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ModuleType = Database['public']['Enums']['modules'];

interface ModuleGuardProps {
  children: React.ReactNode;
  requiredModule?: ModuleType;
}

export default function ModuleGuard({ children, requiredModule }: ModuleGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkModuleAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/signin');
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role, modules')
          .eq('id', user.id)
          .single();

        if (!userData) {
          router.push('/signin');
          return;
        }

        // Admin has access to everything
        if (userData.role === 'admin') {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // If no module required (e.g., Dashboard), allow access
        if (!requiredModule) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Check if sub_admin has the required module
        if (userData.role === 'sub_admin') {
          const hasAccess = userData.modules?.includes(requiredModule);
          if (hasAccess) {
            setIsAuthorized(true);
          } else {
            // Redirect to dashboard if no access
            router.push('/');
          }
        } else {
          // Regular users shouldn't access admin pages
          router.push('/');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Module access check failed:', error);
        router.push('/');
      }
    };

    checkModuleAccess();
  }, [requiredModule, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
            <div className="w-8 h-8 border-3 border-white rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
