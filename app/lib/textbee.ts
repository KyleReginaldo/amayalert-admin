/**
 * TextBee SMS utility — server-side only.
 * Call this directly from API routes instead of fetching /api/sms,
 * which avoids the self-referential HTTP hop and preserves full error details.
 */

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

/** TextBee free plan limit: 50 recipients per API call. */
const TEXTBEE_BATCH_SIZE = 50;

/** Delay (ms) between batches to stay well within rate limits. */
const BATCH_DELAY_MS = 1_500;

/** Normalize a Philippine local number (09XXXXXXXXX) to E.164 (+639XXXXXXXXX).
 *  Already-correct numbers are returned as-is. */
export function normalizePhone(raw: string): string {
  const stripped = raw.replace(/[\s\-().]/g, '');
  if (stripped.startsWith('+')) return stripped;
  // Philippine local: 0XXXXXXXXX → +63XXXXXXXXX
  if (stripped.startsWith('09') && stripped.length === 11) {
    return '+63' + stripped.slice(1);
  }
  // Prepend + for any other all-digit string
  return '+' + stripped.replace(/[^0-9]/g, '');
}

export interface TextBeeResult {
  sent: number;
  error?: string;
  details?: string;
}

/** Send a single batch (≤50) to TextBee. Returns sent count or error. */
async function sendOneBatch(
  normalized: string[],
  message: string,
  apiKey: string,
  deviceId: string,
  baseUrl: string,
  timeoutMs: number,
): Promise<TextBeeResult> {
  const url = `${baseUrl}/api/v1/gateway/devices/${deviceId}/send-sms`;
  const body = JSON.stringify({
    recipients: normalized,
    message: `Amayalert - Official Notification\n\n${message}`,
  });

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });

    let data: Record<string, unknown> | null = null;
    try {
      data = (await resp.json()) as Record<string, unknown>;
    } catch {
      // non-JSON body
    }

    if (!resp.ok) {
      const textbeeMsg =
        (data &&
          (typeof data.message === 'string'
            ? data.message
            : typeof data.error === 'string'
            ? data.error
            : null)) ||
        `HTTP ${resp.status}`;
      return {
        sent: 0,
        error: `TextBee error (${resp.status}): ${textbeeMsg}`,
        details: data ? JSON.stringify(data) : undefined,
      };
    }

    return { sent: normalized.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: 0, error: `TextBee request failed: ${msg}` };
  }
}

/**
 * Send SMS to one or more recipients via TextBee.
 * Automatically splits into batches of 50 to stay within plan limits.
 * Reads TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID, and optionally TEXTBEE_BASE_URL from env.
 */
export async function sendViTextBee(
  phones: string[],
  message: string,
  timeoutMs = 15_000,
): Promise<TextBeeResult> {
  if (phones.length === 0) return { sent: 0 };

  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  const baseUrl = (process.env.TEXTBEE_BASE_URL || 'https://api.textbee.dev').replace(/\/$/, '');

  if (!apiKey || !deviceId) {
    return {
      sent: 0,
      error: 'TextBee not configured',
      details: 'Set TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID in your environment.',
    };
  }

  // Normalize + validate
  const normalized = phones.map(normalizePhone);
  const invalid = normalized.filter((n) => !PHONE_REGEX.test(n));
  if (invalid.length > 0) {
    return {
      sent: 0,
      error: `Invalid phone number(s): ${invalid.join(', ')}`,
      details: 'Numbers must be in E.164 format, e.g. +639171234567',
    };
  }

  // Split into ≤50-recipient batches
  const batches: string[][] = [];
  for (let i = 0; i < normalized.length; i += TEXTBEE_BATCH_SIZE) {
    batches.push(normalized.slice(i, i + TEXTBEE_BATCH_SIZE));
  }

  let totalSent = 0;
  const errors: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    if (i > 0) {
      // Small pause between batches
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    const result = await sendOneBatch(batches[i], message, apiKey, deviceId, baseUrl, timeoutMs);
    totalSent += result.sent;
    if (result.error) {
      errors.push(`Batch ${i + 1}/${batches.length}: ${result.error}`);
    }
  }

  if (errors.length > 0) {
    return {
      sent: totalSent,
      error: errors.join(' | '),
    };
  }

  return { sent: totalSent };
}
