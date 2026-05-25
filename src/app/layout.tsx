import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Navbar } from '@/components/ui/navbar';
import { BottomNavigation } from '@/components/layout/bottom-navigation';

export const metadata: Metadata = {
  title: 'ComerciosPY',
  description: 'Marketplace móvil para comercios y publicaciones locales.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <BottomNavigation />
        </AuthProvider>
      </body>
    </html>
  );
}
