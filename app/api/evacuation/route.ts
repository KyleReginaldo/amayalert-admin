import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';

type EvacuationCenterInsert = Database['public']['Tables']['evacuation_centers']['Insert'];

// GET /api/evacuation - Fetch all evacuation centers with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters for filtering
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    const minCapacity = searchParams.get('minCapacity');
    const maxCapacity = searchParams.get('maxCapacity');

    let query = supabase
      .from('evacuation_centers')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      const validStatuses = ['open', 'closed', 'full', 'maintenance'];
      if (validStatuses.includes(status)) {
        query = query.eq('status', status as Database['public']['Enums']['evacuation_status']);
      }
    }

    // Apply capacity filters
    if (minCapacity && !isNaN(parseInt(minCapacity))) {
      query = query.gte('capacity', parseInt(minCapacity));
    }

    if (maxCapacity && !isNaN(parseInt(maxCapacity))) {
      query = query.lte('capacity', parseInt(maxCapacity));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch evacuation centers' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching evacuation centers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evacuation centers' },
      { status: 500 },
    );
  }
}

// POST /api/evacuation - Create a new evacuation center
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!body.address || !body.address.trim()) {
      return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
    }

    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid latitude and longitude are required' },
        { status: 400 },
      );
    }

    // Create new evacuation center
    const newCenter: EvacuationCenterInsert = {
      name: body.name.trim(),
      address: body.address.trim(),
      latitude: body.latitude,
      longitude: body.longitude,
      capacity: body.capacity || null,
      status: body.status || 'open',
      photos: body.photos || null,
      created_by: body.created_by || null,
    };

    const { data, error } = await supabase
      .from('evacuation_centers')
      .insert([newCenter])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create evacuation center' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data,
        message: 'Evacuation center created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating evacuation center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create evacuation center' },
      { status: 500 },
    );
  }
}
