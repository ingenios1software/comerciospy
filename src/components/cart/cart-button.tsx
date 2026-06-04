"use client";

import { ShoppingCart } from 'lucide-react';
import { useCart, type CartItem } from '@/lib/cart';

type CartButtonProps = {
  item: Omit<CartItem, 'savedAt'>;
  compact?: boolean;
  className?: string;
};

export function CartButton({ item, compact = false, className = '' }: CartButtonProps) {
  const { hasItem, add } = useCart();
  const active = hasItem(item.id);

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
      className={`inline-flex items-center justify-center gap-1 rounded-md font-semibold shadow-sm ring-1 transition active:scale-[0.98] ${
        active
          ? 'bg-slate-950 text-white ring-slate-950 hover:bg-slate-800'
          : 'bg-white/95 text-slate-700 ring-slate-200 hover:bg-slate-50 hover:text-slate-950'
      } ${compact ? 'h-8 w-8 text-[11px]' : 'h-8 px-2 text-[11px]'} ${className}`}
    >
      <ShoppingCart className="h-3.5 w-3.5" />
      {compact ? null : <span>{active ? 'En carrito' : 'Carrito'}</span>}
    </button>
  );
}
