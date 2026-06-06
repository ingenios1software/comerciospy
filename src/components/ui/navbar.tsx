"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, LayoutDashboard, LogIn, LogOut, MessageCircle, Search, ShoppingCart, Store, UserRound } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { useCart } from '@/lib/cart';
import { ShareAppButton } from './share-app-button';
import { developerBrand } from '@/lib/brand';

export function Navbar() {
  const { user, profile, loading, logout } = useAuth();
  const { items: cartItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const cartCount = cartItems.length;
  const cartCountLabel = cartCount > 99 ? '99+' : String(cartCount);
  const isCommerce = profile?.rol === 'comercio';
  const isAdmin = profile?.rol === 'superadmin';
  const accountStatus = loading
    ? 'Comprobando cuenta...'
    : isCommerce
      ? 'Conectado como comercio'
      : isAdmin
        ? 'Conectado como administrador'
        : user
          ? 'No conectado como comercio'
          : 'No conectado como comercio';
  const accountDetail = loading
    ? 'Un momento'
    : user
      ? profile?.nombre || user.displayName || user.email || 'Cuenta iniciada'
      : 'Inicia sesion para administrar un comercio';
  const accountHref = isAdmin ? '/admin' : isCommerce ? '/dashboard' : user ? '/perfil' : '/login';
  const accountAction = isAdmin ? 'Abrir administracion' : isCommerce ? 'Abrir panel' : user ? 'Ver mi perfil' : 'Iniciar sesion';
  const AccountActionIcon = isAdmin || isCommerce ? LayoutDashboard : LogIn;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

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
    ? profile?.rol === 'superadmin'
      ? [
          { label: 'Inicio', href: '/' },
          { label: 'Guia', href: '/comercios' },
          { label: 'Carrito', href: '/carrito' },
          { label: 'Panel', href: '/admin' }
        ]
      : [
        { label: 'Inicio', href: '/' },
        { label: 'Guia', href: '/comercios' },
        { label: 'Favoritos', href: '/favoritos' },
        { label: 'Carrito', href: '/carrito' },
        { label: 'Panel', href: '/dashboard' }
      ]
    : [
        { label: 'Inicio', href: '/' },
        { label: 'Buscar gratis', href: '/comercios' },
        { label: 'Favoritos', href: '/favoritos' },
        { label: 'Carrito', href: '/carrito' },
        { label: 'Planes', href: '/planes' }
      ];
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 top-0 z-20 border-b border-red-900/10 bg-accent text-white shadow-[0_10px_24px_rgba(127,29,29,0.18)]">
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center gap-1.5">
            <Link href="/" className="inline-flex shrink-0 items-center gap-2 text-sm font-black leading-none">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[13px] font-black text-accent">CP</span>
              <span className="leading-3">
                ComerciosPY
                <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-red-100">by {developerBrand}</span>
              </span>
            </Link>
            <ShareAppButton compact inverted />
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((current) => !current)}
                aria-expanded={accountOpen}
                aria-label="Ver estado de cuenta"
                title="Estado de cuenta"
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25"
              >
                <UserRound className="h-4 w-4" />
                <span
                  className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-accent ${
                    loading ? 'bg-amber-300' : isCommerce || isAdmin ? 'bg-emerald-400' : user ? 'bg-amber-300' : 'bg-slate-300'
                  }`}
                />
              </button>

              {accountOpen ? (
                <div className="fixed left-3 right-3 top-[50px] z-50 rounded-md border border-slate-200 bg-white p-3 text-slate-950 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-[290px]">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      isCommerce || isAdmin ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isCommerce || isAdmin ? <CheckCircle2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-slate-950">{accountStatus}</p>
                      <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{accountDetail}</p>
                    </div>
                  </div>
                  <Link
                    href={accountHref}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-[11px] font-bold text-white transition hover:bg-slate-800"
                  >
                    <AccountActionIcon className="h-3.5 w-3.5" />
                    {accountAction}
                  </Link>
                  {!isCommerce && !isAdmin ? (
                    <Link
                      href="/planes"
                      className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-red-50 px-3 text-[11px] font-bold text-accent ring-1 ring-red-100 transition hover:bg-red-100"
                    >
                      <Store className="h-3.5 w-3.5" />
                      Quiero ser comercio
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 sm:block">
            <label htmlFor="nav-search" className="sr-only">Buscar comercios</label>
            <div className="flex h-8 overflow-hidden rounded-md bg-white shadow-sm">
              <input
                id="nav-search"
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Buscar ciudad, categoria, grupo, negocio, contacto o articulo"
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
                <Link
                  href="/planes"
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-white px-2.5 text-[11px] font-bold text-accent transition hover:bg-red-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Quiero aparecer
                </Link>
                <Link href="/carrito" className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-white transition hover:bg-white/25" aria-label="Abrir carrito">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {cartCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black leading-none text-accent ring-1 ring-red-100">
                      {cartCountLabel}
                    </span>
                  ) : null}
                </Link>
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
                <span className="inline-flex items-center gap-1">
                  {item.label}
                  {item.href === '/carrito' && cartCount > 0 ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black leading-none text-accent ring-1 ring-red-100">
                      {cartCountLabel}
                    </span>
                  ) : null}
                </span>
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
