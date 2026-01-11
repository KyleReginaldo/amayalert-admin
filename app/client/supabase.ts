// Client-side Supabase configuration (browser)
import { Database } from '@/database.types';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error(
    'Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
  );
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseServiceRole);
