"use client";

import Link from 'next/link';
import { LogOut, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { adminContactMessage, adminWhatsapp } from '@/lib/admin-contact';
import { buildWhatsappUrl } from '@/lib/utils/format';
import { ShareAppButton } from './share-app-button';
import { developerBrand } from '@/lib/brand';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navItems = loading
    ? []
    : user
    ? [
        { label: 'Inicio', href: '/' },
        { label: 'Guia', href: '/comercios' },
        { label: 'Panel', href: '/dashboard' }
      ]
    : [
        { label: 'Inicio', href: '/' },
        { label: 'Buscar gratis', href: '/comercios' },
        { label: 'Panel comercio', href: '/login' }
      ];

  return (
    <nav className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-slate-950">
          ComerciosPY <span className="hidden text-xs font-medium text-slate-500 sm:inline">by {developerBrand}</span>
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <ShareAppButton />
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </>
          ) : (
            <>
              <ShareAppButton />
              <a
                href={buildWhatsappUrl(adminWhatsapp, adminContactMessage)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Quiero aparecer
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
