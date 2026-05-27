import { sendViTextBee } from '@/app/lib/textbee';
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

    const result = await sendViTextBee(recipients, message);

    if (result.error) {
      console.error('TextBee error:', result.error, result.details ?? '');
      return NextResponse.json(
        { success: false, error: result.error, details: result.details },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `SMS sent to ${result.sent} recipient(s) via TextBee`,
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
  return NextResponse.json({ success: true, message: 'SMS API ready (TextBee)' });
}
