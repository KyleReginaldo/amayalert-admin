import type { Metadata } from 'next';
import { AlertProvider } from './components/alert-context';
import Sidebar from './components/sidebard';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amayalert Admin',
  description: 'Admin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        <AlertProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </AlertProvider>
      </body>
    </html>
  );
}
