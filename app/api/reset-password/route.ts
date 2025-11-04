import { supabase } from '@/app/client/supabase';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, newPassword } = body;
  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ success: true, message: 'Password reset successfully' }));
}
