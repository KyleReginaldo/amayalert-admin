import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';

type RescueUpdate = Database['public']['Tables']['rescues']['Update'];

// GET /api/rescues/[id] - Fetch a specific rescue
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid rescue ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('rescues')
      .select('*, user:users(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Rescue not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rescue' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error fetching rescue:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rescue' }, { status: 500 });
  }
}

// PUT /api/rescues/[id] - Update a specific rescue
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid rescue ID' }, { status: 400 });
    }

    const body = await request.json();

    // Validate required fields if provided
    if (body.title !== undefined && (!body.title || !body.title.trim())) {
      return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
    }

    // Prepare update data
    const updateData: RescueUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Auto-set completed_at when status changes to completed
      if (body.status === 'completed' && !body.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.scheduled_for !== undefined) updateData.scheduled_for = body.scheduled_for;
    if (body.completed_at !== undefined) updateData.completed_at = body.completed_at;
    if (body.user !== undefined) updateData.user = body.user;

    const { data, error } = await supabase
      .from('rescues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Rescue not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update rescue' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Rescue updated successfully',
    });
  } catch (error) {
    console.error('Error updating rescue:', error);
    return NextResponse.json({ success: false, error: 'Failed to update rescue' }, { status: 500 });
  }
}

// DELETE /api/rescues/[id] - Delete a specific rescue
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid rescue ID' }, { status: 400 });
    }

    const { data, error } = await supabase.from('rescues').delete().eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Rescue not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete rescue' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Rescue deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rescue:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete rescue' }, { status: 500 });
  }
}
