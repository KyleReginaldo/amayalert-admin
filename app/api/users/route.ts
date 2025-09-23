import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';

// Types
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserRole = Database['public']['Enums']['user_role'];

interface UserFilters {
  search?: string;
  role?: UserRole;
  created_after?: string;
  created_before?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

// GET /api/users - Fetch all users with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const filters: UserFilters = {
      search: searchParams.get('search') || undefined,
      role: (searchParams.get('role') as UserRole) || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
    };

    // Build query
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`,
      );
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch users',
          message: error.message,
        } as ApiResponse<User[]>,
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: users || [],
      total: count || users?.length || 0,
      message: `Found ${users?.length || 0} users`,
    } as ApiResponse<User[]>);
  } catch (error) {
    console.error('Unexpected error in GET /api/users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse<User[]>,
      { status: 500 },
    );
  }
}

// POST /api/users - Create a new user (if needed for admin creation)
export async function POST(request: NextRequest) {
  try {
    const body: UserInsert = await request.json();

    // Validate required fields
    if (!body.email || !body.full_name || !body.phone_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Email, full name, and phone number are required',
        } as ApiResponse<User>,
        { status: 400 },
      );
    }

    const { data: user, error } = await supabase.from('users').insert([body]).select().single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user',
          message: error.message,
        } as ApiResponse<User>,
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Unexpected error in POST /api/users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse<User>,
      { status: 500 },
    );
  }
}
