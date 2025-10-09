import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../lib/email-service';

// Types for request bodies
interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryType: string;
}

interface BulkEmailRequest {
  recipients: string[];
  subject: string;
  text?: string;
  html?: string;
}

interface EmergencyAlertRequest {
  recipients: string[];
  title: string;
  content: string;
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
}

interface SingleEmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

// POST /api/email - Send emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    // Validate required fields based on type
    if (!type) {
      return NextResponse.json({ error: 'Email type is required' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'contact-form':
        // Validate contact form data
        const contactData = data as ContactFormRequest;
        if (
          !contactData.name ||
          !contactData.email ||
          !contactData.subject ||
          !contactData.message ||
          !contactData.inquiryType
        ) {
          return NextResponse.json(
            { error: 'Missing required contact form fields' },
            { status: 400 },
          );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactData.email)) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        result = await emailService.sendContactFormEmail(contactData);
        break;

      case 'single-email':
        const singleEmailData = data as SingleEmailRequest;
        if (!singleEmailData.to || !singleEmailData.subject) {
          return NextResponse.json(
            { error: 'Missing required fields: to, subject' },
            { status: 400 },
          );
        }

        if (!singleEmailData.text && !singleEmailData.html) {
          return NextResponse.json(
            { error: 'Either text or html content is required' },
            { status: 400 },
          );
        }

        result = await emailService.sendEmail(singleEmailData);
        break;

      case 'bulk-email':
        const bulkEmailData = data as BulkEmailRequest;
        if (
          !bulkEmailData.recipients ||
          !Array.isArray(bulkEmailData.recipients) ||
          bulkEmailData.recipients.length === 0
        ) {
          return NextResponse.json(
            { error: 'Recipients array is required and must not be empty' },
            { status: 400 },
          );
        }

        if (!bulkEmailData.subject) {
          return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
        }

        if (!bulkEmailData.text && !bulkEmailData.html) {
          return NextResponse.json(
            { error: 'Either text or html content is required' },
            { status: 400 },
          );
        }

        result = await emailService.sendBulkEmails(
          bulkEmailData.recipients,
          bulkEmailData.subject,
          bulkEmailData.text,
          bulkEmailData.html,
        );
        break;

      case 'emergency-alert':
        const alertData = data as EmergencyAlertRequest;
        if (
          !alertData.recipients ||
          !Array.isArray(alertData.recipients) ||
          alertData.recipients.length === 0
        ) {
          return NextResponse.json(
            { error: 'Recipients array is required and must not be empty' },
            { status: 400 },
          );
        }

        if (!alertData.title || !alertData.content || !alertData.alertLevel) {
          return NextResponse.json(
            { error: 'Missing required fields: title, content, alertLevel' },
            { status: 400 },
          );
        }

        const validLevels = ['low', 'medium', 'high', 'critical'];
        if (!validLevels.includes(alertData.alertLevel)) {
          return NextResponse.json(
            { error: 'Invalid alert level. Must be one of: low, medium, high, critical' },
            { status: 400 },
          );
        }

        result = await emailService.sendEmergencyAlert(alertData.recipients, {
          title: alertData.title,
          content: alertData.content,
          alertLevel: alertData.alertLevel,
          location: alertData.location,
        });
        break;

      default:
        return NextResponse.json(
          {
            error: `Invalid email type: ${type}. Supported types: contact-form, single-email, bulk-email, emergency-alert`,
          },
          { status: 400 },
        );
    }

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/email/verify - Verify SMTP connection
export async function GET() {
  try {
    const isConnected = await emailService.verifyConnection();

    if (isConnected) {
      return NextResponse.json(
        { success: true, message: 'SMTP connection verified successfully' },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'SMTP connection failed' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('SMTP verification error:', error);
    return NextResponse.json({ error: 'Failed to verify SMTP connection' }, { status: 500 });
  }
}
