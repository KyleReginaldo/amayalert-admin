'use client';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Terms of Service</h1>
          <p className="text-sm text-gray-600 mt-1">Last updated: October 9, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded p-6 space-y-8">
          <section id="agreement">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using AmayAlert, you accept and agree to be bound by these terms and
              provisions.
            </p>
            <p className="text-gray-700 text-sm">
              Welcome to AmayAlert (&quot;Service&quot;). These Terms of Service govern your use of
              our emergency alert and rescue coordination platform. If you do not agree to abide by
              these terms, please do not use this service.
            </p>
          </section>

          <section id="service-description">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Service Description</h2>
            <p className="text-gray-700 mb-4">
              AmayAlert is a comprehensive emergency alert and rescue coordination platform that
              provides:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">Alert Services</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Emergency alert notifications via SMS and push notifications</li>
                  <li>Real-time emergency communication tools</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">Coordination Services</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Rescue request reporting and coordination</li>
                  <li>Evacuation center location and status information</li>
                  <li>Emergency response coordination for authorized personnel</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="responsibilities">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">User Responsibilities</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">Accurate Information</h3>
                <p className="text-sm text-gray-700">
                  You agree to provide accurate, current, and complete information about yourself
                  and maintain the accuracy of such information. This is crucial for emergency
                  response effectiveness.
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">Emergency Use Only</h3>
                <p className="text-sm text-gray-700">
                  You agree to use rescue request features only for genuine emergencies. False
                  emergency reports may result in account suspension and legal consequences.
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">
                  Device and Network Requirements
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Maintain a compatible mobile device</li>
                  <li>Ensure network connectivity for emergency communications</li>
                  <li>Keep location services enabled for emergency response</li>
                  <li>Keep the application updated to the latest version</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="prohibited">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Prohibited Activities</h2>
            <p className="text-gray-700 mb-4">
              To ensure the safety and integrity of our emergency services, you may not:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Submit false emergency reports or rescue requests</li>
              <li>Interfere with emergency response operations</li>
              <li>Use the service for commercial purposes without authorization</li>
              <li>Attempt to access administrative features without proper credentials</li>
              <li>Share your account credentials with unauthorized persons</li>
              <li>Use the service in any way that could harm emergency response efforts</li>
            </ul>
          </section>

          <section id="availability">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Service Availability</h2>
            <p className="text-sm text-gray-700">
              While we strive to provide continuous service, AmayAlert may be temporarily
              unavailable due to maintenance, technical issues, or circumstances beyond our control.
              We do not guarantee uninterrupted service and are not liable for service
              interruptions.
            </p>
          </section>

          <section id="limitations">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Emergency Limitations</h2>
            <div className="border-l-4 border-gray-300 pl-4 mb-4">
              <h3 className="text-base font-medium text-gray-800 mb-2">Critical Notice</h3>
              <p className="text-sm text-gray-700">
                AmayAlert is a supplementary emergency tool. In life-threatening situations, always
                contact local emergency services (911, 112, etc.) first.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Response Time Variations</h4>
                <p className="text-xs text-gray-600">
                  Response times may vary based on local emergency services
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">Technical Dependencies</h4>
                <p className="text-xs text-gray-600">
                  Service depends on network connectivity and device functionality
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">Response Responsibility</h4>
                <p className="text-xs text-gray-600">
                  We are not responsible for emergency response actions or outcomes
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">Backup Methods</h4>
                <p className="text-xs text-gray-600">
                  Always have backup emergency communication methods
                </p>
              </div>
            </div>
          </section>

          <section id="privacy">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Privacy and Data</h2>
            <p className="text-sm text-gray-700">
              Your use of AmayAlert is also governed by our Privacy Policy. Please review our
              Privacy Policy to understand our practices regarding your personal information.
            </p>
          </section>

          <section id="liability">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
            <p className="text-sm text-gray-700">
              AmayAlert and its operators shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including without limitation, loss of profits,
              data, use, goodwill, or other intangible losses, resulting from your use of the
              service.
            </p>
          </section>

          <section id="termination">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Account Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account at any time for:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Violation of these terms</li>
              <li>False emergency reporting</li>
              <li>Misuse of emergency services</li>
              <li>Failure to provide accurate information</li>
            </ul>
          </section>

          <section id="changes">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Changes to Terms</h2>
            <p className="text-sm text-gray-700">
              We reserve the right to modify these terms at any time. We will notify users of
              significant changes via the application or email. Your continued use of the service
              after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section id="governing">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Governing Law</h2>
            <p className="text-sm text-gray-700">
              These terms shall be interpreted and governed in accordance with the laws of the
              jurisdiction in which AmayAlert operates, without regard to conflict of law
              provisions.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <span className="font-medium">Email:</span> legal@amayalert.com
              </div>
              <div>
                <span className="font-medium">Phone:</span> +63 46 123 4567
              </div>
              <div>
                <span className="font-medium">Address:</span> AmayAlert Legal Department, Tanza,
                Cavite
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
