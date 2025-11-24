import { supabase } from '@/app/client/supabase';
import { logActivity } from '@/app/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('word_filters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching word filters:', error);
      return NextResponse.json({ error: 'Failed to fetch word filters' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/word-filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, userId } = body;

    if (!word || typeof word !== 'string' || !word.trim()) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    // Check if word already exists
    const { data: existing } = await supabase
      .from('word_filters')
      .select('id')
      .eq('word', word.trim().toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This word is already in the filter list' },
        { status: 400 },
      );
    }

    // Insert new word filter
    const { data, error } = await supabase
      .from('word_filters')
      .insert({
        word: word.trim().toLowerCase(),
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating word filter:', error);
      return NextResponse.json({ error: 'Failed to create word filter' }, { status: 500 });
    }

    // Log activity
    await logActivity({
      action: 'create',
      module: 'setting',
      description: `Added word filter: "${word.trim()}"`,
      userId,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/word-filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
