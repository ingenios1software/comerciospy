"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';

const sidebarItems = [
  { label: 'Panel', href: '/dashboard' },
  { label: 'Publicar', href: '/publicar' },
  { label: 'Perfil', href: '/perfil' },
  { label: 'Mapa', href: '/mapa' }
];

export function Sidebar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-slate-800/70 bg-slate-950/95 p-4 lg:block">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50">ComerciosPY</h2>
          {user ? (
            <p className="mt-2 text-sm text-slate-400">Hola, {user.email}</p>
          ) : loading ? (
            <p className="mt-2 text-sm text-slate-400">Cargando sesión...</p>
          ) : null}
        </div>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-3xl px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-3xl bg-slate-800 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Cerrar sesión
          </button>
        ) : null}
      </div>
    </aside>
  );
}
