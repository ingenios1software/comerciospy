"use client";

import { BadgePercent } from 'lucide-react';
import { useState } from 'react';
import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';
import type { Publicacion } from '@/types';
import { formatPrice } from '@/lib/utils/format';

export function PublicacionCard({ publicacion }: { publicacion: Publicacion }) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const mediaUrl = publicacion.mediaUrl || publicacion.imagenUrl;
  const isVideo = publicacion.mediaType === 'video' && Boolean(mediaUrl);
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
        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
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
        </div>
      </article>
      <ImageLightbox images={imageItems} activeIndex={activeImageIndex} onChange={setActiveImageIndex} onClose={() => setActiveImageIndex(null)} />
    </>
  );
}
