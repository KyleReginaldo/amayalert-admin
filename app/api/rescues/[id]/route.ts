import { supabase } from '@/app/client/supabase';
import { logRescueAction } from '@/app/lib/activity-logger';
import emailService from '@/app/lib/email-service';
import { Database } from '@/database.types';
import { NextRequest, NextResponse } from 'next/server';
// Internal SMS forwarding using TextBee via /api/sms
async function sendStatusSMSInternal(to: string, message: string) {
  try {
    if (!to) return { success: false, error: 'No recipient phone provided' };
    // Ensure E.164 format (+countrycode...) Basic normalization: prepend '+' if missing
    const phone = to.startsWith('+') ? to : `+${to.replace(/[^0-9]/g, '')}`;
    const originHost =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${originHost}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients: [phone], message }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
type RescueUpdate = Database['public']['Tables']['rescues']['Update'];

// GET /api/rescues/[id] - Fetch a specific rescue
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid rescue ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('rescues')
      .select('*, user:users(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Rescue not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rescue' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error fetching rescue:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rescue' }, { status: 500 });
  }
}

// PUT /api/rescues/[id] - Update a specific rescue
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid rescue ID' }, { status: 400 });
    }

    const body = await request.json();
    // Log incoming payload for easier debugging in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('PUT /api/rescues/[id] payload:', JSON.stringify(body));
    }

    // Extract userId from request body (don't include in updateData)
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

    // Validate required fields if provided
    if (body.title !== undefined && (!body.title || !body.title.trim())) {
      return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
    }
    if (body.female_count !== undefined) {
      const n = Number(body.female_count);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { success: false, error: 'female_count must be a non-negative number' },
          { status: 400 },
        );
      }
    }
    if (body.male_count !== undefined) {
      const n = Number(body.male_count);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { success: false, error: 'male_count must be a non-negative number' },
          { status: 400 },
        );
      }
    }

    // Fetch existing rescue for change detection (status, counts, phone)
    const { data: existingRescue } = await supabase
      .from('rescues')
      .select('id,status,title,emergency_type,female_count,male_count,contact_phone,scheduled_for')
      .eq('id', id)
      .single();

    // Prepare update data
    const updateData: RescueUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Auto-set completed_at when status changes to completed
      if (body.status === 'completed' && !body.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.scheduled_for !== undefined) updateData.scheduled_for = body.scheduled_for;
    if (body.completed_at !== undefined) updateData.completed_at = body.completed_at;
    if (body.user !== undefined) updateData.user = body.user;
    // New schema fields
    if (body.emergency_type !== undefined) updateData.emergency_type = body.emergency_type;
    if (body.female_count !== undefined) updateData.female_count = Number(body.female_count);
    if (body.male_count !== undefined) updateData.male_count = Number(body.male_count);
    if (body.attachments !== undefined) updateData.attachments = body.attachments;
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone;
    if (body.important_information !== undefined)
      updateData.important_information = body.important_information;
    if (body.email !== undefined) updateData.email = body.email;
    console.log(`status: ${body.status}`);

    const { data, error } = await supabase
      .from('rescues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Rescue not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      // Include error message in development to aid debugging
      const errMsg =
        process.env.NODE_ENV === 'development'
          ? error.message || String(error)
          : 'Failed to update rescue';
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }
    // Auto-send SMS when status changes OR when explicitly requested via send_sms using internal SMS API
    try {
      const phone = data.contact_phone || body.contact_phone || existingRescue?.contact_phone;
      const statusChanged = existingRescue && data.status && existingRescue.status !== data.status;
      if (phone && (statusChanged || body.send_sms === true)) {
        const statusText = data.status?.replace('_', ' ') || 'updated';
        const baseMessage = `Amayalert Update: Rescue "${data.title}" is now ${statusText}.`;
        const parts: string[] = [];
        if (data.emergency_type) parts.push(`Type: ${data.emergency_type}`);
        const totalPeople = (data.female_count || 0) + (data.male_count || 0);
        if (totalPeople > 0)
          parts.push(
            `People: ${totalPeople} (${data.female_count || 0}F/${data.male_count || 0}M)`,
          );
        if (data.scheduled_for)
          parts.push(`Schedule: ${new Date(data.scheduled_for).toLocaleDateString()}`);
        const composed = parts.length ? `${baseMessage} ${parts.join(' | ')}` : baseMessage;
        const finalMessage = (body.sms_message as string) || composed;
        const smsResult = await sendStatusSMSInternal(phone, finalMessage);
        if (!smsResult.success) {
          console.warn('Rescue status SMS failed:', smsResult.error);
        }
      }
    } catch (smsErr) {
      console.warn('Rescue update SMS forwarding failed:', smsErr);
    }

    // Optionally send email to all users when requested
    // Admin can include { send_email: true, email_message?: string } in the payload
    if (body.email) {
      const subject = `Rescue update: ${data.title ?? 'Rescue updated'}`;

      const statusColor =
        (data.status === 'completed' && '#16a34a') ||
        (data.status === 'in_progress' && '#f59e0b') ||
        '#0b5cff';

      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.amayalert.org';

      const defaultHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    /* === THEME VARIABLES === */
    :root {
      --bg: #f6f7fb;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #6b7280;
      --border: #e2e8f0;
      --primary: #2563eb;
      --primary-dark: #1e40af;
      --accent: #3b82f6;
      --radius: 16px;
      --shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
      --gradient: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    }

    /* === GLOBAL STYLES === */
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      max-width: 700px;
      margin: 0 auto;
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      border: 1px solid var(--border);
    }

    /* === HEADER === */
    .header {
      background: var(--gradient);
      color: #fff;
      padding: 40px 32px;
      text-align: left;
      position: relative;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .header .sub {
      font-size: 15px;
      opacity: 0.9;
      margin-top: 8px;
      line-height: 1.6;
    }

    /* === CONTENT === */
    .content {
      padding: 36px 32px 40px;
    }

    .top {
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 28px;
    }

    .label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .value {
      font-size: 17px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.5;
    }

    .badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 999px;
      color: #fff;
      font-weight: 600;
      font-size: 10px;
      background: ${statusColor};
      text-transform: capitalize;
      box-shadow: 0 3px 8px rgba(0,0,0,0.12);
    }

    /* === INFO GRID === */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .meta {
      background: #f9fafb;
      padding: 16px 18px;
      border-radius: 12px;
      border: 1px solid var(--border);
      transition: background 0.3s ease;
    }

    .meta:hover {
      background: #f3f4f6;
    }

    /* === NOTES SECTION === */
    .notes {
      margin-top: 28px;
      background: #f1f5f9;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px 22px;
    }

    .notes-title {
      font-size: 13px;
      color: var(--muted);
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: 0.04em;
    }

    /* === PARAGRAPH === */
    p {
      color: #374151;
      font-size: 15px;
      line-height: 1.7;
      margin-top: 24px;
      margin-bottom: 0;
    }

    /* === CTA BUTTON === */
    .cta {
      display: inline-block;
      margin-top: 30px;
      padding: 14px 28px;
      border-radius: 10px;
      background: var(--gradient);
      color: #fff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.01em;
      transition: all 0.25s ease;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
    }

    .cta:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
    }

    /* === FOOTER === */
    .footer {
      background: #f9fafb;
      color: var(--muted);
      font-size: 13px;
      padding: 18px 24px;
      text-align: center;
      border-top: 1px solid var(--border);
      line-height: 1.6;
    }

    /* === RESPONSIVE === */
    @media (max-width: 640px) {
      .content { padding: 28px 20px 36px; }
      .grid { grid-template-columns: 1fr; }
      .top { flex-direction: column; align-items: flex-start; }
      .cta { width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
    
      <!-- Content -->
      <div class="content">
        <div class="top">
          <div>
            <div class="value" style="font-size:18px;">${data.title ?? 'N/A'}</div>
          </div>
          <div>
            <div class="badge">${data.status.replaceAll('_', ' ') ?? 'N/A'}</div>
          </div>
        </div>

        <div class="grid">
          <div class="meta">
            <div class="label">Emergency Type</div>
            <div class="value">${data.emergency_type ?? '—'}</div>
            <div style="height:10px"></div>
            <div class="label">People Affected</div>
            <div class="value">${
              (data.female_count || 0) + (data.male_count || 0) > 0
                ? `${(data.female_count || 0) + (data.male_count || 0)} (${
                    data.female_count || 0
                  } Female, ${data.male_count || 0} Male)`
                : '—'
            }</div>
          </div>
          <br>
          <div class="meta">
            <div class="label">Scheduled For</div>
            <div class="value">${
              data.scheduled_for ? new Date(data.scheduled_for).toLocaleString() : '—'
            }</div>
            <div style="height:10px"></div>
            <div class="label">Priority</div>
            <div class="value">${data.priority ?? '—'}</div>
          </div>
        </div>

        <div style="margin-top:26px">
          <div class="label">Address / Location</div>
          <div class="value">${
            data.lat && data.lng ? `${data.lat}, ${data.lng}` : data.description ?? 'N/A'
          }</div>
        </div>

        <div style="display:flex;gap:20px;margin-top:22px;flex-wrap:wrap">
          <div style="min-width:180px">
            <div class="label">Contact Phone</div>
            <div class="value">${data.contact_phone ?? 'N/A'}</div>
          </div>
          <div style="min-width:180px">
            <div class="label">Contact Email</div>
            <div class="value">${data.email ?? 'N/A'}</div>
          </div>
        </div>

        <div class="notes">
          <div class="notes-title">Rescuer Notes</div>
          <div style="font-size:15px;line-height:1.7;color:#1f2937;">
            ${
              data.important_information ??
              (body.admin_notes as string) ??
              'No additional notes provided.'
            }
          </div>
        </div>

        <p>
          ${
            (body.email_message as string) ||
            'This rescue record has been updated. Please review the latest information in the app.'
          }
        </p>

        <a class="cta" href="${appUrl}/rescue/${data.id ?? ''}">
          Open in App →
        </a>
      </div>

      <div class="footer">
        You are receiving this because you’re subscribed to rescue notifications in your area.<br/>
        © ${new Date().getFullYear()} Rescue Management System — All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>

`;

      // Send bulk emails; don't fail the update if sending fails
      try {
        await emailService.sendEmail({
          to: body.email,
          subject,
          html: defaultHtml,
          from: 'amayalert.site@gmail.com',
        });
      } catch (sendErr) {
        console.warn('Rescue update email send failed:', sendErr);
      }
    }

    // Log the activity
    await logRescueAction(
      'update',
      parseInt(id),
      `Status: ${data.status}, Priority: ${data.priority}`,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Rescue updated successfully',
    });
  } catch (error) {
    console.error('Error updating rescue:', error);
    return NextResponse.json({ success: false, error: 'Failed to update rescue' }, { status: 500 });
  }
}

// DELETE /api/rescues/[id] - Delete a specific rescue
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid rescue ID' }, { status: 400 });
    }

    // Extract userId from request body
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

    const { data, error } = await supabase.from('rescues').delete().eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Rescue not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete rescue' },
        { status: 500 },
      );
    }

    // Log the activity with full rescue details
    const rescueDetails = [
      `Title: ${data.title || 'Rescue #' + id}`,
      `Status: ${data.status}`,
      `Type: ${data.emergency_type || 'N/A'}`,
      `People: ${(data.male_count || 0) + (data.female_count || 0)} (M: ${
        data.male_count || 0
      }, F: ${data.female_count || 0})`,
      `Address: ${data.address || 'N/A'}`,
      `Contact Phone: ${data.contact_phone || 'N/A'}`,
      `Email: ${data.email || 'N/A'}`,
      `Created: ${new Date(data.created_at).toLocaleString()}`,
    ].join(' | ');

    await logRescueAction('delete', parseInt(id), rescueDetails, userId);

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Rescue deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rescue:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete rescue' }, { status: 500 });
  }
}
