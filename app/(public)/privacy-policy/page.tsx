export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Last updated: April 2025</p>

        <div className="space-y-12 text-gray-600 leading-relaxed">

          <section id="introduction">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h2>
            <p className="mb-3">
              Welcome to Amayalert. We are committed to protecting your privacy and ensuring
              the security of your personal information while providing emergency services.
            </p>
            <p>
              This Privacy Policy explains how Amayalert collects, uses, discloses, and
              safeguards your information when you use our emergency alert and rescue
              coordination mobile application and administrative dashboard.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section id="data-collection">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Data We Collect</h2>
            <p className="mb-4">We collect the following types of information:</p>
            <p className="font-medium text-gray-700 mb-2">Personal Information</p>
            <ul className="list-disc pl-5 space-y-1 mb-6 text-sm">
              <li>Full name and contact info</li>
              <li>Phone number for SMS alerts</li>
              <li>Email address for account</li>
              <li>Optional profile picture</li>
              <li>Birth date and gender (for EMS)</li>
            </ul>
            <p className="font-medium text-gray-700 mb-2">Location & Emergency Data</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>GPS coordinates for reports</li>
              <li>Location for evacuation info</li>
              <li>Address information</li>
              <li>Rescue requests data</li>
              <li>Responder communications</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section id="data-usage">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <p className="mb-4">We use your information exclusively for emergency services and safety purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Provide emergency alert notifications</li>
              <li>Coordinate rescue and emergency operations</li>
              <li>Send SMS alerts for safety warnings</li>
              <li>Direct you to nearest evacuation centers</li>
              <li>Improve emergency response services</li>
              <li>Communicate with responders on your behalf</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section id="data-sharing">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Information Sharing</h2>
            <p className="mb-4">We may share your information only in these specific circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><span className="font-medium text-gray-700">Emergency Responders —</span> Local authorities, rescue teams, and medical personnel during active emergencies</li>
              <li><span className="font-medium text-gray-700">Government Agencies —</span> Disaster management offices and public safety departments</li>
              <li><span className="font-medium text-gray-700">Service Providers —</span> SMS gateway providers for alert delivery</li>
              <li><span className="font-medium text-gray-700">Legal Requirements —</span> When required by law or to protect public safety</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section id="data-security">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Data Security</h2>
            <p className="mb-4">We implement comprehensive security measures to protect your personal information:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>End-to-end encryption for all data transmission</li>
              <li>Restricted access controls for authorized personnel only</li>
              <li>24/7 security monitoring and threat detection</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section id="your-rights">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion (subject to EMS laws)</li>
              <li>Opt-out of non-emergency communications</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section id="camera-usage">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Camera Usage</h2>
            <p className="mb-4">
              Amayalert may request access to your device camera solely to support emergency
              reporting features within the app.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><span className="font-medium text-gray-700">Emergency purposes only —</span> Camera access is used exclusively to capture photos or videos when submitting an emergency report or documenting an incident for rescue coordination.</li>
              <li><span className="font-medium text-gray-700">Permission-based access —</span> The app will request camera permission before accessing your device camera. You may grant or deny this permission at any time through your device settings.</li>
              <li><span className="font-medium text-gray-700">No background capture —</span> Amayalert never accesses your camera in the background. Media is only captured when you explicitly initiate it within the app.</li>
              <li><span className="font-medium text-gray-700">Limited use of captured media —</span> Photos and videos are used solely for emergency response purposes. Media is shared only with authorized emergency responders or government agencies directly involved in your reported incident, and is never used for advertising or sold to third parties.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section id="permissions">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">App Permissions</h2>
            <p className="mb-4">
              Amayalert requests the following device permissions, each used strictly for
              emergency-related functionality:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><span className="font-medium text-gray-700">Camera —</span> To capture photos and videos when documenting emergencies or submitting incident reports.</li>
              <li><span className="font-medium text-gray-700">Location —</span> To determine your GPS coordinates for rescue coordination, evacuation routing, and location-aware alerts.</li>
              <li><span className="font-medium text-gray-700">SMS —</span> To send and receive emergency alert notifications, safety warnings, and coordination messages via text.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
