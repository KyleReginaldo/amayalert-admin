import { NextResponse } from 'next/server';
import { emailService } from '../../../lib/email-service';

export async function GET() {
  console.log('🔧 Testing email service...');

  try {
    // Test SMTP connection first
    const isConnected = await emailService.verifyConnection();
    console.log('📧 SMTP Connection:', isConnected);

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP connection failed',
          step: 'connection_test',
        },
        { status: 500 },
      );
    }

    // Test sending a simple email
    const testResult = await emailService.sendEmail({
      to: 'koyaemer@gmail.com',
      subject: 'Test Email from Amayalert',
      text: 'This is a test email to verify the email service is working.',
    });

    console.log('📧 Test email result:', testResult);

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'Email test passed!' : 'Email test failed',
      result: testResult,
      step: 'email_send_test',
    });
  } catch (error) {
    console.error('🚨 Email test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'catch_block',
      },
      { status: 500 },
    );
  }
}
