'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mt-1">Last updated: October 9, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded p-6 space-y-8">
          <section id="introduction">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to Amayalert. We are committed to protecting your privacy and ensuring the
              security of your personal information while providing emergency services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy explains how Amayalert collects, uses, discloses, and safeguards
              your information when you use our emergency alert and rescue coordination mobile
              application and administrative dashboard.
            </p>
          </section>

          <section id="data-collection">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Information We Collect</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Full name and contact information</li>
                  <li>Phone number for SMS alerts</li>
                  <li>Email address for account management</li>
                  <li>Profile picture (optional)</li>
                  <li>Birth date and gender (for emergency response)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">Location Information</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>GPS coordinates when reporting emergencies</li>
                  <li>Location data for evacuation center recommendations</li>
                  <li>Address information you provide</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-800 mb-2">Emergency Data</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Emergency reports and rescue requests</li>
                  <li>Communication with emergency responders</li>
                  <li>Evacuation status and check-ins</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="data-usage">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              We use your information exclusively for emergency services and safety purposes:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Provide emergency alert notifications</li>
              <li>Coordinate rescue and emergency response operations</li>
              <li>Send SMS alerts for safety warnings</li>
              <li>Direct you to nearest evacuation centers</li>
              <li>Improve our emergency response services</li>
              <li>Communicate with emergency responders on your behalf</li>
            </ul>
          </section>

          <section id="data-sharing">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We may share your information only in these specific circumstances:
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-1">Emergency Responders</h3>
                <p className="text-sm text-gray-700">
                  Local authorities, rescue teams, and medical personnel during active emergencies
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-1">Government Agencies</h3>
                <p className="text-sm text-gray-700">
                  Disaster management offices and public safety departments
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-1">Service Providers</h3>
                <p className="text-sm text-gray-700">SMS gateway providers for alert delivery</p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-1">Legal Requirements</h3>
                <p className="text-sm text-gray-700">
                  When required by law or to protect public safety
                </p>
              </div>
            </div>
          </section>

          <section id="data-security">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement comprehensive security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>End-to-end encryption for all data transmission</li>
              <li>Restricted access controls for authorized personnel only</li>
              <li>24/7 security monitoring and threat detection</li>
            </ul>
          </section>

          <section id="your-rights">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>
                Request deletion of your information (subject to emergency service requirements)
              </li>
              <li>Opt-out of non-emergency communications</li>
            </ul>
          </section>

          <section id="children">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Children&apos;s Privacy</h2>
            <p className="text-gray-700 text-sm">
              Our service may be used by minors in emergency situations. We collect only minimal
              information necessary for emergency response and parental consent is obtained when
              possible.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <span className="font-medium">Email:</span> privacy@amayalert.com
              </div>
              <div>
                <span className="font-medium">Phone:</span> +63 46 123 4567
              </div>
              <div>
                <span className="font-medium">Address:</span> Amayalert Privacy Office, Tanza,
                Cavite
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
