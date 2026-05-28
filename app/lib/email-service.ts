import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SENDER_EMAIL = process.env.SMTP_USER || 'amayalert1@gmail.com';
const FROM = `"Amayalert" <${SENDER_EMAIL}>`;
const YEAR = new Date().getFullYear();

const LEVEL_COLOR: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#ea580c',
  critical: '#dc2626',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#d97706',
  in_progress: '#2563eb',
  completed: '#16a34a',
  cancelled: '#6b7280',
};

// ─── Shared layout — matches the clean/minimal style in the design ref ────────
function layout(body: string, preview = ''): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
${preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preview}&nbsp;</div>` : ''}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.6; }
  a { color: #2563eb; }
  .wrap { padding: 32px 16px; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; }
  .logo-area { padding: 28px 40px 24px; text-align: center; border-bottom: 1px solid #e0e0e0; }
  .logo-text { font-size: 22px; font-weight: 800; color: #1e3a6e; letter-spacing: -0.02em; }
  .logo-sub { font-size: 12px; color: #6b7280; margin-top: 3px; }
  .body { padding: 32px 40px; }
  .title { font-size: 17px; font-weight: 700; color: #111; margin-bottom: 10px; }
  .subtitle { font-size: 14px; color: #555; margin-bottom: 24px; }
  .kv-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .kv-table td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
  .kv-table td:first-child { color: #6b7280; width: 45%; }
  .kv-table td:last-child { font-weight: 700; color: #111; }
  .kv-table tr:last-child td { border-bottom: none; }
  .divider { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
  .body-text { font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 14px; }
  .signature { margin-top: 24px; font-size: 14px; color: #555; }
  .signature strong { color: #111; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
  .btn { display: inline-block; padding: 11px 24px; background: #1e3a6e; color: #fff !important; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; margin-top: 20px; }
  .footer { background: #1e3a6e; padding: 28px 40px; }
  .footer-inner { max-width: 600px; margin: 0 auto; display: table; width: 100%; }
  .footer-logo { display: table-cell; vertical-align: middle; width: 45%; }
  .footer-logo-text { font-size: 17px; font-weight: 800; color: #fff; }
  .footer-logo-sub { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 3px; }
  .footer-info { display: table-cell; vertical-align: middle; font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.9; }
  .footer-info a { color: #93c5fd; text-decoration: none; }
  @media (max-width: 480px) {
    .body, .logo-area { padding: 24px 20px; }
    .footer { padding: 24px 20px; }
    .footer-logo, .footer-info { display: block; width: 100%; }
    .footer-logo { margin-bottom: 16px; }
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="logo-area">
      <img src="https://scnowyoufkzayjxrxmft.supabase.co/storage/v1/object/public/files/amayalert.png" alt="Amayalert" style="max-height:56px;width:auto;display:block;margin:0 auto;" />
    </div>
    <div class="body">
      ${body}
      <div class="signature">
        <p class="body-text" style="margin-bottom:4px;">Sincerely,</p>
        <strong>The Amayalert Team</strong><br/>
        <span style="color:#6b7280;font-size:13px;">Emergency, made manageable.</span>
      </div>
    </div>
  </div>
</div>
<div class="footer">
  <div class="footer-inner">
    <div class="footer-logo">
      <img src="https://scnowyoufkzayjxrxmft.supabase.co/storage/v1/object/public/files/amayalert.png" alt="Amayalert" style="max-height:44px;width:auto;display:block;" />
    </div>
    <div class="footer-info">
      <strong style="color:#fff;">Email:</strong> <a href="mailto:${SENDER_EMAIL}">${SENDER_EMAIL}</a><br/>
      <span style="color:rgba(255,255,255,0.45);font-size:11px;">© ${YEAR} Amayalert. All rights reserved. This is an automated message — please do not reply.</span>
    </div>
  </div>
</div>
</body>
</html>`;
}

/** Build a key-value table row */
function kvRow(label: string, value: string): string {
  return `<tr><td>${label}</td><td>${value}</td></tr>`;
}

/** Colored inline badge */
function badge(label: string, color: string): string {
  return `<span class="badge" style="background:${color};color:#fff;">${label}</span>`;
}

// ─── Email Service ────────────────────────────────────────────────────────────
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.SMTP_USER || 'amayalert1@gmail.com';
    const pass = process.env.SMTP_PASSWORD;

    if (!user || !pass) {
      console.warn(
        '⚠️  Email service: SMTP_USER or SMTP_PASSWORD is not set. ' +
          'Email sending will fail. Add a Gmail App Password to your environment variables.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  // ─── Primitives ─────────────────────────────────────────────────────────────

  async sendEmail(options: EmailOptions, retries = 2): Promise<EmailResponse> {
    try {
      const info = await this.transporter.sendMail({
        from: options.from || FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      });
      return { success: true, messageId: info.messageId, message: 'Email sent successfully' };
    } catch (error) {
      const responseCode = (error as { responseCode?: number }).responseCode;
      if (retries > 0 && responseCode === 421) {
        await new Promise((r) => setTimeout(r, 2000));
        return this.sendEmail(options, retries - 1);
      }
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  async sendBulkEmails(
    recipients: string[],
    subject: string,
    text?: string,
    html?: string,
    retries = 2,
  ): Promise<EmailResponse> {
    if (recipients.length === 0) return { success: true, message: 'No recipients' };
    try {
      const info = await this.transporter.sendMail({
        from: FROM,
        bcc: recipients,
        subject,
        text,
        html,
      });
      return {
        success: true,
        messageId: info.messageId,
        message: `Bulk email sent to ${recipients.length} recipients`,
      };
    } catch (error) {
      const responseCode = (error as { responseCode?: number }).responseCode;
      if (retries > 0 && responseCode === 421) {
        await new Promise((r) => setTimeout(r, 2000));
        return this.sendBulkEmails(recipients, subject, text, html, retries - 1);
      }
      console.error('Bulk email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send bulk emails',
      };
    }
  }

  // ─── Branded templates ───────────────────────────────────────────────────────

  /** Emergency alert broadcast to all users */
  async sendAlertEmail(
    recipients: string[],
    alert: { title: string; content: string; alert_level: string },
    alertUrl = '',
  ): Promise<EmailResponse> {
    const color = LEVEL_COLOR[alert.alert_level?.toLowerCase()] ?? '#dc2626';
    const levelLabel = (alert.alert_level ?? 'alert').toUpperCase();

    const html = layout(
      `<p class="title">Emergency Alert Issued</p>
      <p class="subtitle">An official emergency alert has been issued. Please read the details carefully and follow instructions from local authorities.</p>

      <table class="kv-table">
        ${kvRow('Alert Level', badge(levelLabel, color))}
        ${kvRow('Title', alert.title)}
        ${alert.content ? kvRow('Details', alert.content.replace(/\n/g, '<br/>')) : ''}
        ${alertUrl ? kvRow('View Alert', `<a href="${alertUrl}">${alertUrl}</a>`) : ''}
      </table>

      <hr class="divider"/>
      <p class="body-text">If this is a life-threatening emergency, please contact Amayalert immediately and follow instructions from your local emergency authorities.</p>`,
      `[${levelLabel}] ${alert.title}`,
    );

    const text = `[${levelLabel} ALERT] ${alert.title}\n\n${alert.content}\n\n${alertUrl ? `View: ${alertUrl}\n\n` : ''}Please contact Amayalert immediately and follow instructions from local emergency authorities.`;

    return this.sendBulkEmails(
      recipients,
      `[${levelLabel}] Emergency Alert — ${alert.title}`,
      text,
      html,
    );
  }

  /** New evacuation center notification */
  async sendEvacuationEmail(
    recipients: string[],
    center: {
      name: string;
      address: string;
      status: string;
      capacity?: number | null;
      current_occupancy?: number | null;
    },
    appUrl = '',
  ): Promise<EmailResponse> {
    const occ = center.current_occupancy ?? 0;
    const cap = center.capacity;
    const occupancyStr = cap ? `${occ} / ${cap} (${Math.round((occ / cap) * 100)}% full)` : '—';
    const statusColor = STATUS_COLOR[center.status] ?? '#6b7280';

    const html = layout(
      `<p class="title">New Evacuation Center Available</p>
      <p class="subtitle">A new evacuation center has been designated in your area. Please review the details below and follow guidance from local authorities.</p>

      <table class="kv-table">
        ${kvRow('Center Name', center.name ?? '—')}
        ${kvRow('Address', center.address ?? '—')}
        ${kvRow('Status', badge(center.status ?? 'open', statusColor))}
        ${cap ? kvRow('Occupancy', occupancyStr) : ''}
        ${appUrl ? kvRow('View Details', `<a href="${appUrl}">${appUrl}</a>`) : ''}
      </table>

      <hr class="divider"/>
      <p class="body-text">Proceed to evacuation centers only when directed by local emergency authorities. Thank you for being part of Amayalert.</p>`,
      `New Evacuation Center: ${center.name}`,
    );

    const text = `New Evacuation Center: ${center.name}\nAddress: ${center.address}\nStatus: ${center.status}${cap ? `\nOccupancy: ${occupancyStr}` : ''}`;

    return this.sendBulkEmails(recipients, `New Evacuation Center — ${center.name}`, text, html);
  }

  /** Welcome email with login credentials */
  async sendWelcomeEmail(
    to: string,
    data: {
      full_name: string;
      email: string;
      password: string;
      role: string;
      modules?: string[];
      signInUrl?: string;
    },
  ): Promise<EmailResponse> {
    const isAdmin = data.role === 'sub_admin' || data.role === 'admin';
    const signInUrl = data.signInUrl || process.env.NEXT_PUBLIC_BASE_URL || '';
    const moduleList = data.modules?.length ? data.modules.join(', ') : null;

    const html = layout(
      `<p class="title">Your Amayalert Account Has Been Created</p>
      <p class="subtitle">${isAdmin ? 'An administrator has set up an admin account for you on the Amayalert platform.' : 'An account has been created for you on the Amayalert platform.'} Below are your login credentials.</p>

      <table class="kv-table">
        ${kvRow('Name', data.full_name)}
        ${kvRow('Email', data.email)}
        ${kvRow('Password', `<code style="background:#f4f4f4;border:1px solid #e0e0e0;padding:3px 8px;font-size:13px;color:#dc2626;font-weight:700;">${data.password}</code>`)}
        ${isAdmin ? kvRow('Role', badge(data.role.replace('_', ' '), '#1e3a6e')) : ''}
        ${moduleList ? kvRow('Module Access', moduleList) : ''}
        ${signInUrl ? kvRow('Sign In', `<a href="${signInUrl}">${signInUrl}</a>`) : ''}
      </table>

      <hr class="divider"/>
      <p class="body-text"><strong>Security Notice:</strong> Please change your password immediately after your first login for security purposes.</p>
      <p class="body-text">If you have any questions or need assistance, please contact our support team.</p>
      ${signInUrl ? `<a class="btn" href="${signInUrl}">Sign In Now</a>` : ''}`,
      `Your Amayalert account is ready`,
    );

    const text = `Your Amayalert Account\n\nHello ${data.full_name},\n\nEmail: ${data.email}\nPassword: ${data.password}\n${isAdmin ? `Role: ${data.role}\n` : ''}${moduleList ? `Modules: ${moduleList}\n` : ''}\nPlease change your password after first login.\n\n${signInUrl ? `Sign in: ${signInUrl}` : ''}`;

    return this.sendEmail({
      to,
      subject: `Your Amayalert Account — Login Credentials`,
      text,
      html,
    });
  }

  /** Rescue operation status update */
  async sendRescueUpdateEmail(
    to: string,
    rescue: {
      id: string | number;
      title: string;
      status: string;
      priority?: string | number | null;
      emergency_type?: string | null;
      female_count?: number | null;
      male_count?: number | null;
      scheduled_for?: string | null;
      contact_phone?: string | null;
      email?: string | null;
      description?: string | null;
      lat?: number | null;
      lng?: number | null;
      important_information?: string | null;
    },
    options?: { message?: string; appUrl?: string },
  ): Promise<EmailResponse> {
    const appUrl = options?.appUrl || process.env.NEXT_PUBLIC_BASE_URL || '';
    const totalAffected = (rescue.female_count ?? 0) + (rescue.male_count ?? 0);
    const locationStr =
      rescue.lat && rescue.lng ? `${rescue.lat}, ${rescue.lng}` : (rescue.description ?? '—');
    const statusColor = STATUS_COLOR[rescue.status] ?? '#6b7280';
    const notes = rescue.important_information || options?.message;

    const html = layout(
      `<p class="title">Rescue Record Updated</p>
      <p class="subtitle">The following rescue record has been updated. Please review the latest information below.</p>

      <table class="kv-table">
        ${kvRow('Rescue ID', `#${rescue.id}`)}
        ${kvRow('Title', rescue.title ?? '—')}
        ${kvRow('Status', badge(rescue.status.replace(/_/g, ' '), statusColor))}
        ${rescue.emergency_type ? kvRow('Emergency Type', rescue.emergency_type) : ''}
        ${rescue.priority != null ? kvRow('Priority', String(rescue.priority)) : ''}
        ${totalAffected > 0 ? kvRow('People Affected', `${totalAffected} (${rescue.female_count ?? 0} Female, ${rescue.male_count ?? 0} Male)`) : ''}
        ${rescue.scheduled_for ? kvRow('Scheduled For', new Date(rescue.scheduled_for).toLocaleString('en-PH')) : ''}
        ${kvRow('Location', locationStr)}
        ${rescue.contact_phone ? kvRow('Contact Phone', rescue.contact_phone) : ''}
        ${appUrl ? kvRow('View in App', `<a href="${appUrl}/rescue/${rescue.id}">${appUrl}/rescue/${rescue.id}</a>`) : ''}
      </table>

      ${notes ? `<hr class="divider"/><p class="body-text"><strong>Notes:</strong> ${notes.replace(/\n/g, '<br/>')}</p>` : ''}
      <hr class="divider"/>
      <p class="body-text">We respect your privacy and your time. You are receiving this because you are involved in or subscribed to rescue notifications.</p>`,
      `Rescue update: ${rescue.title}`,
    );

    const text = `Rescue Update — ${rescue.title}\nID: #${rescue.id}\nStatus: ${rescue.status}\n${rescue.emergency_type ? `Type: ${rescue.emergency_type}\n` : ''}Location: ${locationStr}\n${notes ? `\nNotes: ${notes}` : ''}`;

    return this.sendEmail({
      to,
      subject: `Rescue Update — ${rescue.title} [${rescue.status.replace(/_/g, ' ')}]`,
      text,
      html,
      from: FROM,
    });
  }

  /** Contact form submission to admin inbox */
  async sendContactFormEmail(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    inquiryType: string;
  }): Promise<EmailResponse> {
    const html = layout(
      `<p class="title">New Contact Form Submission</p>
      <p class="subtitle">A new message has been submitted through the Amayalert contact form.</p>

      <table class="kv-table">
        ${kvRow('Name', formData.name)}
        ${kvRow('Email', `<a href="mailto:${formData.email}">${formData.email}</a>`)}
        ${kvRow('Inquiry Type', formData.inquiryType)}
        ${kvRow('Subject', formData.subject)}
        ${kvRow('Message', formData.message.replace(/\n/g, '<br/>'))}
      </table>

      <hr class="divider"/>
      <p class="body-text">Reply to this email to respond directly to ${formData.name}.</p>`,
    );

    const text = `Contact Form — ${formData.subject}\n\nFrom: ${formData.name} <${formData.email}>\nType: ${formData.inquiryType}\n\n${formData.message}`;

    return this.sendEmail({
      to: SENDER_EMAIL,
      subject: `[Contact] ${formData.subject}`,
      text,
      html,
      replyTo: formData.email,
    });
  }

  /** Legacy alias used by /api/email/emergency */
  async sendEmergencyAlert(
    recipients: string[],
    alertData: { title: string; content: string; alertLevel: string; location?: string },
  ): Promise<EmailResponse> {
    return this.sendAlertEmail(recipients, {
      title: alertData.title,
      content: alertData.content,
      alert_level: alertData.alertLevel,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
