# SMS API Documentation

## Overview

This SMS API uses Twilio to send SMS messages for the AmayAlert emergency management system. It supports both live and test environments, single and bulk messaging, and specialized emergency alert formatting.

## Setup

### Environment Variables

Add the following variables to your `.env.local` file:

```env
# Twilio (Live)
ACCOUNT_SID="your_live_account_sid"
AUTH_TOKEN="your_live_auth_token"
TWILIO_NUMBER="+1234567890"
MESSAGING_SERVICE="your_messaging_service_sid"

# Twilio (Test)
TEST_ACCOUNT_SID="your_test_account_sid"
TEST_AUTH_TOKEN="your_test_auth_token"
TEST_TWILIO_NUMBER="+1234567890"
```

### Installation

The Twilio SDK is already installed. If you need to reinstall:

```bash
npm install twilio
```

## API Endpoints

### GET /api/sms

Check SMS service status and configuration.

**Response:**

```json
{
  "success": true,
  "data": {
    "configured": true,
    "hasMessagingService": true,
    "twilioNumber": "+1234567890",
    "environment": "development"
  },
  "message": "SMS service is configured and ready"
}
```

### POST /api/sms

Send a single SMS message.

**Request Body:**

```json
{
  "to": "+1234567890",
  "message": "Your message here",
  "useTest": true,
  "useMessagingService": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sid": "SM1234567890abcdef",
    "status": "queued",
    "to": "+1234567890",
    "from": "+0987654321",
    "body": "Your message here",
    "dateCreated": "2025-01-01T00:00:00.000Z"
  },
  "message": "SMS sent successfully"
}
```

## Using the SMS Service

### Import the Service

```typescript
import smsService from '@/app/lib/sms-service';
```

### Send a Single SMS

```typescript
const result = await smsService.sendSMS({
  to: '+1234567890',
  message: 'Hello from AmayAlert!',
  useTest: true, // Use test environment
  useMessagingService: true, // Use messaging service if available
});

if (result.success) {
  console.log('SMS sent successfully:', result.data);
} else {
  console.error('Failed to send SMS:', result.error);
}
```

### Send Bulk SMS

```typescript
const result = await smsService.sendBulkSMS({
  recipients: ['+1234567890', '+0987654321'],
  message: 'Bulk message to all recipients',
  useTest: true,
  batchSize: 10, // Send 10 at a time
  delayBetweenBatches: 1000, // 1 second delay between batches
});

console.log(`Sent: ${result.totalSent}, Failed: ${result.totalFailed}`);
```

### Send Emergency Alert

```typescript
const result = await smsService.sendEmergencyAlert({
  recipients: ['+1234567890', '+0987654321'],
  alertTitle: 'Flood Warning',
  alertMessage: 'Heavy rainfall expected. Move to higher ground immediately.',
  priority: 'critical', // 'low', 'medium', 'high', 'critical'
  useTest: true,
});
```

### Send Evacuation Center Notification

```typescript
const result = await smsService.sendEvacuationNotification({
  recipients: ['+1234567890'],
  centerName: 'Central Evacuation Center',
  centerAddress: '123 Emergency St, Safety City',
  status: 'open', // 'open', 'full', 'closed', 'maintenance'
  capacity: 100,
  currentOccupancy: 25,
  useTest: true,
});
```

### Validate Phone Numbers

```typescript
const validation = smsService.validatePhoneNumber('+1234567890');

if (validation.valid) {
  console.log('Formatted number:', validation.formatted);
} else {
  console.error('Invalid number:', validation.error);
}
```

## Integration Examples

### Alert System Integration

```typescript
import { sendAlertNotification } from '@/app/lib/sms-integration';

// When creating a new alert
const alert = {
  id: 1,
  title: 'Severe Weather Warning',
  content: 'Take shelter immediately',
  alert_level: 'critical' as const,
};

const recipients = ['+1234567890', '+0987654321'];
await sendAlertNotification(alert, recipients);
```

### Evacuation Center Integration

```typescript
import { sendEvacuationCenterUpdate } from '@/app/lib/sms-integration';

// When updating evacuation center status
const center = {
  id: 1,
  name: 'Main Evacuation Center',
  address: '123 Safe St',
  status: 'full' as const,
  capacity: 100,
  current_occupancy: 100,
};

const recipients = ['+1234567890'];
await sendEvacuationCenterUpdate(center, recipients);
```

## Testing

A test page is available at `/sms-test` when running in development mode. This page allows you to:

- Check SMS service status
- Send test messages
- Send emergency alerts
- Test different environments (live vs test)

## Error Handling

The API handles common Twilio errors:

- **21211**: Invalid phone number
- **21408**: Permission denied or invalid credentials
- **21610**: Message cannot be sent to this number

Errors are returned in a consistent format:

```json
{
  "success": false,
  "error": "User-friendly error message",
  "details": "Detailed error (development only)"
}
```

## Rate Limiting

The bulk SMS service includes built-in rate limiting:

- Default batch size: 10 messages
- Default delay between batches: 1 second
- Configurable for different priority levels

## Security

- API keys are stored in environment variables
- Test environment is used by default in development
- Error details are hidden in production
- Phone number validation prevents invalid requests

## Production Considerations

1. **Environment**: Set `useTest: false` for production
2. **Rate Limits**: Respect Twilio's rate limits
3. **Monitoring**: Log SMS results for monitoring
4. **Costs**: Monitor SMS usage and costs
5. **Compliance**: Ensure compliance with SMS regulations
6. **User Consent**: Only send SMS to users who have opted in

## Support

For issues with the SMS service:

1. Check the SMS service status endpoint
2. Verify environment variables are set correctly
3. Check Twilio account status and credits
4. Review error messages for specific issues
