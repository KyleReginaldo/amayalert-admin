'use client';

import {
  Activity,
  AlertCircle,
  Ban,
  BookOpen,
  CheckCircle,
  FileText,
  Layers,
  Phone,
  RefreshCw,
  Scale,
  Shield,
  UserX,
} from 'lucide-react';
import { useState } from 'react';

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('agreement');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'agreement', title: 'Agreement to Terms', icon: FileText },
    { id: 'service-description', title: 'Service Description', icon: Layers },
    { id: 'responsibilities', title: 'User Responsibilities', icon: CheckCircle },
    { id: 'prohibited', title: 'Prohibited Activities', icon: Ban },
    { id: 'availability', title: 'Service Availability', icon: Activity },
    { id: 'limitations', title: 'Emergency Limitations', icon: AlertCircle },
    { id: 'privacy', title: 'Privacy and Data', icon: Shield },
    { id: 'liability', title: 'Liability limitation', icon: Scale },
    { id: 'termination', title: 'Account Termination', icon: UserX },
    { id: 'changes', title: 'Changes to Terms', icon: RefreshCw },
    { id: 'governing', title: 'Governing Law', icon: BookOpen },
    { id: 'contact', title: 'Contact Information', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <div className="flex-1 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-16">
              <section id="agreement" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Agreement to Terms</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-gray-600 leading-relaxed text-lg mb-4">
                    By accessing and using Amayalert, you accept and agree to be bound by these
                    terms and provisions.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Welcome to Amayalert (&quot;Service&quot;). These Terms of Service govern your
                    use of our emergency alert and rescue coordination platform. If you do not agree
                    to abide by these terms, please do not use this service.
                  </p>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="service-description" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Service Description</h2>
                </div>

                <p className="text-gray-600 mb-6 text-lg">
                  Amayalert is a comprehensive emergency alert and rescue coordination platform that
                  provides:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-indigo-100 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Alert Services
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Emergency alert notifications via SMS and push notifications',
                        'Real-time emergency communication tools',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-indigo-100 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Coordination Services
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Rescue request reporting and coordination',
                        'Evacuation center location and status info',
                        'Emergency response coordination for auth personnel',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="responsibilities" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">User Responsibilities</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-xl border border-gray-100 bg-white">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Accurate Information</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      You agree to provide accurate, current, and complete information about
                      yourself and maintain the accuracy of such information. This is crucial for
                      emergency response effectiveness.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-gray-100 bg-white">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Emergency Use Only</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      You agree to use rescue request features only for genuine emergencies. False
                      emergency reports may result in account suspension and legal consequences.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-gray-100 bg-white">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">
                      Device and Network Requirements
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        'Maintain a compatible mobile device',
                        'Ensure network connectivity for comms',
                        'Keep location services enabled',
                        'Keep the application updated',
                      ].map((text, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-gray-700">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="prohibited" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                    <Ban className="w-4 h-4 text-rose-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Prohibited Activities</h2>
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  To ensure the safety and integrity of our emergency services, you may not:
                </p>
                <div className="bg-rose-50/50 rounded-2xl p-6 border border-rose-100/50">
                  <ul className="space-y-4">
                    {[
                      'Submit false emergency reports or rescue requests',
                      'Interfere with emergency response operations',
                      'Use the service for commercial purposes without authorization',
                      'Attempt to access administrative features without proper credentials',
                      'Share your account credentials with unauthorized persons',
                      'Use the service in any way that could harm emergency response efforts',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Ban className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="availability" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Service Availability</h2>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm p-4 bg-amber-50/30 rounded-xl border border-amber-100/50">
                  While we strive to provide continuous service, Amayalert may be temporarily
                  unavailable due to maintenance, technical issues, or circumstances beyond our
                  control. We do not guarantee uninterrupted service and are not liable for service
                  interruptions.
                </p>
              </section>

              <hr className="border-gray-100" />

              <section id="limitations" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Emergency Limitations</h2>
                </div>

                <div className="border-l-4 border-orange-500 bg-orange-50/50 p-6 rounded-r-xl mb-6">
                  <h3 className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Critical Notice
                  </h3>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    Amayalert is a supplementary emergency tool. In life-threatening situations,
                    always contact local emergency services (911, 112, etc.) first.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'Response Time Variations',
                      desc: 'Times may vary based on local emergency services',
                    },
                    {
                      title: 'Technical Dependencies',
                      desc: 'Service depends on network and device functionality',
                    },
                    {
                      title: 'Response Responsibility',
                      desc: 'We are not responsible for response actions/outcomes',
                    },
                    {
                      title: 'Backup Methods',
                      desc: 'Always have backup emergency communication methods',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
                    >
                      <h4 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="privacy" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Privacy and Data</h2>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your use of Amayalert is also governed by our Privacy Policy. Please review our
                  Privacy Policy to understand our practices regarding your personal information.
                </p>
              </section>

              <hr className="border-gray-100" />

              <section id="liability" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-slate-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Amayalert and its operators shall not be liable for any indirect, incidental,
                  special, consequential, or punitive damages, including without limitation, loss of
                  profits, data, use, goodwill, or other intangible losses, resulting from your use
                  of the service.
                </p>
              </section>

              <hr className="border-gray-100" />

              <section id="termination" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <UserX className="w-4 h-4 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Account Termination</h2>
                </div>
                <p className="text-gray-600 mb-4 font-medium">
                  We may terminate or suspend your account at any time for:
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Violation of these terms',
                    'False emergency reporting',
                    'Misuse of emergency services',
                    'Failure to provide accurate info',
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-red-50/30 border border-red-100 rounded-lg"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="changes" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-teal-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Changes to Terms</h2>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of
                  significant changes via the application or email. Your continued use of the
                  service after such modifications constitutes acceptance of the updated terms.
                </p>
              </section>

              <hr className="border-gray-100" />

              <section id="governing" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-fuchsia-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Governing Law</h2>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  These terms shall be interpreted and governed in accordance with the laws of the
                  jurisdiction in which Amayalert operates, without regard to conflict of law
                  provisions.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
