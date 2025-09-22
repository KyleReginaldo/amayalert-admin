// Clean static Alerts page (no Supabase)
'use client';

import { AlertTriangle, Bell, Clock, MapPin } from 'lucide-react';

type AlertItem = {
  id: string;
  title: string;
  severity: 'Low' | 'High' | 'Critical' | string;
  location: string;
  time: string;
  acknowledged?: boolean;
};

const sampleAlerts: AlertItem[] = [
  {
    id: '1',
    title: 'Flood warning near Riverside',
    severity: 'High',
    location: 'Riverside Avenue',
    time: '10 mins ago',
  },
  {
    id: '2',
    title: 'Minor fire contained',
    severity: 'Low',
    location: 'Oakwood Street',
    time: '1 hr ago',
  },
  {
    id: '3',
    title: 'Evacuation in progress',
    severity: 'Critical',
    location: 'Downtown Plaza',
    time: '2 mins ago',
  },
];

const severityColor = (s: string) => {
  switch (s.toLowerCase()) {
    case 'critical':
      return 'bg-red-600';
    case 'high':
      return 'bg-orange-500';
    case 'low':
      return 'bg-green-600';
    default:
      return 'bg-gray-500';
  }
};

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Alerts</h1>
            <p className="text-sm text-gray-500">Active incident feed and tools to manage alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm text-sm">
            <MapPin size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3396D3] text-white rounded-md shadow hover:bg-[#2b84bf]">
            <AlertTriangle size={16} /> Create Alert
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          <div className="space-y-4">
            {sampleAlerts.map((a) => (
              <article
                key={a.id}
                className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border"
              >
                <div className={`p-3 rounded-md text-white ${severityColor(a.severity)}`}>
                  <AlertTriangle size={20} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{a.title}</h3>
                    <span className="text-sm text-gray-400">{a.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{a.location}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                      Severity: {a.severity}
                    </span>
                    <button className="text-sm text-[#3396D3]">Acknowledge</button>
                    <button className="text-sm text-red-500">Escalate</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <h4 className="font-semibold mb-2">Quick actions</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Clock size={14} /> Recent alerts
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} /> Map view
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={14} /> Create alert template
              </li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <h4 className="font-semibold mb-2">Status overview</h4>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <div>
                <div className="text-xs text-gray-400">Open</div>
                <div className="text-lg font-semibold">3</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Critical</div>
                <div className="text-lg font-semibold text-red-600">1</div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
