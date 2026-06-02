import { supabase } from '@/app/client/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('emergency_hotlines')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch hotlines' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [], total: data?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId: string | undefined = body.userId || undefined;

    if (!body.category?.trim()) return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    if (!body.name?.trim())     return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    const phones: string[]    = Array.isArray(body.phones)    ? body.phones.filter(Boolean)    : [];
    const landlines: string[] = Array.isArray(body.landlines) ? body.landlines.filter(Boolean) : [];

    const { data, error } = await supabase
      .from('emergency_hotlines')
      .insert({
        category:   body.category.trim(),
        name:       body.name.trim(),
        phones,
        landlines,
        created_by: userId ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create hotline' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: 'Hotline created successfully' }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
