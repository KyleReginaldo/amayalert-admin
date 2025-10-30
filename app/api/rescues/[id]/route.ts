import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Twilio configuration
const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_FROM || process.env.TWILIO_NUMBER;
  const messagingService = process.env.MESSAGING_SERVICE_SID || process.env.MESSAGING_SERVICE;

  if (!accountSid || !authToken) {
    throw new Error('Missing required Twilio credentials');
  }

  return {
    client: twilio(accountSid, authToken),
    twilioNumber,
    messagingService,
  };
};

// Function to send SMS
async function sendSMS(
  to: string,
  message: string,
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const config = getTwilioConfig();

    type MsgWithFrom = { from: string; to: string; body: string };
    type MsgWithService = { messagingServiceSid: string; to: string; body: string };
    const toIntl = to.startsWith('+') ? to : `+${to}`;
    const messageOptions: MsgWithFrom | MsgWithService = config.messagingService
      ? { messagingServiceSid: config.messagingService, to: toIntl, body: message }
      : { from: (config.twilioNumber as string) || '', to: toIntl, body: message };
    console.log('message options:', messageOptions);
    const twilioMessage = await config.client.messages.create(messageOptions);
    console.log(`twilio message: ${JSON.stringify(twilioMessage)}`);
    return { success: true, sid: twilioMessage.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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

    // Validate required fields if provided
    if (body.title !== undefined && (!body.title || !body.title.trim())) {
      return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
    }
    if (body.number_of_people !== undefined) {
      const n = Number(body.number_of_people);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { success: false, error: 'number_of_people must be a non-negative number' },
          { status: 400 },
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
    if (body.number_of_people !== undefined)
      updateData.number_of_people = Number(body.number_of_people);
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone;
    if (body.important_information !== undefined)
      updateData.important_information = body.important_information;
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
      return NextResponse.json(
        { success: false, error: 'Failed to update rescue' },
        { status: 500 },
      );
    }
    // Optionally send SMS when requested
    // Admin can include { send_sms: true, sms_message?: string } in the payload
    // Fallback message will be generated if sms_message is not provided
    if (body.send_sms === true) {
      try {
        const phone = data.contact_phone || body.contact_phone;
        if (phone) {
          // Build a concise SMS message
          const statusText = data.status?.replace('_', ' ') || 'updated';
          const defaultMessage = `Rescue update: "${data.title}" is now ${statusText}.`;
          const extra: string[] = [];
          if (data.emergency_type) extra.push(`Type: ${data.emergency_type}`);
          if (typeof data.number_of_people === 'number')
            extra.push(`People: ${data.number_of_people}`);
          if (data.scheduled_for)
            extra.push(`Schedule: ${new Date(data.scheduled_for).toLocaleDateString()}`);
          if (extra.length) {
            // Keep SMS short=-
            const tail = extra.join(' | ');
            // Only append if it doesn't make it too long
            const candidate = `${defaultMessage} ${tail}`;
            // Allow up to ~150 chars to avoid splitting segments too much
            if (candidate.length <= 150) {
              body.sms_message = candidate;
            }
          }

          const message = (body.sms_message as string) || defaultMessage;

          // Send directly via Twilio (no internal API)
          await sendSMS(phone, message);
        }
      } catch (smsErr) {
        console.warn('Rescue update SMS failed:', smsErr);
        // Do not fail the API if SMS fails; return success for the update
      }
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
