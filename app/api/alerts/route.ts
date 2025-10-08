import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

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

// Function to send SMS
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

// GET /api/alerts - Fetch all alerts with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters for filtering
    const search = searchParams.get('search') || '';
    const alert_level = searchParams.get('alert_level') || '';

    // Start building the query
    let query = supabase
      .from('alert')
      .select('*')
      .is('deleted_at', null) // Only get non-deleted alerts
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`content.ilike.%${search}%,title.ilike.%${search}%`);
    }

    // Apply alert level filter
    if (alert_level && alert_level !== 'all') {
      query = query.eq('alert_level', alert_level);
    }

    // Execute query
    const { data: alerts, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch alerts' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: alerts || [],
      total: alerts?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST /api/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // Prepare alert data
    const alertData = {
      title: body.title.trim(),
      content: body.content.trim(),
      alert_level: body.alert_level || 'medium',
    };

    // Insert into database
    const { data: newAlert, error } = await supabase
      .from('alert')
      .insert([alertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create alert' },
        { status: 500 },
      );
    }
    // Send SMS notifications to users
    const { data: users } = await supabase.from('users').select('phone_number').eq('role', 'user');

    if (users && users.length > 0) {
      console.log(`Sending SMS alerts to ${users.length} users`);

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (user.phone_number) {
          try {
            const smsResult = await sendSMS(
              user.phone_number,
              `EMERGENCY ALERT!!!\n\n${newAlert?.title}\n\n${newAlert?.content}\n\nThis is an official emergency notification.`,
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
        data: newAlert,
        message: 'Alert created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 500 });
  }
}
