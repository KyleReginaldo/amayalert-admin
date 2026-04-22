import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, deviceToken, attachment_url } = body;

    if (!message || (!userId && !deviceToken)) {
      return NextResponse.json(
        { success: false, error: 'Message and either userId or deviceToken are required' },
        { status: 400 },
      );
    }

    // Target by device token (subscription ID) if available — more reliable than external_id
    // because external_id requires the mobile app to call OneSignal.login(userId) explicitly.
    // Fallback to external_id alias when no device token is stored.
    const targeting = deviceToken
      ? { include_subscription_ids: [deviceToken] }
      : { include_aliases: { external_id: [userId] } };

    const payload = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: { en: message },
      headings: { en: 'AmayAlert' },
      target_channel: 'push',
      priority: 10,
      ios_interruption_level: 'active',
      ios_badgeType: 'None',
      ttl: 259200,
      ...(attachment_url ? { big_picture: attachment_url } : {}),
      ...targeting,
    };

    const response = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as { id?: string; recipients?: number; errors?: unknown };

    if (!response.ok) {
      console.error('OneSignal API error:', { status: response.status, body: data });
      return NextResponse.json(
        { success: false, error: `Push notification failed: ${response.status}`, details: data },
        { status: response.status },
      );
    }

    // OneSignal returns 200 OK even when recipients=0 (no device matched the target)
    if (data.recipients === 0) {
      const reason = deviceToken
        ? 'device token not registered in OneSignal'
        : 'external_id not linked to any device — mobile app may not have called OneSignal.login()';
      console.warn(`⚠️ Push sent but 0 recipients for user ${userId}: ${reason}`);
      return NextResponse.json(
        { success: false, error: `No device matched: ${reason}` },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
