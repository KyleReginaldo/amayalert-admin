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

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create SMTP transporter using environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'amayalert.site@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'vnti jotp ccow kewi',
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    console.log('📧 Email Service Configuration:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      user: smtpConfig.auth.user,
      hasPassword: !!smtpConfig.auth.pass,
      passwordLength: smtpConfig.auth.pass?.length || 0,
    });

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const mailOptions = {
        from: options.from || `"Amayalert Support" <amayalert.site@gmail.com>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send bulk emails (multiple recipients)
   */
  async sendBulkEmails(
    recipients: string[],
    subject: string,
    text?: string,
    html?: string,
  ): Promise<EmailResponse> {
    try {
      const mailOptions = {
        from: `"Amayalert Support" <amayalert.site@gmail.com>`,
        bcc: recipients, // Use BCC to hide recipients from each other
        subject: subject,
        text: text,
        html: html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        message: `Bulk email sent to ${recipients.length} recipients`,
      };
    } catch (error) {
      console.error('Bulk email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send bulk emails',
      };
    }
  }

  /**
   * Send contact form email
   */
  async sendContactFormEmail(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    inquiryType: string;
  }): Promise<EmailResponse> {
    console.log('📧 Attempting to send contact form email:', {
      from: formData.name,
      email: formData.email,
      subject: formData.subject,
      inquiryType: formData.inquiryType,
    });
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px;">
          <h2 style="margin: 0;">New Contact Form Submission</h2>
          <p style="margin: 5px 0 0 0;">Amayalert Contact Form</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Name:</td>
              <td style="padding: 8px 0; color: #666;">${formData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 8px 0; color: #666;">${formData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Type:</td>
              <td style="padding: 8px 0; color: #666;">${formData.inquiryType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Subject:</td>
              <td style="padding: 8px 0; color: #666;">${formData.subject}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px;">
            <h4 style="color: #333; margin-bottom: 10px;">Message:</h4>
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2563eb;">
              ${formData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Reply directly to this email to respond to ${formData.name}</p>
        </div>
      </div>
    `;

    const textContent = `
New Contact Form Submission - Amayalert

Name: ${formData.name}
Email: ${formData.email}
Inquiry Type: ${formData.inquiryType}
Subject: ${formData.subject}

Message:
${formData.message}

---
This email was sent from the Amayalert contact form.
Reply directly to this email to respond to ${formData.name}.
    `;

    return this.sendEmail({
      to: 'amayalert.site@gmail.com', // Send to a different email address
      subject: `[Amayalert] ${formData.subject}`,
      text: textContent,
      html: htmlContent,
      replyTo: formData.email, // Set reply-to as the sender's email
    });
  }

  /**
   * Send emergency alert email
   */
  async sendEmergencyAlert(
    recipients: string[],
    alertData: {
      title: string;
      content: string;
      alertLevel: string;
      location?: string;
    },
  ): Promise<EmailResponse> {
    const priorityColors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545',
    };

    const color = priorityColors[alertData.alertLevel as keyof typeof priorityColors] || '#007bff';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Amayalert Emergency Notification</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; border-top: none;">
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid ${color}; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">${alertData.title}</h2>
            <span style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              ${alertData.alertLevel} PRIORITY
            </span>
          </div>
          
          <div style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            ${alertData.content.replace(/\n/g, '<br>')}
          </div>
          
          ${
            alertData.location
              ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <strong>📍 Location:</strong> ${alertData.location}
            </div>
          `
              : ''
          }
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; border: 1px solid #ffeaa7;">
            <strong>⚠️ Important:</strong> If this is a life-threatening emergency, call 911 immediately.
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
          <p>This alert was sent by Amayalert Emergency System</p>
          <p>Stay safe and follow official emergency instructions</p>
        </div>
      </div>
    `;

    const textContent = `
🚨 EMERGENCY ALERT - Amayalert

Title: ${alertData.title}
Priority: ${alertData.alertLevel.toUpperCase()}
${alertData.location ? `Location: ${alertData.location}` : ''}

Message:
${alertData.content}

⚠️ Important: If this is a life-threatening emergency, call 911 immediately.

---
This alert was sent by Amayalert Emergency System.
Stay safe and follow official emergency instructions.
    `;

    return this.sendBulkEmails(
      recipients,
      `🚨 [${alertData.alertLevel.toUpperCase()}] ${alertData.title}`,
      textContent,
      htmlContent,
    );
  }

  /**
   * Verify SMTP connection
   */
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

// Export singleton instance
export const emailService = new EmailService();

// Export default
export default emailService;
