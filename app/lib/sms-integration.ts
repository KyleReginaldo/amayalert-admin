/**
 * SMS Integration Examples
 *
 * This file demonstrates how to integrate SMS functionality
 * with the existing alert and evacuation center systems.
 */

import smsService from './sms-service';

// Example: Send SMS when a new alert is created
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
    const result = await smsService.sendEmergencyAlert({
      recipients,
      alertTitle: alert.title || 'Emergency Alert',
      alertMessage: alert.content || 'Please check local emergency services for more information.',
      priority: alert.alert_level,
      useTest: process.env.NODE_ENV === 'development',
    });

    console.log(`Alert SMS sent to ${recipients.length} recipients:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send alert SMS:', error);
    throw error;
  }
}

// Example: Send SMS when evacuation center status changes
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
    const result = await smsService.sendEvacuationNotification({
      recipients,
      centerName: center.name,
      centerAddress: center.address,
      status: center.status,
      capacity: center.capacity,
      currentOccupancy: center.current_occupancy,
      useTest: process.env.NODE_ENV === 'development',
    });

    console.log(`Evacuation center update sent to ${recipients.length} recipients:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send evacuation center update SMS:', error);
    throw error;
  }
}

// Example: Send bulk notifications to all registered users
export async function sendBulkEmergencyNotification(
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
) {
  try {
    // This would typically fetch phone numbers from your user database
    // For now, using placeholder recipients
    const recipients: string[] = [
      // Add your test phone numbers here
      // '+1234567890',
      // '+0987654321',
    ];

    if (recipients.length === 0) {
      console.warn('No recipients found for bulk notification');
      return { success: false, error: 'No recipients configured' };
    }

    const result = await smsService.sendBulkSMS({
      recipients,
      message: `🚨 EMERGENCY NOTIFICATION\n\n${message}\n\nThis is an official emergency alert. Please follow local emergency procedures.`,
      useTest: process.env.NODE_ENV === 'development',
      batchSize: priority === 'critical' ? 20 : 10,
      delayBetweenBatches: priority === 'critical' ? 500 : 1000,
    });

    console.log(`Bulk emergency notification sent to ${recipients.length} recipients:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send bulk emergency notification:', error);
    throw error;
  }
}

// Example: Validate and format phone numbers from user input
export function validateAndFormatPhoneNumbers(phoneNumbers: string[]): {
  valid: string[];
  invalid: Array<{ number: string; error: string }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ number: string; error: string }> = [];

  phoneNumbers.forEach((number) => {
    const validation = smsService.validatePhoneNumber(number);
    if (validation.valid && validation.formatted) {
      valid.push(validation.formatted);
    } else {
      invalid.push({
        number,
        error: validation.error || 'Invalid format',
      });
    }
  });

  return { valid, invalid };
}

// Example: Send confirmation SMS after user subscribes to alerts
export async function sendSubscriptionConfirmation(phoneNumber: string, userName?: string) {
  try {
    const message = `Welcome to Amayalert Emergency Notification System${
      userName ? `, ${userName}` : ''
    }! 

You will now receive emergency alerts and evacuation updates for your area. 

To unsubscribe, reply STOP.
To get help, reply HELP.

Stay safe!`;

    const result = await smsService.sendSMS({
      to: phoneNumber,
      message,
      useTest: process.env.NODE_ENV === 'development',
    });

    console.log(`Subscription confirmation sent to ${phoneNumber}:`, result);
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
    sendSMS: boolean;
    smsRecipients?: string[];
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

    // Send SMS notifications if requested
    if (options.sendSMS && options.smsRecipients && options.smsRecipients.length > 0) {
      await sendAlertNotification(newAlert, options.smsRecipients);
    }

    return {
      success: true,
      data: newAlert,
      message:
        'Alert created successfully' + (options.sendSMS ? ' and SMS notifications sent' : ''),
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
    sendSMS: boolean;
    smsRecipients?: string[];
  },
) {
  try {
    // First update the evacuation center in your database (use your existing API)
    // const updatedCenter = await evacuationAPI.updateEvacuationCenter(centerId, updateData);

    // Simulate center update for this example
    const updatedCenter = {
      id: centerId,
      name: 'Example Evacuation Center',
      address: '123 Emergency St, Safety City',
      status: 'open' as const,
      capacity: 100,
      current_occupancy: 25,
      ...updateData,
    };

    // Send SMS notifications if requested and status changed
    if (options.sendSMS && options.smsRecipients && options.smsRecipients.length > 0) {
      await sendEvacuationCenterUpdate(updatedCenter, options.smsRecipients);
    }

    return {
      success: true,
      data: updatedCenter,
      message:
        'Evacuation center updated successfully' +
        (options.sendSMS ? ' and SMS notifications sent' : ''),
    };
  } catch (error) {
    console.error('Failed to update enhanced evacuation center:', error);
    throw error;
  }
}
