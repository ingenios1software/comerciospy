"use client";

import { BadgePercent, CheckCircle2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';
import type { Comercio, Publicacion } from '@/types';
import { buildWhatsappUrl, formatPrice } from '@/lib/utils/format';

type PublicacionCardProps = {
  publicacion: Publicacion;
  comercio?: Pick<Comercio, 'id' | 'nombre' | 'whatsapp' | 'telefono'> | null;
  onMarkSold?: (publicacion: Publicacion) => void | Promise<void>;
  markingSold?: boolean;
};

export function PublicacionCard({ publicacion, comercio, onMarkSold, markingSold = false }: PublicacionCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const mediaUrl = publicacion.mediaUrl || publicacion.imagenUrl;
  const isVideo = publicacion.mediaType === 'video' && Boolean(mediaUrl);
  const whatsappUrl = buildWhatsappUrl(
    comercio?.whatsapp || comercio?.telefono,
    `Hola, vi "${publicacion.titulo}" en ComerciosPY y quiero este articulo.`
  );
  const imageItems: LightboxImage[] = !isVideo && mediaUrl
    ? [
        {
          src: mediaUrl,
          alt: publicacion.titulo
        }
      ]
    : [];

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-glow">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {isVideo ? (
            <video src={mediaUrl} className="h-full w-full bg-black object-cover" controls muted playsInline preload="metadata" />
          ) : mediaUrl ? (
            <button
              type="button"
              onClick={() => setActiveImageIndex(0)}
              className="group h-full w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
              aria-label={`Ampliar imagen de ${publicacion.titulo}`}
            >
              <img src={mediaUrl} alt={publicacion.titulo} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </button>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
                <BadgePercent className="h-6 w-6" />
              </div>
            </div>
          )}
          <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-2">
            <FavoriteButton
              item={{
                kind: 'publicacion',
                id: publicacion.id,
                title: publicacion.titulo,
                subtitle: `${publicacion.tipo} - ${publicacion.ciudad}`,
                href: `/comercios/${publicacion.comercioId}#publicaciones`,
                imageUrl: mediaUrl
              }}
            />
            {whatsappUrl !== '#' ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 text-[11px] font-semibold text-white shadow-sm ring-1 ring-emerald-500/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                aria-label={`Consultar por ${publicacion.titulo} en WhatsApp`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Lo quiero
              </a>
            ) : null}
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold">
            <span className="rounded-full bg-red-50 px-2.5 py-1 uppercase tracking-[0.14em] text-accent ring-1 ring-red-100">{publicacion.tipo}</span>
            <span className="truncate text-slate-500">{publicacion.ciudad}</span>
          </div>
          <div>
            <h3 className="line-clamp-2 text-base font-semibold text-slate-950">{publicacion.titulo}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{publicacion.descripcion}</p>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{formatPrice(publicacion.precio)}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{publicacion.categoria}</span>
          </div>
          {onMarkSold ? (
            <button
              type="button"
              onClick={() => onMarkSold(publicacion)}
              disabled={markingSold}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              {markingSold ? 'Marcando...' : 'Vendido'}
            </button>
          ) : null}
        </div>
      </article>
      <ImageLightbox images={imageItems} activeIndex={activeImageIndex} onChange={setActiveImageIndex} onClose={() => setActiveImageIndex(null)} />
    </>
  );
}
