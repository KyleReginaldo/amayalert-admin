import { supabase } from '@/app/client/supabase';
import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface PushResult {
  success: boolean;
  recipients: number;
  targeting: 'device_token' | 'external_id';
  deviceTokenStored: boolean;
  error: string | null;
  raw: unknown;
}

// POST /api/test-notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, testType } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, phone_number, full_name, device_token')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const results: {
      push: PushResult;
      email: { success: boolean; error: string | null };
      sms: { success: boolean; error: string | null; sid?: string };
    } = {
      push: {
        success: false,
        recipients: 0,
        targeting: user.device_token ? 'device_token' : 'external_id',
        deviceTokenStored: !!user.device_token,
        error: null,
        raw: null,
      },
      email: { success: false, error: null },
      sms: { success: false, error: null },
    };

    // Test push notification
    if (testType === 'push' || testType === 'all') {
      try {
        // Prefer device_token targeting; fall back to external_id
        const pushPayload = user.device_token
          ? { message: `[TEST] AmayAlert push test for ${user.full_name}`, deviceToken: user.device_token }
          : { message: `[TEST] AmayAlert push test for ${user.full_name}`, userId };

        const pushResponse = await fetch(`${BASE}/api/notifications/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pushPayload),
          signal: AbortSignal.timeout(15000),
        });

        const raw = await pushResponse.json().catch(() => ({})) as { success?: boolean; recipients?: number; data?: { recipients?: number }; error?: string };
        const recipients = raw?.data?.recipients ?? raw?.recipients ?? 0;

        results.push.raw = raw;
        results.push.recipients = recipients;
        results.push.success = pushResponse.ok && (raw?.success ?? false);
        if (!results.push.success) {
          results.push.error = raw?.error ?? `HTTP ${pushResponse.status}`;
        }
        if (results.push.success && recipients === 0) {
          results.push.error = user.device_token
            ? 'Push sent but 0 recipients — device token may be invalid or unregistered in OneSignal'
            : 'Push sent but 0 recipients — mobile app may not have called OneSignal.login() with this user ID';
        }
      } catch (err) {
        results.push.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Test email notification
    if ((testType === 'email' || testType === 'all') && user.email) {
      try {
        const emailService = await import('@/app/lib/email-service');
        await emailService.default.sendEmail({
          to: user.email,
          from: 'amayalert.site@gmail.com',
          subject: 'Test Email from AmayAlert',
          text: `Hello ${user.full_name},\n\nThis is a test email to verify email notifications are working.\n\nBest regards,\nAmayAlert Team`,
          html: `<h2>Hello ${user.full_name},</h2><p>This is a test email to verify email notifications are working.</p><p>Best regards,<br>AmayAlert Team</p>`,
        });
        results.email.success = true;
      } catch (err) {
        results.email.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Test SMS notification
    if ((testType === 'sms' || testType === 'all') && user.phone_number) {
      try {
        const smsService = await import('@/app/lib/sms-service');
        const smsResult = await smsService.default.sendSMS({
          to: user.phone_number,
          message: `Test SMS from AmayAlert for ${user.full_name}. Verifying SMS notifications.`,
        });
        if (smsResult.success) {
          results.sms.success = true;
          results.sms.sid = smsResult.data?.sid;
        } else {
          results.sms.error = smsResult.error || 'Unknown SMS error';
        }
      } catch (err) {
        results.sms.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
        deviceToken: user.device_token,
      },
      results,
    });
  } catch (error) {
    console.error('Test notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
