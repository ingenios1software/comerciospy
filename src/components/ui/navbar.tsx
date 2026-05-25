"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';

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
        { label: 'Comercios', href: '/comercios' },
        { label: 'Dashboard', href: '/dashboard' }
      ]
    : [
        { label: 'Inicio', href: '/' },
        { label: 'Comercios', href: '/comercios' },
        { label: 'Login', href: '/login' }
      ];

  return (
    <nav className="fixed inset-x-0 top-0 z-20 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-slate-50">
          ComerciosPY
        </Link>
        <div className="hidden items-center gap-3 sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
              {item.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
