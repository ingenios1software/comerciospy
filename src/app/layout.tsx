import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Navbar } from '@/components/ui/navbar';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { VisitorVoiceAssistant } from '@/components/assistant/visitor-voice-assistant';
import { BrandFooter } from '@/components/layout/brand-footer';
import { developerBrand } from '@/lib/brand';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://comerciospy.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'ComerciosPY',
  description: `Guia moderna de comercios, servicios y contactos locales por WhatsApp. Desarrollada por ${developerBrand}.`,
  applicationName: 'ComerciosPY',
  authors: [{ name: developerBrand }],
  creator: developerBrand,
  publisher: developerBrand,
  openGraph: {
    title: 'ComerciosPY',
    description: `Busca gratis comercios, servicios y contactos por ciudad. Desarrollada por ${developerBrand}.`,
    url: appUrl,
    siteName: 'ComerciosPY',
    type: 'website',
    locale: 'es_PY'
  },
  twitter: {
    card: 'summary',
    title: 'ComerciosPY',
    description: `Busca gratis comercios, servicios y contactos por ciudad. Desarrollada por ${developerBrand}.`
  },
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
          <BrandFooter />
          <BottomNavigation />
          <VisitorVoiceAssistant />
          <InstallAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
