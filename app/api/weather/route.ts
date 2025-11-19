import { supabase } from '@/app/client/supabase';
import emailService from '@/app/lib/email-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/weather
 * Fetch weekly (5-day) forecast from Google Weather API
 * Query params:
 *   lat (number) - optional (default sample)
 *   lng (number) - optional (default sample)
 *   days (number) - optional (default 5)
 *   broadcast (boolean) - if true and method POST, send email to all users
 *
 * POST /api/weather (JSON body optional)
 *   { lat?: number, lng?: number, days?: number, broadcast?: boolean }
 */

const GOOGLE_BASE = 'https://weather.googleapis.com/v1/forecast/days:lookup';

interface DayPartForecast {
  weatherCondition?: {
    description?: { text?: string };
  };
  relativeHumidity?: number;
  precipitation?: {
    probability?: { percent?: number };
  };
}

interface GoogleForecastResponse {
  forecastDays: Array<{
    interval: { startTime: string; endTime: string };
    displayDate: { year: number; month: number; day: number };
    daytimeForecast?: DayPartForecast;
    nighttimeForecast?: DayPartForecast;
    maxTemperature?: { degrees: number; unit: string };
    minTemperature?: { degrees: number; unit: string };
    feelsLikeMaxTemperature?: { degrees: number; unit: string };
    feelsLikeMinTemperature?: { degrees: number; unit: string };
  }>;
  timeZone?: { id: string };
  nextPageToken?: string;
}

function formatDate(d: { year: number; month: number; day: number }) {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

async function fetchForecast(
  lat: number,
  lng: number,
  days: number,
): Promise<GoogleForecastResponse> {
  const key = process.env.GOOGLE_WEATHER_API_KEY || process.env.GOOGLE_API_KEY; // allow flexibility
  if (!key) {
    throw new Error('Missing GOOGLE_WEATHER_API_KEY environment variable');
  }

  const params = new URLSearchParams();
  params.append('key', key);
  params.append('location.latitude', lat.toString());
  params.append('location.longitude', lng.toString());
  // Google endpoint returns up to ~7 days by default; we can truncate client side

  const url = `${GOOGLE_BASE}?${params.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Weather API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as GoogleForecastResponse;
  if (Array.isArray(data.forecastDays) && data.forecastDays.length > days) {
    data.forecastDays = data.forecastDays.slice(0, days);
  }
  return data;
}

function buildEmailHtml(data: GoogleForecastResponse, lat: number, lng: number): string {
  const tz = data.timeZone?.id || 'UTC';
  const rows = data.forecastDays
    .map((day) => {
      const dateStr = formatDate(day.displayDate);
      const dayCond = day.daytimeForecast?.weatherCondition?.description?.text || '—';
      const nightCond = day.nighttimeForecast?.weatherCondition?.description?.text || '—';
      const max =
        day.maxTemperature?.degrees != null ? `${day.maxTemperature.degrees.toFixed(1)}°C` : '—';
      const min =
        day.minTemperature?.degrees != null ? `${day.minTemperature.degrees.toFixed(1)}°C` : '—';
      const humDay = day.daytimeForecast?.relativeHumidity ?? '—';
      const humNight = day.nighttimeForecast?.relativeHumidity ?? '—';
      const rainProbDay = day.daytimeForecast?.precipitation?.probability?.percent ?? '—';
      const rainProbNight = day.nighttimeForecast?.precipitation?.probability?.percent ?? '—';
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;white-space:nowrap">${dateStr}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${max}/${min}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${dayCond}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${nightCond}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${rainProbDay}% / ${rainProbNight}%</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${humDay}% / ${humNight}%</td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" /><title>Weekly Weather</title></head>
  <body style="font-family:Inter,Arial,sans-serif;background:#f6f7fb;padding:24px;">
    <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08)">
      <div style="background:linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%);color:#fff;padding:32px 36px">
        <h1 style="margin:0;font-size:26px;letter-spacing:-0.5px">Weekly Weather Forecast</h1>
        <p style="margin:6px 0 0;font-size:14px;opacity:.9">Location: ${lat.toFixed(
          4,
        )}, ${lng.toFixed(4)} • Time Zone: ${tz}</p>
      </div>
      <div style="padding:28px 32px">
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6">Here's the upcoming weather outlook. Stay prepared and stay safe.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 12px;text-align:left">Date</th>
              <th style="padding:10px 12px;text-align:left">Max/Min</th>
              <th style="padding:10px 12px;text-align:left">Day</th>
              <th style="padding:10px 12px;text-align:left">Night</th>
              <th style="padding:10px 12px;text-align:center">Rain % (D/N)</th>
              <th style="padding:10px 12px;text-align:center">Humidity (D/N)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:26px;padding:16px 18px;background:#ecfeff;border:1px solid #06b6d4;border-radius:12px;color:#0f172a;font-size:13px;line-height:1.6">
          <strong style="display:block;margin-bottom:6px">Reminder</strong>
          Thunderstorm probabilities and precipitation amounts are estimates; conditions can change rapidly. Always follow official advisories.
        </div>
      </div>
      <div style="background:#f1f5f9;padding:14px 20px;text-align:center;font-size:11px;color:#64748b">© ${new Date().getFullYear()} Amayalert • Automated Weather Digest</div>
    </div>
  </body></html>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '14.390137');
    const lng = parseFloat(searchParams.get('lng') || '120.829041');
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '5'), 1), 7);
    const forecast = await fetchForecast(lat, lng, days);
    return NextResponse.json({ success: true, data: forecast });
  } catch (error) {
    console.error('Weather GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch weather' },
      { status: 500 },
    );
  }
}

type PushResponse = { success: boolean; data?: unknown; error?: string; status?: number };

async function sendWeatherPush(
  forecast: GoogleForecastResponse,
  lat: number,
  lng: number,
): Promise<PushResponse> {
  try {
    const first = forecast.forecastDays[0];
    const dateStr = first ? formatDate(first.displayDate) : 'Upcoming Week';
    const dayCond = first?.daytimeForecast?.weatherCondition?.description?.text || '—';
    const max =
      first?.maxTemperature?.degrees != null ? `${first.maxTemperature.degrees.toFixed(0)}°C` : '';
    const min =
      first?.minTemperature?.degrees != null ? `${first.minTemperature.degrees.toFixed(0)}°C` : '';
    const contents = `(${dateStr}): ${dayCond} ${max && min ? `(${max}/${min})` : ''}`.trim();
    const title = 'Weekly Weather Forecast';
    const apiKey = process.env.ONESIGNAL_API_KEY;
    const appId = process.env.ONESIGNAL_APP_ID || '1811210d-e4b7-4304-8cd5-3de7a1da8e26';
    if (!apiKey || !appId) {
      return { success: false, error: 'Missing OneSignal env vars' };
    }
    const payload = {
      app_id: appId,
      included_segments: ['All'],
      headings: { en: title },
      contents: { en: contents },
      data: { lat, lng, days: forecast.forecastDays.length },
      ttl: 21600,
      target_channel: 'push',
      ios_interruption_level: 'active',
      priority: 10,
    };
    const resp = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer Key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, status: resp.status, error: text };
    }
    const data = await resp.json();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const lat = typeof body.lat === 'number' ? body.lat : 14.390137;
    const lng = typeof body.lng === 'number' ? body.lng : 120.829041;
    const days = Math.min(Math.max(typeof body.days === 'number' ? body.days : 5, 1), 7);
    const broadcast = body.broadcast === true;
    const push = body.push === true; // new flag
    const forecast = await fetchForecast(lat, lng, days);
    type SendBulkEmailsReturn = Awaited<ReturnType<typeof emailService.sendBulkEmails>>;
    let emailResp: SendBulkEmailsReturn | null = null;
    if (broadcast) {
      const { data: users, error } = await supabase
        .from('users')
        .select('email')
        .not('email', 'is', null);
      if (error) {
        console.error('Failed to load users for weather broadcast:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to load users' },
          { status: 500 },
        );
      }
      const emails = (users || []).map((u) => u.email).filter((e): e is string => !!e);
      if (emails.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No user emails to send' },
          { status: 400 },
        );
      }
      const html = buildEmailHtml(forecast, lat, lng);
      const text = `Weekly Weather Forecast for (${lat.toFixed(4)}, ${lng.toFixed(4)})\nDays: ${
        forecast.forecastDays.length
      }`;
      emailResp = await emailService.sendBulkEmails(
        emails,
        `Weekly Weather Forecast (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        text,
        html,
      );
    }
    let pushResp: PushResponse | null = null;
    if (push) {
      pushResp = await sendWeatherPush(forecast, lat, lng);
    }
    return NextResponse.json({ success: true, data: forecast, email: emailResp, push: pushResp });
  } catch (error) {
    console.error('Weather POST error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process request' },
      { status: 500 },
    );
  }
}
