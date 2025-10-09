'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AlertProvider } from './components/alert-context';
import Sidebar, { SidebarProvider, useSidebar } from './components/sidebard';
import './globals.css';
import { AlertsProvider } from './providers/alerts-provider';
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
    return 'AmayAlert';
  };

  return (
    <div className="md:hidden bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleMobileMenu} className="p-2 rounded-lg">
            <Menu className="h-5 w-5" />
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
    document.title = 'Amayalert Admin';
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
    pathname?.startsWith('/contact-us');

  // Pages that should not have the admin layout
  const shouldHideAdminLayout = isAuthPage || isPublicPage;

  return (
    <html lang="en">
      <body
        className={`${
          shouldHideAdminLayout ? 'bg-gray-50' : 'flex h-screen bg-gray-50 overflow-hidden'
        }`}
      >
        <DataProvider>
          <AlertsProvider>
            <EvacuationProvider>
              <RescueProvider>
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
              </RescueProvider>
            </EvacuationProvider>
          </AlertsProvider>
        </DataProvider>
      </body>
    </html>
  );
}
