/**
 * SMS Service Utility
 *
 * This utility provides a clean interface for sending SMS messages
 * throughout the application using Twilio.
 */

export interface SMSOptions {
  to?: string;
  recipients?: string[];
  message: string;
  useTest?: boolean;
  useMessagingService?: boolean;
}

export interface SMSResponse {
  success: boolean;
  data?: {
    sid: string;
    status: string;
    to: string;
    from: string;
    body: string;
    dateCreated: string;
    messagingServiceSid?: string;
  };
  error?: string;
  details?: string;
}

export interface BulkSMSOptions {
  recipients: string[];
  message: string;
  useTest?: boolean;
  useMessagingService?: boolean;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface BulkSMSResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Array<{
    to: string;
    success: boolean;
    sid?: string;
    error?: string;
  }>;
}

class SMSService {
  private baseUrl: string;

  constructor() {
    const relative = '/api/sms';

    if (typeof window === 'undefined') {
      const origin = process.env.BASE_URL || 'http://localhost:3000';
      this.baseUrl = origin.replace(/\/$/, '') + relative;
    } else {
      this.baseUrl = relative;
    }
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(options: SMSOptions): Promise<SMSResponse> {
    try {
      const recipients = Array.isArray(options.recipients)
        ? options.recipients
        : options.to
        ? [options.to]
        : [];

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          message: options.message,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SMS Service Error:', error);
      return {
        success: false,
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(options: BulkSMSOptions): Promise<BulkSMSResponse> {
    const { recipients, message, batchSize = 10, delayBetweenBatches = 1000 } = options;

    const results: BulkSMSResponse['results'] = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process recipients in batches to avoid rate limiting
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      // Send all messages in the current batch
      const batchPromises = batch.map(async (to) => {
        const result = await this.sendSMS({ recipients: [to], message });

        const resultItem = {
          to,
          success: result.success,
          sid: result.data?.sid,
          error: result.error,
        };

        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
        }

        return resultItem;
      });

      // Wait for all messages in the batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches (except for the last batch)
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return {
      success: totalFailed === 0, // Success if no failures
      totalSent,
      totalFailed,
      results,
    };
  }

  /**
   * Check SMS service status
   */
  async checkStatus(): Promise<SMSResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SMS Status Check Error:', error);
      return {
        success: false,
        error: 'Failed to check SMS service status',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send emergency alert SMS
   */
  async sendEmergencyAlert(options: {
    recipients: string[];
    alertTitle: string;
    alertMessage: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    useTest?: boolean;
  }): Promise<BulkSMSResponse> {
    const { recipients, alertTitle, alertMessage, priority, useTest = false } = options;

    // Format emergency message with priority indicator
    const priorityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    const formattedMessage = `${priorityEmoji[priority]} EMERGENCY ALERT\n\n${alertTitle}\n\n${alertMessage}\n\nThis is an official emergency notification. Please follow local emergency procedures.`;

    return this.sendBulkSMS({
      recipients,
      message: formattedMessage,
      useTest,
      useMessagingService: true,
      batchSize: priority === 'critical' ? 20 : 10, // Larger batches for critical alerts
      delayBetweenBatches: priority === 'critical' ? 500 : 1000, // Faster for critical alerts
    });
  }

  /**
   * Send evacuation center notification
   */
  async sendEvacuationNotification(options: {
    recipients: string[];
    centerName: string;
    centerAddress: string;
    status: 'open' | 'full' | 'closed' | 'maintenance';
    capacity?: number;
    currentOccupancy?: number;
    useTest?: boolean;
  }): Promise<BulkSMSResponse> {
    const {
      recipients,
      centerName,
      centerAddress,
      status,
      capacity,
      currentOccupancy,
      useTest = false,
    } = options;

    let statusMessage = '';
    switch (status) {
      case 'open':
        statusMessage = '✅ OPEN - Accepting evacuees';
        break;
      case 'full':
        statusMessage = '🔴 FULL - No capacity available';
        break;
      case 'closed':
        statusMessage = '❌ CLOSED';
        break;
      case 'maintenance':
        statusMessage = '🔧 MAINTENANCE - Temporarily unavailable';
        break;
    }

    let capacityInfo = '';
    if (capacity && currentOccupancy !== undefined) {
      const percentage = Math.round((currentOccupancy / capacity) * 100);
      capacityInfo = `\nCapacity: ${currentOccupancy}/${capacity} (${percentage}%)`;
    }

    const message = `🏢 EVACUATION CENTER UPDATE\n\n${centerName}\n${statusMessage}${capacityInfo}\n\nLocation: ${centerAddress}\n\nFor real-time updates, contact local emergency services.`;

    return this.sendBulkSMS({
      recipients,
      message,
      useTest,
      useMessagingService: true,
    });
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(number: string): {
    valid: boolean;
    formatted?: string;
    error?: string;
  } {
    if (!number) return { valid: false, error: 'Empty number' };

    const digitsOnly = number.replace(/\s|-/g, '');
    const withPlus = digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;

    const e164 = /^\+[1-9]\d{7,14}$/; // 8-15 digits total (min realistic length)
    if (!e164.test(withPlus)) {
      return {
        valid: false,
        error: 'Invalid phone number. Use international format, e.g. +15551234567',
      };
    }

    return { valid: true, formatted: withPlus };
  }

  /**
   * Format message with character limit awareness
   */
  formatMessage(
    message: string,
    maxLength: number = 160,
  ): {
    message: string;
    segments: number;
  } {
    if (message.length <= maxLength) {
      return { message, segments: 1 };
    }

    const segments = Math.ceil(message.length / maxLength);
    return { message, segments };
  }
}

// Export singleton instance
export const smsService = new SMSService();
export default smsService;
