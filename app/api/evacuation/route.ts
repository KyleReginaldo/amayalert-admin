import { supabase } from '@/app/client/supabase';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

type EvacuationCenterInsert = Database['public']['Tables']['evacuation_centers']['Insert'];
// type EvacuationCenter = Database['public']['Tables']['evacuation_centers']['Row'];

// Twilio configuration
const getTwilioConfig = () => {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_NUMBER;
  const messagingService = process.env.MESSAGING_SERVICE;

  if (!accountSid || !authToken || !twilioNumber) {
    throw new Error('Missing required Twilio configuration');
  }

  return {
    client: twilio(accountSid, authToken),
    twilioNumber,
    messagingService,
  };
};

async function sendSMS(to: string, message: string) {
  try {
    const config = getTwilioConfig();

    const messageOptions: {
      body: string;
      to: string;
      from?: string;
      messagingServiceSid?: string;
    } = {
      body: message,
      to: to.startsWith('+') ? to : `+${to}`,
      from: process.env.TWILIO_FROM,
    };

    // Use messaging service if available, otherwise use Twilio number
    if (config.messagingService) {
      messageOptions.messagingServiceSid = config.messagingService;
    } else {
      messageOptions.from = config.twilioNumber;
    }
    const twilioMessage = await config.client.messages.create(messageOptions);
    console.log(`twilio message: ${JSON.stringify(twilioMessage)}`);
    return { success: true, sid: twilioMessage.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
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
      current_occupancy: body.current_occupancy || null,
      status: body.status || 'open',
      contact_name: body.contact_name || null,
      contact_phone: body.contact_phone || null,
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
    const { data: users } = await supabase.from('users').select('phone_number').eq('role', 'user');

    if (users && users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`\n\nSending SMS alerts to ${user.phone_number}`);

        if (user.phone_number) {
          try {
            const smsResult = await sendSMS(
              user.phone_number,
              `NEW EVACUATION CENTER\nAng bagong evacuation ay mahahanap niyo sa ${data.address}\nkasalukuyang kapasidad ay ${data.current_occupancy}/${data.capacity}\nMaaring kontakin si ${data.contact_name} ${data.contact_phone}`,
            );

            if (smsResult.success) {
              console.log(`SMS sent successfully to ${user.phone_number}, SID: ${smsResult.sid}`);
            } else {
              console.error(`Failed to send SMS to ${user.phone_number}:`, smsResult.error);
            }
          } catch (error) {
            console.error('Error sending SMS to', user.phone_number, error);
          }
        }
      }
    } else {
      console.log('No users found for SMS notifications');
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
