import { logAlertAction } from '@/app/lib/activity-logger';
import emailService from '@/app/lib/email-service';
import { Database } from '@/database.types';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

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

// Helper to call internal SMS API (TextBee-backed)
async function sendViaInternalSMSAPI(
  to: string,
  message: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000';
  const url = `${origin.replace(/\/$/, '')}/api/sms`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients: [to], message }),
    });
    if (!resp.ok) {
      type SMSAPIError = { error?: string; details?: string };
      const data: SMSAPIError = await resp.json().catch(() => ({} as SMSAPIError));
      return { success: false, error: data.error || data.details || `HTTP ${resp.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

// POST /api/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract userId from request body
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

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

    // Get notification method from request (default to 'app_push' for backward compatibility)
    const notificationMethod = body.notification_method || 'app_push';

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

    // Send notifications to users based on selected method
    const { data: users } = await supabase
      .from('users')
      .select('id, phone_number, email, role')
      .eq('role', 'user');
    console.log('users', users);

    let smsCount = 0;
    let emailCount = 0;
    let pushCount = 0;
    const smsErrors: string[] = [];
    const emailErrors: string[] = [];
    const pushErrors: string[] = [];

    if (users && users.length > 0) {
      console.log(`Sending notifications to ${users.length} users via ${notificationMethod}`);

      // Send notifications based on selected method
      for (const user of users) {
        const email = user.email;
        const phone = user.phone_number;
        const userId = user.id;

        if (!email && !phone && !userId) continue;

        const title = newAlert?.title ?? 'Emergency Alert';
        const content = newAlert?.content ?? '';
        const base = process.env.NEXT_PUBLIC_BASE_URL || '';
        const alertUrl = `${base}/alert`;

        const html = `<!doctype html><html><body><h2>${title}</h2><p>${content}</p><p><a href="${alertUrl}" style="display:inline-block;padding:10px 14px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">View Alert</a></p><hr/><p style="color:#6b7280;font-size:13px">This is an official notification from AmayAlert.</p></body></html>`;
        const text = `${title}\n\n${content}\n\nView: ${alertUrl}`;

        // Send push notification first (most reliable and free)
        if (userId && (notificationMethod === 'app_push' || notificationMethod === 'both')) {
          try {
            const pushResponse = await fetch(
              `${
                process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
              }/api/notifications/push`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `${title}\n\n${content}`,
                  userId: userId,
                }),
              },
            );

            if (pushResponse.ok) {
              pushCount++;
              console.log(`✅ Push notification sent to user ${userId}`);
            } else {
              const errorData = await pushResponse.json();
              const errorMessage = errorData.error || errorData.details || 'Unknown error';
              console.error(`❌ Push notification failed for user ${userId}:`, errorMessage);

              // For service unavailable errors, add more context
              if (pushResponse.status === 503) {
                pushErrors.push(`${userId}: Service temporarily unavailable (OneSignal outage)`);
              } else {
                pushErrors.push(`${userId}: ${errorMessage}`);
              }
            }
          } catch (err) {
            console.error('Error sending push notification to', userId, err);
            pushErrors.push(
              `${userId}: Network error - ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        // Send email if method includes app notifications
        if (
          (notificationMethod === 'app' ||
            notificationMethod === 'app_push' ||
            notificationMethod === 'both') &&
          email
        ) {
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
            console.log(`✅ Email sent to ${email}`);
          } catch (err) {
            console.error('Error sending email to', email, err);
            emailErrors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // Send SMS if method includes SMS notifications (use internal TextBee-backed API)
        if ((notificationMethod === 'sms' || notificationMethod === 'both') && phone) {
          try {
            const baseDefault = `Alert: "${title}" level ${alertData.alert_level}.`;
            const extras: string[] = [];
            if (content) {
              const trimmed = content.replace(/\s+/g, ' ').trim();
              if (trimmed) {
                const short = trimmed.length > 90 ? trimmed.slice(0, 87) + '…' : trimmed;
                extras.push(short);
              }
            }
            if (process.env.NEXT_PUBLIC_BASE_URL) {
              extras.push(`View: ${process.env.NEXT_PUBLIC_BASE_URL}/alert`);
            }
            let finalMessage = baseDefault;
            if (extras.length) {
              const tail = extras.join(' | ');
              const candidate = `${baseDefault} ${tail}`;
              finalMessage = candidate.length <= 150 ? candidate : baseDefault;
            }
            const smsResult = await sendViaInternalSMSAPI(phone, finalMessage);
            if (smsResult.success) {
              smsCount++;
              console.log(`✅ SMS sent to ${phone}`);
            } else {
              console.error(`❌ SMS failed for ${phone}:`, smsResult.error);
              smsErrors.push(`${phone}: ${smsResult.error}`);
            }
          } catch (err) {
            console.error('Error sending SMS to', phone, err);
            smsErrors.push(`${phone}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    } else {
      console.log('No users found for notifications');
    }

    // Prepare response with notification summary
    let message = 'Alert created successfully';
    const notifications = {
      sms: { sent: smsCount, errors: smsErrors },
      email: { sent: emailCount, errors: emailErrors },
      push: { sent: pushCount, errors: pushErrors },
    };

    if (smsCount > 0 || emailCount > 0 || pushCount > 0) {
      const notificationSummary = [];
      if (pushCount > 0) notificationSummary.push(`${pushCount} push`);
      if (smsCount > 0) notificationSummary.push(`${smsCount} SMS`);
      if (emailCount > 0) notificationSummary.push(`${emailCount} email`);
      message += ` and ${notificationSummary.join(', ')} notifications sent`;

      // Add notification method info to response
      message += ` (Method: ${notificationMethod})`;
    }

    if (smsErrors.length > 0 || emailErrors.length > 0 || pushErrors.length > 0) {
      console.warn('Some notifications failed:', { smsErrors, emailErrors, pushErrors });
    }

    // Log the activity
    await logAlertAction(
      'create',
      alertData.alert_level,
      alertData.title,
      `Sent ${pushCount + smsCount + emailCount} notifications via ${notificationMethod}`,
      userId,
    );

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

// DELETE /api/alerts - Bulk soft delete alerts
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids : [];
    const ids: number[] = rawIds
      .map((x: unknown) => Number(x))
      .filter((n: number) => Number.isFinite(n));
    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids array required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('alert')
      .update({ deleted_at: now })
      .in('id', ids)
      .select();

    if (error) {
      console.error('Bulk delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete alerts' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data, deleted: ids.length });
  } catch (err) {
    console.error('Bulk delete exception:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected error deleting alerts' },
      { status: 500 },
    );
  }
}
