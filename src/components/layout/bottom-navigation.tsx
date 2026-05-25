"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';

export function BottomNavigation() {
  const { user, loading } = useAuth();

  const items = loading
    ? [
        { label: 'Inicio', href: '/' },
        { label: 'Comercios', href: '/comercios' }
      ]
    : user
    ? [
        { label: 'Inicio', href: '/' },
        { label: 'Comercios', href: '/comercios' },
        { label: 'Publicar', href: '/publicar' },
        { label: 'Perfil', href: '/perfil' }
      ]
    : [
        { label: 'Inicio', href: '/' },
        { label: 'Comercios', href: '/comercios' },
        { label: 'Login', href: '/login' }
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/80 bg-slate-950/95 px-4 py-3 backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-3xl px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
