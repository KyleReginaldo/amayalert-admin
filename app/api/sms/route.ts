import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body;

    // Validation
    if (!to || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: to and message are required',
        },
        { status: 400 },
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to.replace(/\s+/g, ''))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number format. Use international format (e.g., +1234567890)',
        },
        { status: 400 },
      );
    }

    console.log('from twilio:', process.env.TWILIO_FROM);
    const twilioIns = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
    const twilioMessage = await twilioIns.messages.create({
      messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
      // from: process.env.TWILIO_FROM,
      to: to,
      body: message,
    });
    console.log('Twilio response:', twilioMessage);
    return NextResponse.json({
      success: true,
      data: twilioMessage.body,
      message: 'SMS sent successfully',
    });
  } catch (error) {
    console.error('SMS sending error:', error);

    // Handle specific Twilio errors
    if (error instanceof Error) {
      let errorMessage = 'Failed to send SMS';
      let statusCode = 500;

      // Check for common Twilio error codes
      if (error.message.includes('21211')) {
        errorMessage = 'Invalid phone number';
        statusCode = 400;
      } else if (error.message.includes('21408')) {
        errorMessage = 'Permission denied or invalid credentials';
        statusCode = 401;
      } else if (error.message.includes('21610')) {
        errorMessage = 'Message cannot be sent to this number';
        statusCode = 400;
      } else if (error.message.includes('Missing required Twilio configuration')) {
        errorMessage = 'SMS service not properly configured';
        statusCode = 500;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
