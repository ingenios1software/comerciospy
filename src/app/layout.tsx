import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Navbar } from '@/components/ui/navbar';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { InstallAppButton } from '@/components/pwa/install-app-button';

export const metadata: Metadata = {
  title: 'ComerciosPY',
  description: 'Guia moderna de comercios, servicios y contactos locales por WhatsApp.',
  applicationName: 'ComerciosPY',
  appleWebApp: {
    capable: true,
    title: 'ComerciosPY',
    statusBarStyle: 'default'
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  }
};

export const viewport: Viewport = {
  themeColor: '#b91c1c',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-slate-950 antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <BottomNavigation />
          <InstallAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
