import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message: string | undefined = body.message;

    let recipients: string[] = [];
    if (Array.isArray(body.recipients)) recipients = body.recipients as string[];
    else if (typeof body.to === 'string') recipients = [body.to as string];

    if (!message || recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: recipients (or to) and message are required',
        },
        { status: 400 },
      );
    }

    // Basic E.164 validation for each recipient
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    const invalid = recipients.filter((n) => !phoneRegex.test(String(n).replace(/\s+/g, '')));
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number(s). Use international format (e.g., +15551234567)',
          details: `Invalid: ${invalid.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.TEXTBEE_API_KEY;
    const deviceId = process.env.TEXTBEE_DEVICE_ID;
    const baseUrl = process.env.TEXTBEE_BASE_URL || 'https://api.textbee.dev';

    if (!apiKey || !deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing TextBee configuration',
          details:
            'Set TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID in your environment (Vercel/locally).',
        },
        { status: 500 },
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/gateway/devices/${deviceId}/send-sms`;
    const payload = { recipients, message };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'TextBee API error',
          details: typeof data === 'object' && data ? JSON.stringify(data) : 'Unknown error',
        },
        { status: resp.status || 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'SMS sent successfully via TextBee',
    });
  } catch (error) {
    console.error('SMS sending error (TextBee):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'SMS API ready' });
}
