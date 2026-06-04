"use client";

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { LogOut, MessageCircle, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { adminContactMessage, adminWhatsapp } from '@/lib/admin-contact';
import { buildWhatsappUrl } from '@/lib/utils/format';
import { ShareAppButton } from './share-app-button';
import { developerBrand } from '@/lib/brand';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    router.push(query ? `/comercios?search=${encodeURIComponent(query)}` : '/comercios');
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
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 top-0 z-20 border-b border-red-900/10 bg-accent text-white shadow-[0_10px_24px_rgba(127,29,29,0.18)]">
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex shrink-0 items-center gap-2 text-sm font-black leading-none">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[13px] font-black text-accent">CP</span>
            <span className="leading-3">
              ComerciosPY
              <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-red-100">by {developerBrand}</span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 sm:block">
            <label htmlFor="nav-search" className="sr-only">Buscar comercios</label>
            <div className="flex h-8 overflow-hidden rounded-md bg-white shadow-sm">
              <input
                id="nav-search"
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Buscar comercios, servicios y ciudades"
                className="min-w-0 flex-1 px-3 text-[12px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="flex w-10 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Buscar">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="ml-auto hidden items-center gap-1.5 sm:flex">
            {user ? (
              <>
                <ShareAppButton />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-white/15 px-2.5 text-[11px] font-semibold transition hover:bg-white/25"
                >
                  <LogOut className="h-3.5 w-3.5" />
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
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-white px-2.5 text-[11px] font-bold text-accent transition hover:bg-red-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Quiero aparecer
                </a>
              </>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold">
          <div className="flex min-w-0 items-center gap-3 overflow-x-auto whitespace-nowrap pb-0.5 scrollbar-none">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`transition ${
                  isActive(item.href)
                    ? 'text-white underline decoration-white/70 underline-offset-4'
                    : 'text-red-50 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/comercios" className="shrink-0 text-red-50 transition hover:text-white sm:hidden">
            Buscar
          </Link>
        </div>
      </div>
    </nav>
  );
}
