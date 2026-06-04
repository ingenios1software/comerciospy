"use client";

import { useEffect, useMemo, useState } from 'react';

export type FavoriteKind = 'comercio' | 'publicacion';

export type FavoriteItem = {
  kind: FavoriteKind;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string;
  savedAt: string;
};

const favoritesStorageKey = 'comerciospy:favorites:v1';
const favoritesChangedEvent = 'comerciospy:favorites-changed';

export function getFavoriteKey(kind: FavoriteKind, id: string) {
  return `${kind}:${id}`;
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function readFavorites(): FavoriteItem[] {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(favoritesStorageKey);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is FavoriteItem => {
      return (
        item &&
        (item.kind === 'comercio' || item.kind === 'publicacion') &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.href === 'string' &&
        typeof item.savedAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(favoritesStorageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(favoritesChangedEvent));
}

export function toggleFavorite(item: Omit<FavoriteItem, 'savedAt'>) {
  const favorites = readFavorites();
  const key = getFavoriteKey(item.kind, item.id);
  const exists = favorites.some((favorite) => getFavoriteKey(favorite.kind, favorite.id) === key);
  const nextFavorites = exists
    ? favorites.filter((favorite) => getFavoriteKey(favorite.kind, favorite.id) !== key)
    : [{ ...item, savedAt: new Date().toISOString() }, ...favorites].slice(0, 80);

  writeFavorites(nextFavorites);
  return !exists;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const syncFavorites = () => setFavorites(readFavorites());

    syncFavorites();
    window.addEventListener('storage', syncFavorites);
    window.addEventListener(favoritesChangedEvent, syncFavorites);

    return () => {
      window.removeEventListener('storage', syncFavorites);
      window.removeEventListener(favoritesChangedEvent, syncFavorites);
    };
  }, []);

  const favoriteKeys = useMemo(() => new Set(favorites.map((item) => getFavoriteKey(item.kind, item.id))), [favorites]);

  return {
    favorites,
    favoriteKeys,
    isFavorite: (kind: FavoriteKind, id: string) => favoriteKeys.has(getFavoriteKey(kind, id)),
    toggle: toggleFavorite
  };
}
