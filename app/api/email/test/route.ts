import { NextResponse } from 'next/server';
import { emailService } from '../../../lib/email-service';

// GET /api/email/test - Test email sending
export async function GET() {
  try {
    console.log('Testing email service...');

    // First verify SMTP connection
    const isConnected = await emailService.verifyConnection();
    console.log('SMTP connection status:', isConnected);

    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'SMTP connection failed' },
        { status: 500 },
      );
    }

    // Test sending a simple email
    const testResult = await emailService.sendEmail({
      to: process.env.SMTP_USER!, // Send to yourself
      subject: 'Amayalert Email Test',
      text: 'This is a test email from Amayalert to verify the email service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px;">
            <h1 style="margin: 0;">✅ Amayalert Email Test</h1>
            <p style="margin: 5px 0 0 0;">Email service is working correctly!</p>
          </div>
          <div style="padding: 20px; background-color: #f8f9fa; margin-top: 20px; border-radius: 8px;">
            <p>This is a test email to verify that your Amayalert email service is configured and working properly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Environment:</strong> Development</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      {
        smtpConnection: isConnected,
        emailTest: testResult,
        message: 'Email test completed',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      {
        error: 'Email test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
