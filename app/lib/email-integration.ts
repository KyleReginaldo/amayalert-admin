/**
 * Email Integration Examples
 *
 * This file demonstrates how to integrate email functionality
 * with the existing alert and evacuation center systems.
 */

import emailService from './email-service';

// Example: Send email when a new alert is created
export async function sendAlertNotification(
  alert: {
    id: number;
    title: string;
    content: string;
    alert_level: 'low' | 'medium' | 'high' | 'critical';
  },
  recipients: string[],
) {
  try {
    const result = await emailService.sendEmergencyAlert(recipients, {
      title: alert.title || 'Emergency Alert',
      content: alert.content || 'Please check local emergency services for more information.',
      alertLevel: alert.alert_level,
      location: undefined, // Can be enhanced to include location if available
    });

    console.log(`Alert email sent to ${recipients.length} recipients:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send alert email:', error);
    throw error;
  }
}

// Example: Send email when evacuation center status changes
export async function sendEvacuationCenterUpdate(
  center: {
    id: number;
    name: string;
    address: string;
    status: 'open' | 'full' | 'closed' | 'maintenance';
    capacity?: number;
    current_occupancy?: number;
  },
  recipients: string[],
) {
  try {
    const statusMessages = {
      open: 'The evacuation center is now open and accepting evacuees.',
      full: 'The evacuation center has reached capacity and is no longer accepting new evacuees.',
      closed: 'The evacuation center is now closed.',
      maintenance: 'The evacuation center is temporarily closed for maintenance.',
    };

    const subject = `Evacuation Center Update: ${center.name}`;
    const message = `
${statusMessages[center.status]}

Center Details:
- Name: ${center.name}
- Address: ${center.address}
- Status: ${center.status.toUpperCase()}
${center.capacity ? `- Capacity: ${center.current_occupancy || 0}/${center.capacity}` : ''}

Please follow official emergency instructions and contact emergency services if you need immediate assistance.
    `;

    const result = await emailService.sendBulkEmails(recipients, subject, message.trim());

    console.log(`Evacuation center update email sent to ${recipients.length} recipients:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send evacuation center update email:', error);
    throw error;
  }
}

// Example: Send bulk email notifications to all registered users
export async function sendBulkEmergencyNotification(
  message: string,
  recipients: string[],
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
) {
  try {
    const prioritySubjects = {
      low: 'Advisory Notice',
      medium: 'Important Notice',
      high: 'Urgent Alert',
      critical: '🚨 EMERGENCY ALERT',
    };

    const result = await emailService.sendBulkEmails(
      recipients,
      `[AmayAlert] ${prioritySubjects[priority]}`,
      message,
    );

    console.log(`Bulk emergency notification sent to ${recipients.length} recipients:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send bulk emergency notification:', error);
    throw error;
  }
}

// Example: Validate and format email addresses from user input
export function validateAndFormatEmails(emails: string[]): {
  valid: string[];
  invalid: Array<{ email: string; error: string }>;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: Array<{ email: string; error: string }> = [];

  emails.forEach((email) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      invalid.push({ email, error: 'Empty email address' });
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      invalid.push({ email, error: 'Invalid email format' });
      return;
    }

    valid.push(trimmedEmail);
  });

  return { valid, invalid };
}

// Example: Send welcome email after user subscribes to alerts
export async function sendSubscriptionConfirmation(email: string, userName?: string) {
  try {
    const subject = 'Welcome to AmayAlert Emergency Notifications';

    const textMessage = `Welcome to AmayAlert Emergency Notification System${
      userName ? `, ${userName}` : ''
    }!

You will now receive emergency alerts and evacuation updates for your area via email.

What you can expect:
• Emergency alerts and warnings
• Evacuation center updates
• Important safety information
• Weather and disaster notifications

To manage your subscription or update your preferences, please contact our support team.

Stay safe!

The AmayAlert Team
Email: support@amayalert.com
`;

    const htmlMessage = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .alert-icon { font-size: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🛡️</div>
            <h1>Welcome to AmayAlert</h1>
            <p>Emergency Notification System</p>
        </div>
        <div class="content">
            <h2>Hello${userName ? `, ${userName}` : ''}!</h2>
            <p>Thank you for subscribing to AmayAlert. You will now receive important emergency notifications via email.</p>
            
            <h3>What you can expect:</h3>
            <ul>
                <li>🚨 Emergency alerts and warnings</li>
                <li>🏠 Evacuation center updates</li>
                <li>📋 Important safety information</li>
                <li>🌪️ Weather and disaster notifications</li>
            </ul>
            
            <p>To manage your subscription or update your preferences, please contact our support team.</p>
            
            <p><strong>Stay safe!</strong></p>
        </div>
        <div class="footer">
            <p>The AmayAlert Team<br>
            Email: support@amayalert.com</p>
        </div>
    </div>
</body>
</html>
    `;

    const result = await emailService.sendEmail({
      to: email,
      subject: subject,
      text: textMessage,
      html: htmlMessage,
    });

    console.log(`Subscription confirmation sent to ${email}:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send subscription confirmation:', error);
    throw error;
  }
}

// Example: Integration with your existing alert creation API
export async function enhancedCreateAlert(
  alertData: {
    title: string;
    content: string;
    alert_level: 'low' | 'medium' | 'high' | 'critical';
  },
  options: {
    sendEmail: boolean;
    emailRecipients?: string[];
  },
) {
  try {
    // First create the alert in your database (use your existing alert API)
    // const newAlert = await alertsAPI.createAlert(alertData);

    // Simulate alert creation for this example
    const newAlert = {
      id: Date.now(),
      ...alertData,
      created_at: new Date().toISOString(),
    };

    // Send email notifications if requested
    if (options.sendEmail && options.emailRecipients && options.emailRecipients.length > 0) {
      await sendAlertNotification(newAlert, options.emailRecipients);
    }

    return {
      success: true,
      data: newAlert,
      message:
        'Alert created successfully' + (options.sendEmail ? ' and email notifications sent' : ''),
    };
  } catch (error) {
    console.error('Failed to create enhanced alert:', error);
    throw error;
  }
}

// Example: Integration with your existing evacuation center update API
export async function enhancedUpdateEvacuationCenter(
  centerId: number,
  updateData: {
    name?: string;
    address?: string;
    status?: 'open' | 'full' | 'closed' | 'maintenance';
    capacity?: number;
    current_occupancy?: number;
  },
  options: {
    sendEmail: boolean;
    emailRecipients?: string[];
  },
) {
  try {
    // First update the evacuation center in your database
    // const updatedCenter = await evacuationAPI.updateCenter(centerId, updateData);

    // Simulate center update for this example
    const updatedCenter = {
      id: centerId,
      name: 'Main Evacuation Center',
      address: '123 Safe St',
      status: 'open' as const,
      capacity: 100,
      current_occupancy: 45,
      ...updateData,
    };

    // Send email notifications if requested and status changed
    if (
      options.sendEmail &&
      options.emailRecipients &&
      options.emailRecipients.length > 0 &&
      updateData.status
    ) {
      await sendEvacuationCenterUpdate(updatedCenter, options.emailRecipients);
    }

    return {
      success: true,
      data: updatedCenter,
      message:
        'Evacuation center updated successfully' +
        (options.sendEmail ? ' and email notifications sent' : ''),
    };
  } catch (error) {
    console.error('Failed to update enhanced evacuation center:', error);
    throw error;
  }
}

// Example: Send test email to verify service
export async function sendTestEmail(
  to: string,
  type: 'connection' | 'alert' | 'notification' = 'connection',
) {
  try {
    const testTypes = {
      connection: {
        subject: 'AmayAlert Email Service Test',
        text: 'This is a test email to verify the AmayAlert email service is working correctly.',
      },
      alert: {
        subject: '🚨 [TEST] Emergency Alert Test',
        text: 'This is a test emergency alert. Please disregard this message.',
      },
      notification: {
        subject: '[TEST] Notification Service Test',
        text: 'This is a test notification from the AmayAlert system. Please disregard this message.',
      },
    };

    const result = await emailService.sendEmail({
      to: to,
      subject: testTypes[type].subject,
      text: testTypes[type].text,
    });

    console.log(`Test email (${type}) sent to ${to}:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send test email (${type}):`, error);
    throw error;
  }
}

// Example: Check email service status
export async function checkEmailServiceStatus() {
  try {
    const isConnected = await emailService.verifyConnection();
    return {
      success: isConnected,
      message: isConnected ? 'Email service is operational' : 'Email service is unavailable',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to check email service status:', error);
    return {
      success: false,
      message: 'Failed to check email service status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}
