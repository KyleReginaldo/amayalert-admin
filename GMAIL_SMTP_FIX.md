# Gmail SMTP Authentication Fix

## 🚨 Current Issue

Gmail is rejecting the authentication credentials. This usually means:

1. **App Password is invalid/expired**
2. **2-Factor Authentication is not enabled**
3. **Wrong email/password combination**
4. **Gmail security settings blocking access**

## ✅ Step-by-Step Solution

### Step 1: Verify Gmail Account Settings

1. **Go to your Gmail account**: https://myaccount.google.com/
2. **Check if 2-Factor Authentication is enabled**:
   - Go to Security > 2-Step Verification
   - If not enabled, **ENABLE IT FIRST** (required for App Passwords)

### Step 2: Generate New App Password

1. **Go to App Passwords**: https://myaccount.google.com/apppasswords

   - Or: Google Account > Security > App passwords

2. **Create New App Password**:

   - Select "Mail" as the app
   - Select "Other (custom name)" and enter "AmayAlert"
   - Click "Generate"

3. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)

### Step 3: Update Environment Variables

Update your `.env` file with the new credentials:

```bash
# Replace with the NEW app password (remove spaces)
SMTP_USER=amayalert.site@gmail.com
SMTP_PASSWORD=xxxxxxxxxxxxxxxx
```

**Important**:

- Remove all spaces from the app password
- Use the 16-character app password, NOT your regular Gmail password

### Step 4: Alternative Email Providers (if Gmail continues to fail)

If Gmail keeps causing issues, consider these alternatives:

#### Option A: SendGrid (Recommended for production)

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

#### Option B: Outlook/Hotmail

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_outlook_email@outlook.com
SMTP_PASSWORD=your_outlook_password
```

#### Option C: Yahoo Mail

```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_yahoo_email@yahoo.com
SMTP_PASSWORD=your_yahoo_app_password
```

### Step 5: Test the Connection

After updating credentials, test using:

```bash
# Test SMTP connection
curl http://localhost:3000/api/email

# Send test email
curl http://localhost:3000/api/email/test
```

Or use the browser console:

```javascript
// Test connection
fetch('/api/email')
  .then((r) => r.json())
  .then(console.log);

// Send test email
fetch('/api/email/test')
  .then((r) => r.json())
  .then(console.log);
```

## 🔧 Debugging Steps

If still having issues:

1. **Check environment variables are loaded**:

   ```javascript
   console.log('SMTP_USER:', process.env.SMTP_USER);
   console.log('SMTP_PASSWORD length:', process.env.SMTP_PASSWORD?.length);
   ```

2. **Try manual verification**:

   - Log into Gmail with the same email
   - Check if any security notifications were sent

3. **Common Gmail App Password Issues**:
   - **Spaces in password**: Remove ALL spaces from the 16-char password
   - **Wrong email**: Must match exactly (case-sensitive)
   - **Expired password**: Generate a new one if it's old
   - **2FA not enabled**: Must enable 2-Factor Authentication first

## 🎯 Quick Fix Commands

Run these to test your setup:

```bash
# 1. Check if env vars are loaded
echo "SMTP_USER: $SMTP_USER"
echo "Password length: ${#SMTP_PASSWORD}"

# 2. Restart development server
npm run dev

# 3. Test email endpoint
curl -X POST http://localhost:3000/api/email/simple \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "subject": "Test Email",
    "text": "<h1>Test</h1><p>If you receive this, email is working!</p>"
  }'
```

## 📞 Support Links

- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Gmail SMTP Settings**: https://support.google.com/mail/answer/7126229
- **Google 2-Step Verification**: https://support.google.com/accounts/answer/185839

---

**Most Common Solution**: Generate a new Gmail App Password and update the `.env` file with the new 16-character password (no spaces).
