"use client";

import Link from 'next/link';
import { Home, List, PlusCircle, Store, User, Users } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';

export function BottomNavigation() {
  const { user, profile, loading } = useAuth();

  const items = loading
    ? [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Guia', href: '/comercios', icon: List }
      ]
    : user && profile?.rol === 'superadmin'
    ? [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Guia', href: '/comercios', icon: List },
        { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
        { label: 'Panel', href: '/dashboard', icon: User }
      ]
    : user
    ? [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Guia', href: '/comercios', icon: List },
        { label: 'Publicar', href: '/publicar', icon: PlusCircle },
        { label: 'Perfil', href: '/perfil', icon: User }
      ]
    : [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Buscar', href: '/comercios', icon: List },
        { label: 'Comercio', href: '/login', icon: Store }
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
