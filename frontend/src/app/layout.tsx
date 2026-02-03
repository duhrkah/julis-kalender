import type { Metadata, Viewport } from 'next';
import { Anybody } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { ToastProvider } from '@/components/ui/toast';
import ApiErrorToaster from '@/components/ui/ApiErrorToaster';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { I18nProvider } from '@/lib/i18n';

const anybody = Anybody({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'JuLis Kalender - Event Management',
  description: 'Event Management System der Jungen Liberalen',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JuLis Kalender',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#E6007E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={anybody.className}>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <ApiErrorToaster />
              <AuthProvider>{children}</AuthProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
