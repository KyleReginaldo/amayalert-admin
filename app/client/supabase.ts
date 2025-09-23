// Prefer server-only env vars for service role keys. Fall back to NEXT_PUBLIC names if present
import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';

// but ensure a value exists at runtime. Adjust your environment vars if you see a runtime error here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error(
    'Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE are set.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceRole);
