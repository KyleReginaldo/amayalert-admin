'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AlertProvider } from './components/alert-context';
import Sidebar from './components/sidebard';
import './globals.css';
import { DataProvider } from './providers/data-provider';

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

  // Check if current route is an auth page
  const isAuthPage =
    pathname?.startsWith('/signin') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/login') ||
    pathname?.includes('/(auth)/');

  return (
    <html lang="en">
      <body className={`${isAuthPage ? 'bg-gray-50' : 'flex h-screen bg-gray-50 overflow-hidden'}`}>
        <DataProvider>
          <AlertProvider>
            {!isAuthPage && <Sidebar />}
            <main
              className={`${
                isAuthPage
                  ? 'min-h-screen w-full'
                  : 'flex-1 overflow-auto ml-0 md:ml-64 transition-all duration-300'
              }`}
            >
              {children}
            </main>
          </AlertProvider>
        </DataProvider>
      </body>
    </html>
  );
}
