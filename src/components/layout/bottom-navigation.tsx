"use client";

import Link from 'next/link';
import { CreditCard, Heart, Home, List, LogOut, PlusCircle, ShoppingCart, Store, User, Users } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { useCart } from '@/lib/cart';

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
};

export function BottomNavigation() {
  const { user, profile, loading, logout } = useAuth();
  const { items: cartItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = cartItems.length;
  const cartCountLabel = cartCount > 99 ? '99+' : String(cartCount);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const items: NavigationItem[] = loading
    ? [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Guia', href: '/comercios', icon: List },
        { label: 'Favoritos', href: '/favoritos', icon: Heart },
        { label: 'Carrito', href: '/carrito', icon: ShoppingCart }
      ]
    : user && profile?.rol === 'superadmin'
    ? [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Guia', href: '/comercios', icon: List },
        { label: 'Panel', href: '/admin', icon: User },
        { label: 'Planes', href: '/admin/planes', icon: CreditCard },
        { label: 'Usuarios', href: '/admin/usuarios', icon: Users }
      ]
    : user
    ? [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Guia', href: '/comercios', icon: List },
        { label: 'Favoritos', href: '/favoritos', icon: Heart },
        { label: 'Publicar', href: '/publicar', icon: PlusCircle },
        { label: 'Perfil', href: '/perfil', icon: User }
      ]
    : [
        { label: 'Inicio', href: '/', icon: Home },
        { label: 'Buscar', href: '/comercios', icon: List },
        { label: 'Favoritos', href: '/favoritos', icon: Heart },
        { label: 'Carrito', href: '/carrito', icon: ShoppingCart },
        { label: 'Planes', href: '/planes', icon: Store }
      ];
  const showLogout = !loading && Boolean(user);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                active ? 'bg-slate-950 text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <span className="relative">
                <Icon className="h-4 w-4" />
                {item.href === '/carrito' && cartCount > 0 ? (
                  <span className={`absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black leading-none ring-1 ${
                    active ? 'bg-white text-slate-950 ring-white' : 'bg-accent text-white ring-red-100'
                  }`}>
                    {cartCountLabel}
                  </span>
                ) : null}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {showLogout ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <LogOut className="h-4 w-4" />
            <span className="truncate">Salir</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}
