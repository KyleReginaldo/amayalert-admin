import emailService from '@/app/lib/email-service';
import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
// const getTwilioConfig = () => {
//   const accountSid = process.env.ACCOUNT_SID;
//   const authToken = process.env.AUTH_TOKEN;
//   const twilioNumber = process.env.TWILIO_NUMBER;

//   if (!accountSid || !authToken || !twilioNumber) {
//     throw new Error('Missing required Twilio configuration');
//   }

//   console.log('✅ Twilio config initialized');

//   return {
//     client: twilio(accountSid, authToken, { timeout: 30000 }),
//     twilioNumber,
//   };
// };

// async function sendSMS(to: string, message: string) {
//   try {
//     const config = getTwilioConfig();

//     const messageOptions = {
//       body: message,
//       to: to.startsWith('+') ? to : `+${to}`,
//       from: config.twilioNumber, // ✅ Use Twilio number, not messaging service
//     };

//     console.log('Sending SMS with options:', messageOptions);

//     const twilioMessage = await config.client.messages.create(messageOptions);

//     console.log(`✅ SMS sent to ${to}, SID: ${twilioMessage.sid}`);

//     return { success: true, sid: twilioMessage.sid };
//   } catch (error) {
//     console.error('❌ SMS sending error:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// }

// GET /api/alerts - Fetch all alerts with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters for filtering
    const search = searchParams.get('search') || '';
    const alert_level = searchParams.get('alert_level') || '';

    // Start building the query
    let query = supabase.from('alert').select('*');

    // Apply search filter
    if (search) {
      query = query.or(`content.ilike.%${search}%,title.ilike.%${search}%`);
    }

    // Apply alert level filter
    if (alert_level && alert_level !== 'all') {
      query = query.eq('alert_level', alert_level);
    }

    // Execute query
    const { data: alerts, error } = await query
      .is('deleted_at', null) // Only get non-deleted alerts
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error2:', error);
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
      .insert(alertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error3:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create alert' },
        { status: 500 },
      );
    }

    // Send notifications to users (both SMS and Email)
    const { data: users } = await supabase
      .from('users')
      .select('phone_number, email')
      .eq('role', 'user')
      .not('phone_number', 'is', null);
    console.log('users', users);

    const smsCount = 0;
    let emailCount = 0;
    const smsErrors: string[] = [];
    const emailErrors: string[] = [];

    if (users && users.length > 0) {
      console.log(`Sending notifications to ${users.length} users`);

      // Collect SMS and Email recipients
      const emailRecipients: string[] = [];

      users.forEach((user) => {
        if (user.email) {
          emailRecipients.push(user.email);
        }
      });

      // Send notifications (email preferred). For large recipient lists consider queuing.
      for (const user of users) {
        const email = user.email;
        const phone = user.phone_number;
        if (!email && !phone) continue;

        const title = newAlert?.title ?? 'Emergency Alert';
        const content = newAlert?.content ?? '';
        const base = process.env.NEXT_PUBLIC_BASE_URL || '';
        const alertUrl = `${base}/alert`;

        const html = `<!doctype html><html><body><h2>${title}</h2><p>${content}</p><p><a href="${alertUrl}" style="display:inline-block;padding:10px 14px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">View Alert</a></p><hr/><p style="color:#6b7280;font-size:13px">This is an official notification from AmayAlert.</p></body></html>`;
        const text = `${title}\n\n${content}\n\nView: ${alertUrl}`;

        if (email) {
          try {
            await emailService.sendEmail({
              to: email,
              from: 'amayalert.site@gmail.com',
              subject: `[ALERT] ${title}`,
              text,
              html,
              replyTo: 'amayalert.site@gmail.com',
            });
            emailCount++;
          } catch (err) {
            console.error('Error sending email to', email, err);
            emailErrors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // Note: SMS sending is intentionally disabled here for bulk alerts to avoid long request times.
        // Enqueue SMS jobs (or use a worker) instead of sending synchronously for large user lists.
      }
    } else {
      console.log('No users found for SMS notifications');
    }

    // Send Email notifications

    // Prepare response with notification summary
    let message = 'Alert created successfully';
    const notifications = {
      sms: { sent: smsCount, errors: smsErrors },
      email: { sent: emailCount, errors: emailErrors },
    };

    if (smsCount > 0 || emailCount > 0) {
      const notificationSummary = [];
      if (smsCount > 0) notificationSummary.push(`${smsCount} SMS`);
      if (emailCount > 0) notificationSummary.push(`${emailCount} email`);
      message += ` and ${notificationSummary.join(' and ')} notifications sent`;
    }

    if (smsErrors.length > 0 || emailErrors.length > 0) {
      console.warn('Some notifications failed:', { smsErrors, emailErrors });
    }

    return NextResponse.json(
      {
        success: true,
        data: newAlert,
        message,
        notifications,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 500 });
  }
}
