"use client";

import { Heart } from 'lucide-react';
import { useFavorites, type FavoriteItem } from '@/lib/favorites';

type FavoriteButtonProps = {
  item: Omit<FavoriteItem, 'savedAt'>;
  label?: string;
  compact?: boolean;
  className?: string;
};

export function FavoriteButton({ item, label = 'Me gusta', compact = false, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(item.kind, item.id);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(item);
      }}
      aria-pressed={active}
      aria-label={active ? `Quitar de favoritos: ${item.title}` : `Guardar favorito: ${item.title}`}
      title={active ? 'Quitar de favoritos' : label}
      className={`inline-flex items-center justify-center gap-1 rounded-md font-semibold shadow-sm ring-1 transition active:scale-[0.98] ${
        active
          ? 'bg-red-50 text-accent ring-red-100 hover:bg-red-100'
          : 'bg-white/95 text-slate-700 ring-slate-200 hover:bg-slate-50 hover:text-accent'
      } ${compact ? 'h-8 w-8 text-[11px]' : 'h-8 px-2 text-[11px]'} ${className}`}
    >
      <Heart className={`h-3.5 w-3.5 ${active ? 'fill-current' : ''}`} />
      {compact ? null : <span>{active ? 'Guardado' : label}</span>}
    </button>
  );
}
