import { supabase } from '@/app/client/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify notification systems
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, testType } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const results: Record<string, { success: boolean; error: string | null; sid?: string }> = {
      push: { success: false, error: null },
      email: { success: false, error: null },
      sms: { success: false, error: null },
    };

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, phone_number, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Test push notification
    if (testType === 'push' || testType === 'all') {
      try {
        const pushResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/push`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Test notification for ${user.full_name}`,
              userId: userId,
            }),
          },
        );

        if (pushResponse.ok) {
          results.push.success = true;
        } else {
          const errorData = await pushResponse.text();
          results.push.error = errorData;
        }
      } catch (err) {
        results.push.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Test email notification
    if ((testType === 'email' || testType === 'all') && user.email) {
      try {
        // Import email service
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
          message: `Test SMS from AmayAlert for ${user.full_name}. This is to verify SMS notifications are working.`,
        });

        if (smsResult.success) {
          results.sms.success = true;
          results.sms.sid = smsResult.data?.sid;
        } else {
          results.sms.error = smsResult.error || 'Unknown SMS error';
        }
      } catch (err: unknown) {
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
      },
      results,
      message: 'Test notifications completed. Check results for details.',
    });
  } catch (error) {
    console.error('Test notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
