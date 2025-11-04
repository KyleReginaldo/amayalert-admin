import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, attachment_url } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { success: false, error: 'Message and userId are required' },
        { status: 400 },
      );
    }

    // Call OneSignal API from server (no CORS issues)
    const payload = {
      app_id: '1811210d-e4b7-4304-8cd5-3de7a1da8e26',
      contents: {
        en: message,
      },
      headings: {
        en: 'New Message from Admin',
      },
      target_channel: 'push',
      huawei_category: 'MARKETING',
      huawei_msg_type: 'message',
      priority: 10,
      ios_interruption_level: 'active',
      ios_badgeType: 'None',
      ttl: 259200,
      big_picture: attachment_url ? attachment_url : null,
      include_aliases: {
        external_id: [userId],
      },
    };

    console.log('OneSignal payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer Key ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OneSignal API error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Push notification failed: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
