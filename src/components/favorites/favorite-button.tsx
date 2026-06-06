"use client";

import { Heart } from 'lucide-react';
import { useFavorites, type FavoriteItem } from '@/lib/favorites';

type FavoriteButtonProps = {
  item: Omit<FavoriteItem, 'savedAt'>;
  label?: string;
  compact?: boolean;
  minimal?: boolean;
  className?: string;
  onFavoriteAdded?: () => void;
};

export function FavoriteButton({ item, label = 'Me gusta', compact = false, minimal = false, className = '', onFavoriteAdded }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(item.kind, item.id);
  const appearance = minimal
    ? active
      ? 'bg-transparent text-red-400 hover:text-red-300'
      : 'bg-transparent text-white hover:text-red-200'
    : active
      ? 'bg-red-50 text-accent ring-1 ring-red-100 hover:bg-red-100'
      : 'bg-white/95 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-accent';

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const added = toggle(item);
        if (added) onFavoriteAdded?.();
      }}
      aria-pressed={active}
      aria-label={active ? `Quitar de favoritos: ${item.title}` : `Guardar favorito: ${item.title}`}
      title={active ? 'Quitar de favoritos' : label}
      className={`inline-flex items-center justify-center gap-1 rounded-md font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.96] ${appearance} ${
        minimal ? 'h-8 w-8' : compact ? 'h-8 w-8 text-[11px]' : 'h-8 px-2 text-[11px]'
      } ${className}`}
    >
      <Heart className={`${minimal ? 'h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(15,23,42,0.95)]' : 'h-3.5 w-3.5'} ${active ? 'fill-current' : ''}`} />
      {compact || minimal ? null : <span>{active ? 'Guardado' : label}</span>}
    </button>
  );
}
