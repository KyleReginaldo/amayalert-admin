import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';

type RescueInsert = Database['public']['Tables']['rescues']['Insert'];
type RescueStatus = Database['public']['Enums']['rescue_status'];

// GET /api/rescues - Fetch all rescues with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters for filtering
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('rescues')
      .select('*, user:users(*)')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (validStatuses.includes(status)) {
        query = query.eq('status', status as RescueStatus);
      }
    }

    // Apply priority filter
    if (priority && !isNaN(parseInt(priority))) {
      query = query.eq('priority', parseInt(priority));
    }

    // Apply date range filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rescues' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching rescues:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rescues' }, { status: 500 });
  }
}

// POST /api/rescues - Create a new rescue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    // Create new rescue
    const newRescue: RescueInsert = {
      title: body.title.trim(),
      description: body.description || null,
      priority: body.priority || 3, // Default to medium priority
      status: body.status || 'pending',
      lat: body.lat || null,
      lng: body.lng || null,
      metadata: body.metadata || null,
      reported_at: body.reported_at || new Date().toISOString(),
      scheduled_for: body.scheduled_for || null,
      user: body.user || null,
    };

    const { data, error } = await supabase.from('rescues').insert([newRescue]).select().single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create rescue' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data,
        message: 'Rescue created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating rescue:', error);
    return NextResponse.json({ success: false, error: 'Failed to create rescue' }, { status: 500 });
  }
}
