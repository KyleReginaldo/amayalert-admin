'use client';

import {
  LayoutDashboard,
  LogOut,
  MapPinHouse,
  Menu,
  Settings,
  TriangleAlert,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('mobile-menu-button');

      if (isMobileMenuOpen && sidebar && menuButton) {
        if (!sidebar.contains(event.target as Node) && !menuButton.contains(event.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Hide the sidebar on authentication routes like /signin
  if (pathname?.startsWith('/signin')) return null;

  const navigationItems = [
    {
      href: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      isActive: pathname === '/',
    },
    {
      href: '/alert',
      icon: TriangleAlert,
      label: 'Alerts',
      isActive: pathname === '/alert',
    },
    {
      href: '/evacuation',
      icon: MapPinHouse,
      label: 'Evacuation Centers',
      isActive: pathname === '/evacuation',
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        id="mobile-menu-button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#3396D3] text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-20" />}

      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={`
          bg-[#3396D3] h-screen w-64 flex flex-col text-white shadow-lg z-30
          fixed left-0 top-0 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-blue-400/20 flex-shrink-0">
          <h1 className="text-xl font-bold">AmayAlert</h1>
          <p className="text-blue-100 text-sm">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-500/30 ${
                      item.isActive
                        ? 'bg-blue-500/40 border-l-4 border-white shadow-sm'
                        : 'hover:translate-x-1'
                    }`}
                  >
                    <IconComponent
                      size={20}
                      className={item.isActive ? 'text-white' : 'text-blue-100'}
                    />
                    <span
                      className={`font-medium ${item.isActive ? 'text-white' : 'text-blue-100'}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-blue-400/20 flex-shrink-0">
          <div className="space-y-2">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-blue-100 hover:bg-blue-500/30 transition-all duration-200 hover:translate-x-1"
            >
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </Link>
            <button
              onClick={() => {
                // Add logout logic here
                window.location.href = '/signin';
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-blue-100 hover:bg-red-500/30 transition-all duration-200 hover:translate-x-1 w-full text-left"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
