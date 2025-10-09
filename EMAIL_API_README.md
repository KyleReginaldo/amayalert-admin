# Email API Documentation

## Overview

The AmayAlert Email API provides comprehensive email functionality for contact forms, emergency alerts, and general notifications using SMTP integration.

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## API Endpoints

### 1. Send Emails - POST `/api/email`

General email sending endpoint that supports multiple types of emails.

#### Request Body

```json
{
  "type": "contact-form" | "single-email" | "bulk-email" | "emergency-alert",
  // Additional fields based on type (see below)
}
```

#### Contact Form Email

```json
{
  "type": "contact-form",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "General Inquiry",
  "message": "Hello, I have a question about...",
  "inquiryType": "general" | "technical" | "partnership" | "feedback" | "emergency" | "privacy"
}
```

#### Single Email

```json
{
  "type": "single-email",
  "to": "recipient@example.com" | ["recipient1@example.com", "recipient2@example.com"],
  "subject": "Email Subject",
  "text": "Plain text content", // Optional if html is provided
  "html": "<h1>HTML content</h1>", // Optional if text is provided
  "from": "sender@example.com", // Optional
  "replyTo": "reply@example.com" // Optional
}
```

#### Bulk Email

```json
{
  "type": "bulk-email",
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Newsletter Subject",
  "text": "Plain text content", // Optional if html is provided
  "html": "<h1>HTML content</h1>" // Optional if text is provided
}
```

#### Emergency Alert

```json
{
  "type": "emergency-alert",
  "recipients": ["user1@example.com", "user2@example.com"],
  "title": "Emergency Alert Title",
  "content": "Alert message content",
  "alertLevel": "low" | "medium" | "high" | "critical",
  "location": "123 Main St, City, State" // Optional
}
```

#### Response

```json
{
  "success": true,
  "messageId": "message-id-from-smtp",
  "message": "Email sent successfully"
}
```

### 2. Verify SMTP Connection - GET `/api/email`

Verifies that the SMTP configuration is working correctly.

#### Response

```json
{
  "success": true,
  "message": "SMTP connection verified successfully"
}
```

### 3. Email Test - GET `/api/email/test`

Sends a test email to verify the email service is working correctly.

#### Response

```json
{
  "smtpConnection": true,
  "emailTest": {
    "success": true,
    "messageId": "test-message-id",
    "message": "Email sent successfully"
  },
  "message": "Email test completed"
}
```

### 4. Emergency Alert Email - POST `/api/email/emergency`

Sends emergency alerts to users via email, with database integration.

#### Request Body

```json
{
  "title": "Emergency Alert Title",
  "content": "Detailed alert message",
  "alertLevel": "low" | "medium" | "high" | "critical",
  "location": "Location details", // Optional
  "alertId": "alert-database-id", // Optional
  "userIds": ["user-id-1", "user-id-2"] // Optional - if not provided, sends to all users
}
```

#### Response

```json
{
  "success": true,
  "message": "Emergency alert sent to 150 recipients",
  "recipientsCount": 150,
  "messageId": "emergency-message-id"
}
```

## Email Templates

### Contact Form Email

- **Subject**: `[AmayAlert] {subject}`
- **Features**: Professional formatting, inquiry type categorization, auto-reply setup
- **Reply-To**: Set to the contact form sender's email

### Emergency Alert Email

- **Subject**: `🚨 [{ALERT_LEVEL}] {title}`
- **Features**: Priority color coding, location display, emergency instructions
- **Styling**: Responsive design with alert-specific colors and icons

### Bulk/Newsletter Email

- **Features**: BCC delivery for privacy, custom formatting support
- **Performance**: Optimized for large recipient lists

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `500` - Internal Server Error

Error responses include descriptive messages:

```json
{
  "error": "Invalid email format"
}
```

## Security Features

1. **Input Validation**: All email addresses and content are validated
2. **SMTP Authentication**: Secure SMTP with TLS encryption
3. **Rate Limiting**: Built-in protection against spam (implement as needed)
4. **Environment Variables**: Sensitive credentials stored securely

## Usage Examples

### Frontend Contact Form Integration

```javascript
const submitContactForm = async (formData) => {
  const response = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'contact-form',
      ...formData,
    }),
  });

  const result = await response.json();
  return result;
};
```

### Emergency Alert Integration

```javascript
const sendEmergencyAlert = async (alertData) => {
  const response = await fetch('/api/email/emergency', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertData),
  });

  const result = await response.json();
  return result;
};
```

## Testing

1. **Test SMTP Connection**: `GET /api/email`
2. **Send Test Email**: `GET /api/email/test`
3. **Contact Form Test**: Use the contact form on `/contact-us` page
4. **Emergency Alert Test**: Use the emergency alert endpoints with test data

## Gmail Configuration

For Gmail SMTP:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Google Account > Security > App passwords
   - Generate password for "Mail"
3. Use the generated password in `SMTP_PASSWORD` environment variable

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**

   - Check Gmail app password
   - Verify 2FA is enabled
   - Ensure environment variables are correct

2. **Connection Timeout**

   - Check firewall settings
   - Verify SMTP port (587 for TLS)

3. **Email Not Received**
   - Check spam folder
   - Verify recipient email addresses
   - Check SMTP logs in server console

### Debug Mode

Add console logging in development:

```javascript
// In email-service.ts, add:
console.log('SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
});
```

## Performance Considerations

- **Bulk Emails**: Use BCC for privacy and performance
- **Large Lists**: Consider batching for very large recipient lists (>1000)
- **Attachments**: Not currently supported, implement if needed
- **Queue System**: Consider implementing email queues for high volume
