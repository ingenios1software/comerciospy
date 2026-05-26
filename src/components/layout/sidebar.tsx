"use client";

import Link from 'next/link';
import { LayoutDashboard, LogOut, Map, PlusCircle, Store, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';

const sidebarItems = [
  { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Publicar', href: '/publicar', icon: PlusCircle },
  { label: 'Mi comercio', href: '/perfil', icon: Store },
  { label: 'Mapa', href: '/mapa', icon: Map }
];

export function Sidebar() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Panel</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">ComerciosPY</h2>
          {user ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4" />
              <span className="truncate">{profile?.nombre ?? user.email}</span>
            </div>
          ) : loading ? (
            <p className="mt-2 text-sm text-slate-500">Cargando sesion...</p>
          ) : null}
        </div>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        ) : null}
      </div>
    </aside>
  );
}
