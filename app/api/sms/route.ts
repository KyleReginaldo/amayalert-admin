import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Twilio configuration - support both live and test environments
const getConfig = (useTest: boolean = false) => {
  const accountSid = useTest ? process.env.TEST_ACCOUNT_SID : process.env.ACCOUNT_SID;
  const authToken = useTest ? process.env.TEST_AUTH_TOKEN : process.env.AUTH_TOKEN;
  const twilioNumber = useTest ? process.env.TEST_TWILIO_NUMBER : process.env.TWILIO_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    throw new Error('Missing required Twilio configuration');
  }

  return {
    accountSid,
    authToken,
    twilioNumber,
    client: twilio(accountSid, authToken),
  };
};

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

    // Get Twilio configuration
    const config = getConfig();

    // Prepare message options
    const messageOptions: {
      body: string;
      to: string;
      from: string;
      messagingServiceSid?: string;
    } = {
      body: message,
      to: to.startsWith('+') ? to : `+${to}`,
      from: '+639221200726',
    };

    // Send SMS
    const twilioMessage = await config.client.messages.create(messageOptions);

    return NextResponse.json({
      success: true,
      data: {
        sid: twilioMessage.sid,
        status: twilioMessage.status,
        to: twilioMessage.to,
        from: twilioMessage.from,
        body: twilioMessage.body,
        dateCreated: twilioMessage.dateCreated,
        messagingServiceSid: twilioMessage.messagingServiceSid,
      },
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

// GET endpoint to check SMS service status
export async function GET() {
  try {
    // Try to initialize Twilio client to check configuration
    const config = getConfig(false);

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        twilioNumber: config.twilioNumber,
        environment: process.env.NODE_ENV,
      },
      message: 'SMS service is configured and ready',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'SMS service not properly configured',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 },
    );
  }
}
