import { supabase } from '@/app/client/supabase';
import { logAdminAction, logUserAction } from '@/app/lib/activity-logger';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';

// Types
type User = Database['public']['Tables']['users']['Row'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// GET /api/users/[id] - Fetch a specific user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing user ID',
          message: 'User ID is required',
        } as ApiResponse<User>,
        { status: 400 },
      );
    }

    const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch user',
          message: error.message,
        } as ApiResponse<User>,
        { status: error.code === 'PGRST116' ? 404 : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User fetched successfully',
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Unexpected error in GET /api/users/[id]:', error);
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

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: UserUpdate = await request.json();

    // Extract userId from request body
    const userId = (body as { userId?: string }).userId;
    console.log('🔐 User ID from request:', userId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing user ID',
          message: 'User ID is required',
        } as ApiResponse<User>,
        { status: 400 },
      );
    }

    // Prepare update payload without allowing id or userId to be updated
    const updateData = { ...body } as UserUpdate & { id?: string; userId?: string };
    if ('id' in updateData) {
      delete updateData.id;
    }
    if ('userId' in updateData) {
      delete updateData.userId;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user',
          message: error.message,
        } as ApiResponse<User>,
        { status: error.code === 'PGRST116' ? 404 : 500 },
      );
    }

    // Log the activity
    if (user.role === 'sub_admin' || user.role === 'admin') {
      await logAdminAction('update', user.full_name, user.modules as string[] | undefined, userId);
    } else {
      await logUserAction('update', user.full_name, `Email: ${user.email}`, userId);
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Unexpected error in PUT /api/users/[id]:', error);
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

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Extract userId from request body
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing user ID',
          message: 'User ID is required',
        } as ApiResponse<User>,
        { status: 400 },
      );
    }

    // First fetch the user to get details before deletion
    const { data: userData } = await supabase.from('users').select('*').eq('id', id).single();

    const { error: fetchError } = await supabase.auth.admin.deleteUser(id);

    if (fetchError) {
      console.error('Error fetching user for deletion:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: fetchError.message,
        } as ApiResponse<User>,
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabase.from('users').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete user',
          message: deleteError.message,
        } as ApiResponse<User>,
        { status: 500 },
      );
    }

    // Log the activity with full user details
    if (userData) {
      const userDetails = [
        `Email: ${userData.email || 'N/A'}`,
        `Phone: ${userData.phone_number || 'N/A'}`,
        `Gender: ${userData.gender || 'N/A'}`,
        `Birth Date: ${userData.birth_date || 'N/A'}`,
      ].join(' | ');

      if (userData.role === 'sub_admin' || userData.role === 'admin') {
        const modules = userData.modules as string[] | undefined;
        await logAdminAction('delete', userData.full_name, modules, userId);
      } else {
        await logUserAction('delete', userData.full_name, userDetails, userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Unexpected error in DELETE /api/users/[id]:', error);
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
