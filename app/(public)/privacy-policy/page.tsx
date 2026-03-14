'use client';

import { AlertCircle, Database, Eye, Lock, Phone, Share2, Shield, UserCheck } from 'lucide-react';
import { useState } from 'react';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'introduction', title: 'Introduction', icon: Shield },
    { id: 'data-collection', title: 'Data We Collect', icon: Database },
    { id: 'data-usage', title: 'How We Use Info', icon: Eye },
    { id: 'data-sharing', title: 'Information Sharing', icon: Share2 },
    { id: 'data-security', title: 'Data Security', icon: Lock },
    { id: 'your-rights', title: 'Your Rights', icon: UserCheck },
    { id: 'children', title: "Children's Privacy", icon: AlertCircle },
    { id: 'contact', title: 'Contact Us', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-16">
              <section id="introduction" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
                </div>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-600 leading-relaxed text-lg mb-4">
                    Welcome to Amayalert. We are committed to protecting your privacy and ensuring
                    the security of your personal information while providing emergency services.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    This Privacy Policy explains how Amayalert collects, uses, discloses, and
                    safeguards your information when you use our emergency alert and rescue
                    coordination mobile application and administrative dashboard.
                  </p>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="data-collection" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Database className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data We Collect</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-indigo-100 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Personal Information
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Full name and contact info',
                        'Phone number for SMS alerts',
                        'Email address for account',
                        'Optional profile picture',
                        'Birth date and gender (for EMS)',
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
                      Location & Emergency
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'GPS coordinates for reports',
                        'Location for evacuation info',
                        'Address information',
                        'Rescue requests data',
                        'Responder communications',
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

              <section id="data-usage" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  We use your information exclusively for emergency services and safety purposes:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Provide emergency alert notifications',
                    'Coordinate rescue and emergency operations',
                    'Send SMS alerts for safety warnings',
                    'Direct you to nearest evacuation centers',
                    'Improve emergency response services',
                    'Communicate with responders on your behalf',
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="data-sharing" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
                </div>
                <p className="text-gray-600 mb-8 text-lg">
                  We may share your information only in these specific circumstances:
                </p>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Emergency Responders',
                      desc: 'Local authorities, rescue teams, and medical personnel during active emergencies',
                    },
                    {
                      title: 'Government Agencies',
                      desc: 'Disaster management offices and public safety departments',
                    },
                    {
                      title: 'Service Providers',
                      desc: 'SMS gateway providers for alert delivery',
                    },
                    {
                      title: 'Legal Requirements',
                      desc: 'When required by law or to protect public safety',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-5 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                    >
                      <h3 className="text-sm font-bold text-gray-900 sm:w-48 flex-shrink-0">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="data-security" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                </div>
                <div className="bg-purple-50/50 rounded-2xl p-8 border border-purple-100/50">
                  <p className="text-gray-700 mb-6 font-medium">
                    We implement comprehensive security measures to protect your personal
                    information:
                  </p>
                  <ul className="space-y-4">
                    {[
                      'End-to-end encryption for all data transmission',
                      'Restricted access controls for authorized personnel only',
                      '24/7 security monitoring and threat detection',
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-purple-100/30"
                      >
                        <Lock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100" />

              <section id="your-rights" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Access your personal information',
                    'Correct inaccurate information',
                    'Request deletion (subject to EMS laws)',
                    'Opt-out of non-emergency comms',
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-300 transition-colors shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-cyan-600">{i + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
