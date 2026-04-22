import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, deviceToken, attachment_url, userIds, deviceTokens } = body;

    const isBatch = Array.isArray(userIds) || Array.isArray(deviceTokens);

    if (!message || (!isBatch && !userId && !deviceToken)) {
      return NextResponse.json(
        { success: false, error: 'Message and either userId/deviceToken (or userIds/deviceTokens arrays) are required' },
        { status: 400 },
      );
    }

    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_API_KEY;

    const basePayload = {
      app_id: appId,
      contents: { en: message },
      headings: { en: 'AmayAlert' },
      target_channel: 'push',
      priority: 10,
      ios_interruption_level: 'active',
      ios_badgeType: 'None',
      ttl: 259200,
      ...(attachment_url ? { big_picture: attachment_url } : {}),
    };

    if (isBatch) {
      // Batch mode: one call per targeting strategy
      const allTokens: string[] = Array.isArray(deviceTokens) ? deviceTokens : [];
      const allExternalIds: string[] = Array.isArray(userIds) ? userIds : [];

      const calls: Promise<Response>[] = [];
      if (allTokens.length > 0) {
        calls.push(fetch('https://api.onesignal.com/notifications?c=push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
          body: JSON.stringify({ ...basePayload, include_subscription_ids: allTokens }),
          signal: AbortSignal.timeout(12000),
        }));
      }
      if (allExternalIds.length > 0) {
        calls.push(fetch('https://api.onesignal.com/notifications?c=push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
          body: JSON.stringify({ ...basePayload, include_aliases: { external_id: allExternalIds } }),
          signal: AbortSignal.timeout(12000),
        }));
      }

      const results = await Promise.allSettled(calls);
      let totalRecipients = 0;
      const errors: string[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const d = await r.value.json().catch(() => ({})) as { recipients?: number; errors?: string[] };
          totalRecipients += d.recipients ?? 0;
          if (!r.value.ok && d.errors?.[0]) errors.push(d.errors[0]);
        } else {
          errors.push(r.reason instanceof Error ? r.reason.message : 'Network error');
        }
      }
      return NextResponse.json({ success: true, recipients: totalRecipients, errors });
    }

    // Single-user mode (unchanged behaviour)
    const targeting = deviceToken
      ? { include_subscription_ids: [deviceToken] }
      : { include_aliases: { external_id: [userId] } };

    const response = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({ ...basePayload, ...targeting }),
    });

    const data = await response.json() as { id?: string; recipients?: number; errors?: unknown };

    if (!response.ok) {
      console.error('OneSignal API error:', { status: response.status, body: data });
      return NextResponse.json(
        { success: false, error: `Push notification failed: ${response.status}`, details: data },
        { status: response.status },
      );
    }

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
