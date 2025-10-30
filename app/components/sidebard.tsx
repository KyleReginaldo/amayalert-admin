'use client';

import {
  LayoutDashboard,
  LifeBuoy,
  MapPinHouse,
  MessageCircle,
  Settings,
  TriangleAlert,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

// Create context for sidebar state
const SidebarContext = createContext<{
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
} | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <SidebarContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen, toggleMobileMenu }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = () => {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar();

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');

      if (isMobileMenuOpen && sidebar) {
        if (!sidebar.contains(event.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

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
    {
      href: '/rescue',
      icon: LifeBuoy,
      label: 'Rescue Operations',
      isActive: pathname === '/rescue',
    },
    {
      href: '/users',
      icon: Users,
      label: 'User Management',
      isActive: pathname === '/users',
    },
    {
      href: '/chat',
      icon: MessageCircle,
      label: 'Chat',
      isActive: pathname === '/chat',
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings',
      isActive: pathname === '/settings',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={`
          bg-[#234C6A] h-screen w-64 flex flex-col text-white shadow-lg z-30
          fixed left-0 top-0 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-blue-400/20 flex-shrink-0">
          <h1 className="text-xl font-bold">AmayAlert</h1>
          <p className="text-blue-100 text-md">Admin</p>
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
                    className={`flex items-center gap-3 px-4 py-3  transition-all duration-200 hover:bg-blue-500/30 ${
                      item.isActive ? 'bg-blue-500/40 border-l-4 shadow-sm' : 'hover:translate-x-1'
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

        {/* Footer (kept minimal; sign out moved to Settings) */}
        <div className="px-4 py-4 border-t border-blue-400/20 flex-shrink-0" />
      </div>
    </>
  );
};

export default Sidebar;
