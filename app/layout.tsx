'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AlertProvider } from './components/alert-context';
import { NotificationCenter } from './components/notification-center';
import Sidebar, { SidebarProvider, useSidebar } from './components/sidebard';
import './globals.css';
import { AlertsProvider } from './providers/alerts-provider';
import { ChatProvider } from './providers/chat-provider';
import { DataProvider } from './providers/data-provider';
import { EvacuationProvider } from './providers/evacuation-provider';
import { NotificationProvider } from './providers/notification-provider';
import { RescueProvider } from './providers/rescue-provider';

// Page info map — used by both mobile header and desktop topbar
const PAGE_INFO: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your emergency management system' },
  '/alert': { title: 'Alert Management', subtitle: 'Monitor and manage emergency alerts' },
  '/evacuation': { title: 'Evacuation Centers', subtitle: 'Monitor and manage evacuation facilities' },
  '/rescue': { title: 'Rescue Requests', subtitle: 'Monitor and manage emergency rescue requests from citizens' },
  '/users': { title: 'User Management', subtitle: 'Manage registered users' },
  '/admins': { title: 'Admin Management', subtitle: 'Manage administrator accounts and permissions' },
  '/reports': { title: 'Reports', subtitle: 'Manage reported posts and take appropriate actions' },
  '/chat': { title: 'Chat', subtitle: 'Communicate with users' },
  '/word-filters': { title: 'Word Filters', subtitle: 'Manage inappropriate words and content filters' },
  '/logs': { title: 'Activity Logs', subtitle: 'Monitor all admin and sub-admin activities' },
  '/settings': { title: 'Settings', subtitle: 'Configure system settings' },
};

// Global Mobile Header Component
function GlobalMobileHeader() {
  const { toggleMobileMenu } = useSidebar();
  const pathname = usePathname();
  const pageInfo = PAGE_INFO[pathname || ''] ?? { title: 'Amayalert', subtitle: '' };

  return (
    <div className="sticky top-0 z-10 bg-white border-b shadow-sm md:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleMobileMenu} className="p-2 rounded-lg">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">{pageInfo.title}</h1>
          </div>
          <div className="ml-auto">
            <NotificationCenter />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopTopBar({ pathname }: { pathname: string | null }) {
  const pageInfo = PAGE_INFO[pathname || ''] ?? { title: 'Amayalert', subtitle: '' };
  return (
    <div className="sticky top-0 z-10 items-center justify-between hidden px-6 py-3 bg-white border-b shadow-sm md:flex">
      <div>
        <h1 className="text-sm font-semibold text-gray-900 leading-tight">{pageInfo.title}</h1>
        {pageInfo.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{pageInfo.subtitle}</p>
        )}
      </div>
      <NotificationCenter />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Set document title
  useEffect(() => {
    document.title = 'Amayalert';
  }, []);

  // Check if current route is an auth page or public page
  const isAuthPage =
    pathname?.startsWith('/signin') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/login') ||
    pathname?.includes('/(auth)/');

  // Check if current route is a public page (no admin layout needed)
  const isPublicPage =
    pathname?.startsWith('/privacy-policy') ||
    pathname?.startsWith('/terms-of-service') ||
    pathname?.startsWith('/contact-us') ||
    pathname?.startsWith('/reset-password');

  // Pages that should not have the admin layout
  const shouldHideAdminLayout = isAuthPage || isPublicPage;

  return (
    <html lang="en">
      <head>
        <title>Amayalert</title>
        <meta
          name="description"
          content="Emergency alert and rescue management system for Barangay Amaya V, Tanza Cavite"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/amayalert.png" />
        <link rel="icon" type="image/png" href="/amayalert.png" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/amayalert.png" />

        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme Color */}
        <meta name="theme-color" content="#0b5cff" />

        {/* Open Graph */}
        <meta property="og:title" content="Amayalert Admin" />
        <meta property="og:description" content="Emergency alert and rescue management system" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/amayalert.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Amayalert Admin" />
        <meta name="twitter:description" content="Emergency alert and rescue management system" />
      </head>
      <body
        className={`${
          shouldHideAdminLayout ? 'bg-gray-50' : 'flex h-screen bg-gray-50 overflow-hidden'
        }`}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              padding: '12px 20px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <DataProvider>
          <AlertsProvider>
            <EvacuationProvider>
              <RescueProvider>
                <ChatProvider>
                  <NotificationProvider>
                    <AlertProvider>
                      <SidebarProvider>
                        {!shouldHideAdminLayout && <Sidebar />}
                        <main
                          className={`${
                            shouldHideAdminLayout
                              ? 'min-h-screen w-full'
                              : 'flex-1 overflow-auto ml-0 md:ml-64 transition-all duration-300'
                          }`}
                        >
                          {!shouldHideAdminLayout && <GlobalMobileHeader />}
                          {!shouldHideAdminLayout && (
                            <DesktopTopBar pathname={pathname} />
                          )}
                          {children}
                        </main>
                      </SidebarProvider>
                    </AlertProvider>
                  </NotificationProvider>
                </ChatProvider>
              </RescueProvider>
            </EvacuationProvider>
          </AlertsProvider>
        </DataProvider>
      </body>
    </html>
  );
}
