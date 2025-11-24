import { logAlertAction } from '@/app/lib/activity-logger';
import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// GET /api/alerts/[id] - Fetch a specific alert
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid alert ID' }, { status: 400 });
    }

    const { data: alert, error } = await supabase
      .from('alert')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch alert' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch alert' }, { status: 500 });
  }
}

// PUT /api/alerts/[id] - Update a specific alert
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid alert ID' }, { status: 400 });
    }

    const body = await request.json();

    // Extract userId from request body (don't include in updateData)
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // Prepare update data (exclude userId which is only for logging)
    const updateData = {
      title: body.title.trim(),
      content: body.content.trim(),
      alert_level: body.alert_level,
    };

    // Update the alert
    const { data: updatedAlert, error } = await supabase
      .from('alert')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update alert' },
        { status: 500 },
      );
    }

    // Log the activity
    await logAlertAction(
      'update',
      updatedAlert.alert_level || 'medium',
      updatedAlert.title || 'Untitled Alert',
      undefined,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: updatedAlert,
      message: 'Alert updated successfully',
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 });
  }
}

// DELETE /api/alerts/[id] - Soft delete a specific alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid alert ID' }, { status: 400 });
    }

    // Extract userId from request body
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

    // Soft delete the alert by setting deleted_at
    const { data: deletedAlert, error } = await supabase
      .from('alert')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete alert' },
        { status: 500 },
      );
    }

    // Log the activity
    await logAlertAction(
      'delete',
      deletedAlert.alert_level || 'medium',
      deletedAlert.title || 'Untitled Alert',
      undefined,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: deletedAlert,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete alert' }, { status: 500 });
  }
}
