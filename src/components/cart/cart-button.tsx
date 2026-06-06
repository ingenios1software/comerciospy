"use client";

import { ShoppingCart } from 'lucide-react';
import { useCart, type CartItem } from '@/lib/cart';

type CartButtonProps = {
  item: Omit<CartItem, 'savedAt'>;
  compact?: boolean;
  minimal?: boolean;
  className?: string;
};

export function CartButton({ item, compact = false, minimal = false, className = '' }: CartButtonProps) {
  const { hasItem, add } = useCart();
  const active = hasItem(item.id);
  const appearance = minimal
    ? active
      ? 'bg-transparent text-amber-300 hover:text-amber-200'
      : 'bg-transparent text-white hover:text-amber-200'
    : active
      ? 'bg-slate-950 text-white ring-1 ring-slate-950 hover:bg-slate-800'
      : 'bg-white/95 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-950';

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add(item);
      }}
      aria-pressed={active}
      aria-label={active ? `Articulo ya esta en el carrito: ${item.title}` : `Agregar al carrito: ${item.title}`}
      title={active ? 'Ya esta en el carrito' : 'Agregar al carrito'}
      className={`inline-flex items-center justify-center gap-1 rounded-md font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.96] ${appearance} ${
        minimal ? 'h-8 w-8' : compact ? 'h-8 w-8 text-[11px]' : 'h-8 px-2 text-[11px]'
      } ${className}`}
    >
      <ShoppingCart className={minimal ? 'h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(15,23,42,0.95)]' : 'h-3.5 w-3.5'} />
      {compact || minimal ? null : <span>{active ? 'En carrito' : 'Carrito'}</span>}
    </button>
  );
}
