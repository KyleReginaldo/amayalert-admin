import { supabase } from '@/app/client/supabase';
import { logActivity } from '@/app/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const body = await request.json();
    const { userId } = body;

    // Get the word before deleting for logging
    const { data: filter } = await supabase
      .from('word_filters')
      .select('word')
      .eq('id', numericId)
      .single();

    // Delete the word filter
    const { error } = await supabase.from('word_filters').delete().eq('id', numericId);

    if (error) {
      console.error('Error deleting word filter:', error);
      return NextResponse.json({ error: 'Failed to delete word filter' }, { status: 500 });
    }

    // Log activity
    if (filter?.word && userId) {
      await logActivity({
        action: 'delete',
        module: 'setting',
        description: `Deleted word filter: "${filter.word}"`,
        userId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/word-filters/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
