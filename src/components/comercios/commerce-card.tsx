"use client";

import Link from 'next/link';
import { ArrowUpRight, Clock, Images, MapPin, MessageCircle, Phone, ShieldCheck, Star, Store } from 'lucide-react';
import type { Comercio, CommercePreview, Publicacion } from '@/types';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { formatPublicationPrice, getPublicationCode, getPublicationMediaUrl } from '@/lib/publications';
import { trackCommerceMetric } from '@/lib/firebase/firestore';
import { buildMapsUrl, buildWhatsappUrl, cleanPhone } from '@/lib/utils/format';

type CommerceCardProps = {
  comercio: CommercePreview | (Comercio & { imagen?: string });
  publicaciones?: Publicacion[];
};

function getMainImage(comercio: CommerceCardProps['comercio']) {
  if ('imagen' in comercio && comercio.imagen) return comercio.imagen;
  if ('portadaUrl' in comercio && comercio.portadaUrl) return comercio.portadaUrl;
  if ('logoUrl' in comercio && comercio.logoUrl) return comercio.logoUrl;
  return '';
}

function getPhotos(comercio: CommerceCardProps['comercio']) {
  const mainImage = getMainImage(comercio);
  const photos = 'fotos' in comercio && comercio.fotos?.length ? comercio.fotos : [];
  return [mainImage, ...photos].filter(Boolean).slice(0, 3);
}

function getDateValue(value?: string) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function CommerceCard({ comercio, publicaciones = [] }: CommerceCardProps) {
  const photos = getPhotos(comercio);
  const telefono = comercio.telefono ?? comercio.whatsapp;
  const horario = 'horario' in comercio ? comercio.horario : undefined;
  const whatsappUrl = buildWhatsappUrl(comercio.whatsapp, `Hola, vi ${comercio.nombre} en ComerciosPY y quiero consultar.`);
  const mapsUrl = buildMapsUrl(comercio);
  const telUrl = cleanPhone(telefono) ? `tel:${cleanPhone(telefono)}` : '#';
  const mainImage = getMainImage(comercio);
  const latestPublicaciones = [...publicaciones].sort((a, b) => getDateValue(b.creadoEn) - getDateValue(a.creadoEn)).slice(0, 3);
  const latestPublication = latestPublicaciones[0];
  const latestPublicationPrice = latestPublication ? formatPublicationPrice(latestPublication) : '';
  const ratingValue = comercio.valoracion?.promedio;
  const hasRating = Number.isFinite(ratingValue);
  const isVerified = Boolean(comercio.verificado);
  const publicationImages = latestPublicaciones
    .map((publicacion) => ({
      url: getPublicationMediaUrl(publicacion),
      title: publicacion.titulo,
      code: getPublicationCode(publicacion)
    }))
    .filter((item) => Boolean(item.url));

  return (
    <article className="h-full rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft">
      <div className="grid h-full grid-cols-[74px_1fr] gap-2">
        <div className="relative h-[74px] overflow-hidden rounded-md bg-slate-100">
          <Link href={`/comercios/${comercio.id}`} className="group block h-full">
            {mainImage ? (
              <img src={mainImage} alt={comercio.nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                <Store className="h-5 w-5" />
              </div>
            )}
            <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
              <Images className="h-3 w-3" />
              {photos.length}
            </span>
          </Link>
          <FavoriteButton
            compact
            item={{
              kind: 'comercio',
              id: comercio.id,
              title: comercio.nombre,
              subtitle: `${comercio.rubro} - ${comercio.ciudad}`,
              href: `/comercios/${comercio.id}`,
              imageUrl: mainImage
            }}
            className="absolute right-1 top-1"
            onFavoriteAdded={() => void trackCommerceMetric(comercio.id, 'favoritos')}
          />
        </div>

        <div className="min-w-0 self-start">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="max-w-[58%] truncate rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-accent ring-1 ring-red-100">{comercio.categoria}</span>
            <span className="min-w-0 truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{comercio.ciudad}</span>
          </div>
          <Link href={`/comercios/${comercio.id}`} className="mt-1 block">
            <h3 className="truncate text-[15px] font-semibold leading-5 text-slate-950">{comercio.nombre}</h3>
            <p className="truncate text-xs font-medium text-slate-600">{comercio.rubro}</p>
          </Link>
          {hasRating || isVerified ? (
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold">
              {hasRating ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 ring-1 ring-amber-100">
                  <Star className="h-3 w-3 fill-current" />
                  {ratingValue?.toFixed(1)}
                </span>
              ) : null}
              {isVerified ? (
                <span className="inline-flex min-w-0 items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 ring-1 ring-emerald-100">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span className="truncate">Verificado</span>
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="mt-1 space-y-0.5">
            {latestPublication ? (
              <p className="truncate text-[11px] font-semibold text-slate-700">
                Ultimo: {latestPublication.titulo}{latestPublicationPrice ? ` - ${latestPublicationPrice}` : ''}
              </p>
            ) : (
              <p className="truncate text-[11px] text-slate-500">{comercio.direccion ?? 'Ubicacion disponible por WhatsApp'}</p>
            )}
            {horario ? (
              <p className="flex min-w-0 items-center gap-1 truncate text-[11px] font-medium text-slate-600">
                <Clock className="h-3 w-3 shrink-0 text-accent" />
                <span className="truncate">{horario}</span>
              </p>
            ) : null}
          </div>
        </div>

        {publicationImages.length > 0 ? (
          <Link href={`/comercios/${comercio.id}#publicaciones`} className="col-span-2 grid grid-cols-3 gap-1">
            {publicationImages.map((item) => (
              <span key={`${item.url}-${item.code}`} className="relative aspect-[5/3] overflow-hidden rounded-md bg-slate-100">
                <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
                <span className="absolute bottom-1 left-1 rounded bg-white/95 px-1 text-[9px] font-black text-slate-700 shadow-sm">#{item.code}</span>
              </span>
            ))}
          </Link>
        ) : null}

        <div className="col-span-2 mt-1 grid grid-cols-4 gap-1.5">
          <a href={telUrl} onClick={() => void trackCommerceMetric(comercio.id, 'clicsLlamar')} className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]" aria-label={`Llamar a ${comercio.nombre}`}>
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden min-[360px]:inline">Llamar</span>
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => void trackCommerceMetric(comercio.id, 'clicsWhatsapp')} className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]" aria-label={`WhatsApp de ${comercio.nombre}`}>
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </a>
          <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => void trackCommerceMetric(comercio.id, 'clicsMapa')} className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]" aria-label={`Ubicacion de ${comercio.nombre}`}>
            <MapPin className="h-3.5 w-3.5" />
            Mapa
          </a>
          <Link href={`/comercios/${comercio.id}`} className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-slate-950 px-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]" aria-label={`Ver ficha de ${comercio.nombre}`}>
            Ver
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
