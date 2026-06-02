import { supabase } from '@/app/client/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const userId: string | undefined = body.userId || undefined;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: userId ?? null };

    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.name     !== undefined) updateData.name     = body.name.trim();
    if (Array.isArray(body.phones))    updateData.phones    = body.phones.filter(Boolean);
    if (Array.isArray(body.landlines)) updateData.landlines = body.landlines.filter(Boolean);

    const { data, error } = await supabase
      .from('emergency_hotlines')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ success: false, error: 'Hotline not found' }, { status: 404 });
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update hotline' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: 'Hotline updated successfully' });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const { data, error } = await supabase
      .from('emergency_hotlines')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ success: false, error: 'Hotline not found' }, { status: 404 });
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete hotline' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: 'Hotline deleted successfully' });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
