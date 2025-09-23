'use client';
import { supabase } from '@/app/client/supabase';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Dashboard from '../../components/dashboard/dashboard';

const Page = () => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          window.location.href = '/signin';
        } else {
          setChecked(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/signin';
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!checked) return null; // This should not happen now, but keeping as fallback

  return <Dashboard />;
};

export default Page;
