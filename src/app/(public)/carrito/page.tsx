"use client";

import Link from 'next/link';
import { ArrowRight, MessageCircle, ShoppingCart, Trash2, X } from 'lucide-react';
import { useMemo } from 'react';
import { type CartItem, useCart } from '@/lib/cart';
import { buildWhatsappUrl, formatPrice } from '@/lib/utils/format';

function getAppOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://comerciospy.vercel.app';
}

function buildCartMessage(items: CartItem[]) {
  const origin = getAppOrigin();
  const lines = ['Hola, quiero consultar estos articulos que vi en ComerciosPY:'];

  items.forEach((item, index) => {
    lines.push('');
    lines.push(`${index + 1}. #${item.code} - ${item.title}`);
    if (item.price) lines.push(`Precio: ${formatPrice(item.price)}`);
    if (item.imageUrl) lines.push(`Foto: ${item.imageUrl}`);
    lines.push(`Ficha: ${origin}${item.href}`);
  });

  return lines.join('\n');
}

export default function CarritoPage() {
  const { items, remove, clear } = useCart();
  const groupedItems = useMemo(() => {
    return items.reduce((map, item) => {
      const current = map.get(item.comercioId) ?? [];
      current.push(item);
      map.set(item.comercioId, current);
      return map;
    }, new Map<string, CartItem[]>());
  }, [items]);
  const groups = Array.from(groupedItems.entries()).map(([comercioId, groupItems]) => ({
    comercioId,
    items: groupItems,
    comercioNombre: groupItems[0]?.comercioNombre ?? 'Comercio',
    phone: groupItems[0]?.whatsapp || groupItems[0]?.telefono
  }));

  return (
    <main className="min-h-screen bg-surface px-3 pb-24 pt-20 text-slate-950 sm:px-5">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                <ShoppingCart className="h-3.5 w-3.5" />
                Carrito
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Articulos para consultar</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">Guardados en este navegador. Cada pedido se envia por WhatsApp al comercio correspondiente.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Vaciar
                </button>
              ) : null}
              <Link href="/comercios" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800">
                Seguir mirando
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {items.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => {
              const whatsappUrl = buildWhatsappUrl(group.phone, buildCartMessage(group.items));

              return (
                <section key={group.comercioId} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">{group.comercioNombre}</h2>
                      <p className="text-xs font-semibold text-slate-500">{group.items.length} articulo{group.items.length === 1 ? '' : 's'}</p>
                    </div>
                    {whatsappUrl !== '#' ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar por WhatsApp
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <article key={item.id} className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)_32px] gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <Link href={item.href} className="aspect-square overflow-hidden rounded-md bg-slate-100">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
                        </Link>
                        <div className="min-w-0 py-0.5">
                          <p className="text-[10px] font-black text-accent">#{item.code}</p>
                          <Link href={item.href} className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                            {item.title}
                          </Link>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-600">{formatPrice(item.price) || item.subtitle || 'Consultar precio'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-accent"
                          aria-label={`Quitar ${item.title} del carrito`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
            <ShoppingCart className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-950">Tu carrito esta vacio</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Toca Carrito en un articulo para guardarlo antes de consultar.</p>
          </section>
        )}
      </div>
    </main>
  );
}
