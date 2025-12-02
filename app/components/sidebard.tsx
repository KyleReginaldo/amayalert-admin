'use client';

import { supabase } from '@/app/client/supabase';
import { useChat } from '@/app/providers/chat-provider';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/database.types';
import {
  Ban,
  ClipboardList,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  MapPinHouse,
  MessageCircle,
  Settings,
  Shield,
  TriangleAlert,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

type ModuleType = Database['public']['Enums']['modules'];

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
  const { totalUnreadCount } = useChat();
  const [userModules, setUserModules] = useState<ModuleType[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user modules and role
  useEffect(() => {
    const fetchUserModules = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('modules, role')
            .eq('id', user.id)
            .single();

          if (userData) {
            setUserModules(userData.modules || []);
            setUserRole(userData.role);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserModules();
  }, []);

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

  // Define all navigation items with their required modules
  const allNavigationItems = [
    {
      href: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      isActive: pathname === '/',
      requiredModule: null, // Dashboard is always visible
    },
    {
      href: '/alert',
      icon: TriangleAlert,
      label: 'Alerts',
      isActive: pathname === '/alert',
      requiredModule: 'alert' as ModuleType,
    },
    {
      href: '/evacuation',
      icon: MapPinHouse,
      label: 'Evacuation Centers',
      isActive: pathname === '/evacuation',
      requiredModule: 'evacuation' as ModuleType,
    },
    {
      href: '/rescue',
      icon: LifeBuoy,
      label: 'Rescue Operations',
      isActive: pathname === '/rescue',
      requiredModule: 'rescue' as ModuleType,
    },
    {
      href: '/users',
      icon: Users,
      label: 'User Management',
      isActive: pathname === '/users',
      requiredModule: 'user' as ModuleType,
    },
    {
      href: '/admins',
      icon: Shield,
      label: 'Admin Management',
      isActive: pathname === '/admins',
      requiredModule: 'admin' as ModuleType,
    },
    {
      href: '/reports',
      icon: Flag,
      label: 'Reports',
      isActive: pathname === '/reports',
      requiredModule: 'report' as ModuleType,
    },
    {
      href: '/chat',
      icon: MessageCircle,
      label: 'Chat',
      isActive: pathname === '/chat',
      requiredModule: 'chat' as ModuleType,
    },
    {
      href: '/word-filters',
      icon: Ban,
      label: 'Word Filters',
      isActive: pathname === '/word-filters',
      requiredModule: 'setting' as ModuleType,
    },
    {
      href: '/logs',
      icon: ClipboardList,
      label: 'Activity Logs',
      isActive: pathname === '/logs',
      requiredModule: null, // Admins can always see logs
      adminOnly: true, // Only for admin role
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings',
      isActive: pathname === '/settings',
      requiredModule: null,
    },
  ];

  // Filter navigation items based on user role and modules
  const navigationItems = allNavigationItems.filter((item) => {
    // Admin role has access to everything
    if (userRole === 'admin') return true;

    // Check if item is admin-only
    if ('adminOnly' in item && item.adminOnly) {
      return userRole === 'admin';
    }

    // Dashboard is always accessible
    if (!item.requiredModule) return true;

    // Sub-admin: check if they have the required module
    if (userRole === 'sub_admin') {
      return userModules.includes(item.requiredModule);
    }
    // Regular users shouldn't see admin panel
    return false;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden bg-black/50"
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
        <div className="flex-shrink-0 px-6 py-6 border-b border-blue-400/20">
          <h1 className="text-xl font-bold">Amayalert</h1>
          <p
            className={`text-blue-100 text-sm w-fit px-2 rounded-full py-0.5 mt-1 bg-white ${
              userRole === 'admin' ? 'text-blue-800' : 'text-blue-400'
            }`}
          >
            {userRole === 'admin' ? 'Admin' : userRole === 'sub_admin' ? 'Sub Admin' : 'User'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin" />
            </div>
          ) : (
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isChat = item.href === '/chat';
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3  transition-all duration-200 hover:bg-blue-500/30 ${
                        item.isActive
                          ? 'bg-blue-500/40 border-l-4 shadow-sm'
                          : 'hover:translate-x-1'
                      }`}
                    >
                      <IconComponent
                        size={20}
                        className={item.isActive ? 'text-white' : 'text-blue-100'}
                      />
                      <span
                        className={`font-medium flex-1 ${
                          item.isActive ? 'text-white' : 'text-blue-100'
                        }`}
                      >
                        {item.label}
                      </span>
                      {isChat && totalUnreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                          {totalUnreadCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Footer (kept minimal; sign out moved to Settings) */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-blue-400/20" />
      </div>
    </>
  );
};

export default Sidebar;
