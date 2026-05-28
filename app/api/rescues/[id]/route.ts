import { supabase } from '@/app/client/supabase';
import { logRescueAction } from '@/app/lib/activity-logger';
import emailService from '@/app/lib/email-service';
import { normalizePhone, sendViTextBee } from '@/app/lib/textbee';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';

// Send rescue status SMS directly via TextBee (no HTTP roundtrip)
async function sendStatusSMSInternal(to: string, message: string) {
  if (!to) return { success: false, error: 'No recipient phone provided' };
  const phone = normalizePhone(to);
  const result = await sendViTextBee([phone], message);
  if (result.error) {
    console.error('Rescue SMS failed:', result.error, result.details ?? '');
    return { success: false, error: result.error };
  }
  return { success: true };
}
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
    // Log incoming payload for easier debugging in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('PUT /api/rescues/[id] payload:', JSON.stringify(body));
    }

    // Extract userId from request body (don't include in updateData)
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

    // Validate required fields if provided
    if (body.title !== undefined && (!body.title || !body.title.trim())) {
      return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
    }
    if (body.female_count !== undefined) {
      const n = Number(body.female_count);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { success: false, error: 'female_count must be a non-negative number' },
          { status: 400 },
        );
      }
    }
    if (body.male_count !== undefined) {
      const n = Number(body.male_count);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { success: false, error: 'male_count must be a non-negative number' },
          { status: 400 },
        );
      }
    }

    // Fetch existing rescue for change detection (status, counts, phone)
    const { data: existingRescue } = await supabase
      .from('rescues')
      .select('id,status,title,emergency_type,female_count,male_count,contact_phone,scheduled_for')
      .eq('id', id)
      .single();

    // Enforce one-way status state machine — no going backwards
    if (body.status !== undefined && existingRescue?.status) {
      const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        pending: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };
      const current = existingRescue.status as string;
      const allowed = ALLOWED_TRANSITIONS[current] ?? [];
      if (body.status !== current && !allowed.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot change status from "${current}" to "${body.status}". ${
              allowed.length
                ? `Allowed transitions: ${allowed.join(', ')}.`
                : 'This status is final and cannot be changed.'
            }`,
          },
          { status: 422 },
        );
      }
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
    // New schema fields
    if (body.emergency_type !== undefined) updateData.emergency_type = body.emergency_type;
    if (body.female_count !== undefined) updateData.female_count = Number(body.female_count);
    if (body.male_count !== undefined) updateData.male_count = Number(body.male_count);
    if (body.attachments !== undefined) updateData.attachments = body.attachments;
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone;
    if (body.important_information !== undefined)
      updateData.important_information = body.important_information;
    if (body.email !== undefined) updateData.email = body.email;
    console.log(`status: ${body.status}`);

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
      // Include error message in development to aid debugging
      const errMsg =
        process.env.NODE_ENV === 'development'
          ? error.message || String(error)
          : 'Failed to update rescue';
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }
    // Auto-send SMS when status changes OR when explicitly requested via send_sms using internal SMS API
    try {
      const phone = data.contact_phone || body.contact_phone || existingRescue?.contact_phone;
      const statusChanged = existingRescue && data.status && existingRescue.status !== data.status;
      if (phone && (statusChanged || body.send_sms === true)) {
        const statusText = data.status?.replace('_', ' ') || 'updated';
        const baseMessage = `Amayalert Update: Rescue "${data.title}" is now ${statusText}.`;
        const parts: string[] = [];
        if (data.emergency_type) parts.push(`Type: ${data.emergency_type}`);
        const totalPeople = (data.female_count || 0) + (data.male_count || 0);
        if (totalPeople > 0)
          parts.push(
            `People: ${totalPeople} (${data.female_count || 0}F/${data.male_count || 0}M)`,
          );
        if (data.scheduled_for)
          parts.push(`Schedule: ${new Date(data.scheduled_for).toLocaleDateString()}`);
        const composed = parts.length ? `${baseMessage} ${parts.join(' | ')}` : baseMessage;
        const finalMessage = (body.sms_message as string) || composed;
        const smsResult = await sendStatusSMSInternal(phone, finalMessage);
        if (!smsResult.success) {
          console.warn('Rescue status SMS failed:', smsResult.error);
        }
      }
    } catch (smsErr) {
      console.warn('Rescue update SMS forwarding failed:', smsErr);
    }

    // Optionally send email when an email address is provided in the payload
    if (body.email) {
      try {
        await emailService.sendRescueUpdateEmail(
          body.email as string,
          {
            id: data.id ?? id,
            title: data.title ?? 'Rescue Update',
            status: data.status ?? 'pending',
            priority: data.priority,
            emergency_type: data.emergency_type,
            female_count: data.female_count,
            male_count: data.male_count,
            scheduled_for: data.scheduled_for,
            contact_phone: data.contact_phone,
            email: data.email,
            description: data.description,
            lat: data.lat,
            lng: data.lng,
            important_information: data.important_information,
          },
          {
            message: (body.email_message as string) || undefined,
            appUrl: process.env.NEXT_PUBLIC_BASE_URL,
          },
        );
      } catch (sendErr) {
        console.warn('Rescue update email send failed:', sendErr);
      }
    }

    // Log the activity
    await logRescueAction(
      'update',
      parseInt(id),
      `Status: ${data.status}, Priority: ${data.priority}`,
      userId,
    );

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

    // Extract userId from request body
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

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

    // Log the activity with full rescue details
    const rescueDetails = [
      `Title: ${data.title || 'Rescue #' + id}`,
      `Status: ${data.status}`,
      `Type: ${data.emergency_type || 'N/A'}`,
      `People: ${(data.male_count || 0) + (data.female_count || 0)} (M: ${
        data.male_count || 0
      }, F: ${data.female_count || 0})`,
      `Address: ${data.address || 'N/A'}`,
      `Contact Phone: ${data.contact_phone || 'N/A'}`,
      `Email: ${data.email || 'N/A'}`,
      `Created: ${new Date(data.created_at).toLocaleString()}`,
    ].join(' | ');

    await logRescueAction('delete', parseInt(id), rescueDetails, userId);

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
