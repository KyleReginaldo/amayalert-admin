'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AlertProvider } from './components/alert-context';
import Sidebar, { SidebarProvider, useSidebar } from './components/sidebard';
import './globals.css';
import { AlertsProvider } from './providers/alerts-provider';
import { ChatProvider } from './providers/chat-provider';
import { DataProvider } from './providers/data-provider';
import { EvacuationProvider } from './providers/evacuation-provider';
import { RescueProvider } from './providers/rescue-provider';

// Global Mobile Header Component
function GlobalMobileHeader() {
  const { toggleMobileMenu } = useSidebar();
  const pathname = usePathname();

  // Get page title based on pathname
  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard';
    if (path === '/alert') return 'Alerts';
    if (path === '/evacuation') return 'Evacuation Centers';
    if (path === '/rescue') return 'Rescue Operations';
    if (path === '/sms-test') return 'SMS Test';
    if (path === '/users') return 'Users';
    if (path === '/chat') return 'Chat';
    if (path === '/settings') return 'Settings';
    return 'Amayalert';
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b shadow-sm md:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleMobileMenu} className="p-2 rounded-lg">
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{getPageTitle(pathname || '')}</h1>
        </div>
      </div>
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
        <title>Amayalert Admin</title>
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
                        {children}
                      </main>
                    </SidebarProvider>
                  </AlertProvider>
                </ChatProvider>
              </RescueProvider>
            </EvacuationProvider>
          </AlertsProvider>
        </DataProvider>
      </body>
    </html>
  );
}
