"use client";

import { useEffect, useMemo, useState } from 'react';

export type CartItem = {
  id: string;
  code: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string;
  price?: number | null;
  comercioId: string;
  comercioNombre?: string;
  whatsapp?: string | null;
  telefono?: string | null;
  savedAt: string;
};

const cartStorageKey = 'comerciospy:cart:v1';
const cartChangedEvent = 'comerciospy:cart-changed';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function readCart(): CartItem[] {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(cartStorageKey);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is CartItem => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.code === 'string' &&
        typeof item.title === 'string' &&
        typeof item.href === 'string' &&
        typeof item.comercioId === 'string' &&
        typeof item.savedAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(cartChangedEvent));
}

export function addCartItem(item: Omit<CartItem, 'savedAt'>) {
  const cart = readCart();
  const exists = cart.some((cartItem) => cartItem.id === item.id);
  const nextCart = exists ? cart : [{ ...item, savedAt: new Date().toISOString() }, ...cart].slice(0, 80);
  writeCart(nextCart);
  return !exists;
}

export function removeCartItem(id: string) {
  writeCart(readCart().filter((item) => item.id !== id));
}

export function clearCart() {
  writeCart([]);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const syncCart = () => setItems(readCart());

    syncCart();
    window.addEventListener('storage', syncCart);
    window.addEventListener(cartChangedEvent, syncCart);

    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener(cartChangedEvent, syncCart);
    };
  }, []);

  const itemIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  return {
    items,
    itemIds,
    hasItem: (id: string) => itemIds.has(id),
    add: addCartItem,
    remove: removeCartItem,
    clear: clearCart
  };
}
