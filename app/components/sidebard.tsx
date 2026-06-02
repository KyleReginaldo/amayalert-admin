'use client';

import { supabase } from '@/app/client/supabase';
import { useChat } from '@/app/providers/chat-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database } from '@/database.types';
import {
  Ban,
  ClipboardList,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPinHouse,
  MessageCircle,
  Phone,
  Settings,
  Shield,
  TriangleAlert,
  Users,
} from 'lucide-react';
import Image from 'next/image';
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
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

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
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/signin';
    }
  };
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
    { href: '/',           icon: LayoutDashboard, label: 'Dashboard',          isActive: pathname === '/',           requiredModule: null,                    group: 'overview' },
    { href: '/alert',      icon: TriangleAlert,   label: 'Alerts',             isActive: pathname === '/alert',      requiredModule: 'alert' as ModuleType,   group: 'operations' },
    { href: '/evacuation', icon: MapPinHouse,      label: 'Evacuation',         isActive: pathname === '/evacuation', requiredModule: 'evacuation' as ModuleType, group: 'operations' },
    { href: '/rescue',     icon: LifeBuoy,         label: 'Rescue',             isActive: pathname === '/rescue',     requiredModule: 'rescue' as ModuleType,  group: 'operations' },
    { href: '/hotlines',   icon: Phone,            label: 'Hotlines',           isActive: pathname === '/hotlines',   requiredModule: null,                    group: 'operations' },
    { href: '/users',      icon: Users,            label: 'Users',              isActive: pathname === '/users',      requiredModule: 'user' as ModuleType,    group: 'people' },
    { href: '/admins',     icon: Shield,           label: 'Admins',             isActive: pathname === '/admins',     requiredModule: 'admin' as ModuleType,   group: 'people' },
    { href: '/reports',    icon: Flag,             label: 'Reports',            isActive: pathname === '/reports',    requiredModule: 'report' as ModuleType,  group: 'content' },
    { href: '/chat',       icon: MessageCircle,    label: 'Chat',               isActive: pathname === '/chat',       requiredModule: 'chat' as ModuleType,    group: 'content' },
    { href: '/word-filters',icon: Ban,             label: 'Word Filters',       isActive: pathname === '/word-filters', requiredModule: 'setting' as ModuleType, group: 'content' },
    { href: '/logs',       icon: ClipboardList,    label: 'Activity Logs',      isActive: pathname === '/logs',       requiredModule: null, adminOnly: true,    group: 'system' },
    { href: '/settings',   icon: Settings,         label: 'Settings',           isActive: pathname === '/settings',   requiredModule: null,                    group: 'system' },
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

  const groups: { key: string; label: string }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'operations',  label: 'Operations' },
    { key: 'people',      label: 'People' },
    { key: 'content',     label: 'Content' },
    { key: 'system',      label: 'System' },
  ];

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
          bg-[#111827] h-screen w-56 flex flex-col text-white shadow-xl z-30
          fixed left-0 top-0 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <Image
              src="/amayalert.png"
              alt="Amayalert"
              width={32}
              height={32}
              className="rounded-lg shrink-0 object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none">Amayalert</p>
              <p className={`text-[10px] mt-0.5 font-medium ${
                userRole === 'admin' ? 'text-purple-400' : 'text-blue-400'
              }`}>
                {userRole === 'admin' ? 'Administrator' : userRole === 'sub_admin' ? 'Sub-Admin' : 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4 scrollbar-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            groups.map((group) => {
              const items = navigationItems.filter((i) => (i as { group?: string }).group === group.key);
              if (items.length === 0) return null;
              return (
                <div key={group.key}>
                  <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 select-none">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isChat = item.href === '/chat';
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                              item.isActive
                                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/40'
                                : 'text-white/60 hover:text-white hover:bg-white/8'
                            }`}
                          >
                            <Icon
                              size={15}
                              className={`shrink-0 ${item.isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}
                            />
                            <span className="flex-1 font-medium leading-none truncate">{item.label}</span>
                            {isChat && totalUnreadCount > 0 && (
                              <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                                {totalUnreadCount}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </nav>

        {/* Sign Out */}
        <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-white/8">
          <button
            onClick={() => setShowSignOutDialog(true)}
            className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut size={15} className="shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to log in again to access the admin
              panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;
