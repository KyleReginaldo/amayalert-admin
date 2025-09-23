import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';

type EvacuationCenterUpdate = Database['public']['Tables']['evacuation_centers']['Update'];

// GET /api/evacuation/[id] - Fetch a specific evacuation center
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid evacuation center ID' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('evacuation_centers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Evacuation center not found' },
          { status: 404 },
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch evacuation center' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error fetching evacuation center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evacuation center' },
      { status: 500 },
    );
  }
}

// PUT /api/evacuation/[id] - Update a specific evacuation center
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid evacuation center ID' },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate required fields if provided
    if (body.name !== undefined && (!body.name || !body.name.trim())) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 });
    }

    if (body.address !== undefined && (!body.address || !body.address.trim())) {
      return NextResponse.json(
        { success: false, error: 'Address cannot be empty' },
        { status: 400 },
      );
    }

    if (
      (body.latitude !== undefined && typeof body.latitude !== 'number') ||
      (body.longitude !== undefined && typeof body.longitude !== 'number')
    ) {
      return NextResponse.json(
        { success: false, error: 'Valid latitude and longitude are required' },
        { status: 400 },
      );
    }

    // Prepare update data
    const updateData: EvacuationCenterUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.address !== undefined) updateData.address = body.address.trim();
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.current_occupancy !== undefined) updateData.current_occupancy = body.current_occupancy;
    if (body.contact_name !== undefined) updateData.contact_name = body.contact_name;
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone;
    if (body.status !== undefined) {
      const validStatuses = ['open', 'closed', 'full', 'maintenance'];
      if (validStatuses.includes(body.status)) {
        updateData.status = body.status as Database['public']['Enums']['evacuation_status'];
      }
    }
    if (body.photos !== undefined) updateData.photos = body.photos;

    const { data, error } = await supabase
      .from('evacuation_centers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Evacuation center not found' },
          { status: 404 },
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update evacuation center' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Evacuation center updated successfully',
    });
  } catch (error) {
    console.error('Error updating evacuation center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update evacuation center' },
      { status: 500 },
    );
  }
}

// DELETE /api/evacuation/[id] - Delete a specific evacuation center
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid evacuation center ID' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('evacuation_centers')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Evacuation center not found' },
          { status: 404 },
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete evacuation center' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Evacuation center deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting evacuation center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete evacuation center' },
      { status: 500 },
    );
  }
}
