// Email API Integration Test
// Run this in the browser console or create a test page

const API_BASE = window.location.origin;

// Test functions
const testEmailAPI = {
  // 1. Test SMTP connection
  async testConnection() {
    console.log('🔧 Testing SMTP connection...');
    try {
      const response = await fetch(`${API_BASE}/api/email`);
      const result = await response.json();
      console.log('✅ SMTP Connection Test:', result);
      return result;
    } catch (error) {
      console.error('❌ SMTP Connection Test Failed:', error);
      return { error };
    }
  },

  // 2. Test email sending
  async testEmailSending() {
    console.log('📧 Testing email sending...');
    try {
      const response = await fetch(`${API_BASE}/api/email/test`);
      const result = await response.json();
      console.log('✅ Email Test:', result);
      return result;
    } catch (error) {
      console.error('❌ Email Test Failed:', error);
      return { error };
    }
  },

  // 3. Test contact form
  async testContactForm() {
    console.log('📝 Testing contact form...');
    const testData = {
      type: 'contact-form',
      name: 'Test User',
      email: 'test@example.com',
      subject: 'API Test Message',
      message: 'This is a test message from the email API integration test.',
      inquiryType: 'technical',
    };

    try {
      const response = await fetch(`${API_BASE}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      const result = await response.json();
      console.log('✅ Contact Form Test:', result);
      return result;
    } catch (error) {
      console.error('❌ Contact Form Test Failed:', error);
      return { error };
    }
  },

  // 4. Test single email
  async testSingleEmail() {
    console.log('📬 Testing single email...');
    const testData = {
      type: 'single-email',
      to: process.env.SMTP_USER || 'your-email@example.com', // Replace with your email
      subject: 'Single Email Test',
      text: 'This is a test of the single email functionality.',
      html: '<h2>Single Email Test</h2><p>This is a test of the single email functionality with <strong>HTML formatting</strong>.</p>',
    };

    try {
      const response = await fetch(`${API_BASE}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      const result = await response.json();
      console.log('✅ Single Email Test:', result);
      return result;
    } catch (error) {
      console.error('❌ Single Email Test Failed:', error);
      return { error };
    }
  },

  // 5. Test emergency alert format (without sending to users)
  async testEmergencyAlertFormat() {
    console.log('🚨 Testing emergency alert format...');
    const testData = {
      type: 'emergency-alert',
      recipients: ['test@example.com'], // Safe test recipient
      title: 'Test Emergency Alert',
      content:
        'This is a test emergency alert to verify the email formatting and delivery system. This is not a real emergency.',
      alertLevel: 'low',
      location: '123 Test Street, Test City, TC 12345',
    };

    try {
      const response = await fetch(`${API_BASE}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      const result = await response.json();
      console.log('✅ Emergency Alert Format Test:', result);
      return result;
    } catch (error) {
      console.error('❌ Emergency Alert Format Test Failed:', error);
      return { error };
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Email API Integration Tests...\n');

    const results = {
      connection: await this.testConnection(),
      emailSending: await this.testEmailSending(),
      contactForm: await this.testContactForm(),
      singleEmail: await this.testSingleEmail(),
      emergencyFormat: await this.testEmergencyAlertFormat(),
    };

    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    Object.entries(results).forEach(([test, result]) => {
      const status = result.success !== false && !result.error ? '✅' : '❌';
      console.log(
        `${status} ${test}: ${result.success !== false && !result.error ? 'PASSED' : 'FAILED'}`,
      );
    });

    console.log('\n📋 Detailed Results:');
    console.log(results);

    return results;
  },
};

// Instructions for use
console.log(`
📧 Email API Test Suite Loaded!

Usage:
------
// Test individual functions:
await testEmailAPI.testConnection();
await testEmailAPI.testEmailSending();
await testEmailAPI.testContactForm();
await testEmailAPI.testSingleEmail();
await testEmailAPI.testEmergencyAlertFormat();

// Run all tests:
await testEmailAPI.runAllTests();

Note: Make sure your .env file has the correct SMTP configuration before running tests.
`);

// Export for module use
if (typeof module !== 'undefined') {
  module.exports = testEmailAPI;
}
