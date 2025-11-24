import { supabase } from '@/app/client/supabase';
import { logEvacuationAction } from '@/app/lib/activity-logger';
import emailService from '@/app/lib/email-service';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
type EvacuationCenterInsert = Database['public']['Tables']['evacuation_centers']['Insert'];

const getTwilioConfig = () => {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    throw new Error('Missing required Twilio configuration');
  }

  console.log('✅ Twilio config initialized');

  return {
    client: twilio(accountSid, authToken, { timeout: 30000 }),
    twilioNumber,
  };
};

async function sendSMS(to: string, message: string) {
  try {
    const config = getTwilioConfig();

    const messageOptions = {
      body: message,
      to: to.startsWith('+') ? to : `+${to}`,
      from: config.twilioNumber, // ✅ Use Twilio number, not messaging service
    };

    console.log('Sending SMS with options:', messageOptions);

    const twilioMessage = await config.client.messages.create(messageOptions);

    console.log(`✅ SMS sent to ${to}, SID: ${twilioMessage.sid}`);

    return { success: true, sid: twilioMessage.sid };
  } catch (error) {
    console.error('❌ SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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

    // Extract userId from request body
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

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
    const { data: users } = await supabase
      .from('users')
      .select('email, phone_number')
      .eq('role', 'user');
    if (users && users.length > 0) {
      // Send a simple email without images to avoid external assets
      await emailService.sendBulkEmails(
        users?.map((e) => e.email!),
        'New Evacuation Center Alert',
        undefined,
        `<!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>New Evacuation Center Available</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f6f6f6; margin:0; padding:0; }
            .container { max-width:600px; margin:24px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.08);} 
            .header { background:#0b5cff; color:#ffffff; padding:20px; text-align:center }
            .content { padding:20px; color:#111827; }
            .muted { color:#6b7280; font-size:14px }
            .btn { display:inline-block; padding:10px 16px; background:#0b5cff; color:#fff; border-radius:6px; text-decoration:none }
            .meta { background:#f3f4f6; padding:12px; border-radius:6px; margin:12px 0 }
            @media (max-width:420px) { .container{margin:12px} .content{padding:16px} }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:20px">New Evacuation Center Available</h1>
            </div>
            <div class="content">
              <p class="muted">A new evacuation center was just added. Please review the details below and follow local guidance.</p>

              <div class="meta">
                <strong>Center:</strong> ${data.name ?? 'N/A'}<br />
                <strong>Address:</strong> ${data.address ?? 'N/A'}<br />
                <strong>Capacity:</strong> ${data.current_occupancy ?? 'N/A'} / ${
          data.capacity ?? 'N/A'
        }<br />
                <strong>Contact:</strong> ${data.contact_name ?? 'N/A'} ${
          data.contact_phone ? `(${data.contact_phone})` : ''
        }
              </div>

              <p style="margin-top:16px">
                <a class="btn" href="${
                  process.env.NEXT_PUBLIC_BASE_URL || ''
                }/evacuation">View on Amayalert</a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
              <p class="muted" style="font-size:13px">If you didn't expect this message, you can ignore it. Replying to this email will not connect you to emergency services.</p>
            </div>
          </div>
        </body>
        </html>`,
      );
    }
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

    // Log the activity
    await logEvacuationAction(
      'create',
      data.name,
      `Capacity: ${data.capacity}, Status: ${data.status}`,
      userId,
    );

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
