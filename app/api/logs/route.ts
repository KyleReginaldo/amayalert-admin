import { supabase } from '@/app/client/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const search = searchParams.get('search');

  let query = supabase
    .from('logs')
    .select(
      `
      *,
      users!logs_user_fkey (
        id,
        full_name,
        email,
        role
      )
    `,
    )
    .order('created_at', { ascending: false });

  // Apply filters
  if (userId) {
    query = query.eq('user', userId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  if (search) {
    query = query.ilike('content', `%${search}%`);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
}

export async function POST(request: Request) {
  const { content, user } = await request.json();
  const { data, error } = await supabase
    .from('logs')
    .insert({
      content,
      user,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 201 });
}
