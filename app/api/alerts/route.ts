import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { emailService } from '../../lib/email-service';

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

    // Send notifications to users (both SMS and Email)
    const { data: users } = await supabase
      .from('users')
      .select('phone_number, email')
      .eq('role', 'user');

    let smsCount = 0;
    let emailCount = 0;
    const smsErrors: string[] = [];
    const emailErrors: string[] = [];

    if (users && users.length > 0) {
      console.log(`Sending notifications to ${users.length} users`);

      // Collect SMS and Email recipients
      const smsRecipients: string[] = [];
      const emailRecipients: string[] = [];

      users.forEach((user) => {
        if (user.phone_number) {
          smsRecipients.push(user.phone_number);
        }
        if (user.email) {
          emailRecipients.push(user.email);
        }
      });

      // Send SMS notifications
      if (smsRecipients.length > 0) {
        console.log(`Sending SMS alerts to ${smsRecipients.length} users`);

        for (const phoneNumber of smsRecipients) {
          try {
            const smsResult = await sendSMS(
              phoneNumber,
              `EMERGENCY ALERT!!!\n\n${newAlert?.title}\n\n${newAlert?.content}\n\nThis is an official emergency notification.`,
            );
            if (smsResult.success) {
              console.log(`SMS sent successfully to ${phoneNumber}, SID: ${smsResult.sid}`);
              smsCount++;
            } else {
              console.error(`Failed to send SMS to ${phoneNumber}:`, smsResult.error);
              smsErrors.push(`${phoneNumber}: ${smsResult.error}`);
            }
          } catch (error) {
            console.error('Error sending SMS to', phoneNumber, error);
            smsErrors.push(
              `${phoneNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }
      } else {
        console.log('No users found for SMS notifications');
      }

      // Send Email notifications
      if (emailRecipients.length > 0) {
        console.log(`Sending email alerts to ${emailRecipients.length} users`);

        try {
          const emailResult = await emailService.sendEmergencyAlert(emailRecipients, {
            title: newAlert?.title || 'Emergency Alert',
            content:
              newAlert?.content || 'Please check local emergency services for more information.',
            alertLevel: newAlert?.alert_level || 'medium',
            location: undefined, // Can be enhanced to include location if available
          });

          if (emailResult.success) {
            console.log(`Email alerts sent successfully to ${emailRecipients.length} recipients`);
            emailCount = emailRecipients.length;
          } else {
            console.error('Failed to send email alerts:', emailResult.error);
            emailErrors.push(`Bulk email failed: ${emailResult.error}`);
          }
        } catch (error) {
          console.error('Error sending email alerts:', error);
          emailErrors.push(
            `Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      } else {
        console.log('No users found for email notifications');
      }
    } else {
      console.log('No users found for notifications');
    }

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
