import { createClient } from '@/app/client/supabase.server';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  return <>{children}</>;
}
