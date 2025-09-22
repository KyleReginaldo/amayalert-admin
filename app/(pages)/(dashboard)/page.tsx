'use client';
import { supabase } from '@/app/client/supabase';
import { useEffect, useState } from 'react';
import Dashboard from '../../components/dashboard/dashboard';

const Page = () => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        window.location.href = '/signin';
      } else {
        setChecked(true);
      }
    };
    getUser();
  }, []);

  if (!checked) return null; // Prevent rendering until user is checked

  return <Dashboard />;
};

export default Page;
