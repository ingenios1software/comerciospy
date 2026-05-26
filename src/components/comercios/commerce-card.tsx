import Link from 'next/link';
import { ArrowUpRight, Clock, Images, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Comercio, CommercePreview } from '@/types';
import { buildMapsUrl, buildWhatsappUrl, cleanPhone } from '@/lib/utils/format';

type CommerceCardProps = {
  comercio: CommercePreview | (Comercio & { imagen?: string });
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

export function CommerceCard({ comercio }: CommerceCardProps) {
  const photos = getPhotos(comercio);
  const telefono = comercio.telefono ?? comercio.whatsapp;
  const horario = 'horario' in comercio ? comercio.horario : undefined;
  const whatsappUrl = buildWhatsappUrl(comercio.whatsapp, `Hola, vi ${comercio.nombre} en ComerciosPY y quiero consultar.`);
  const mapsUrl = buildMapsUrl(comercio);
  const telUrl = cleanPhone(telefono) ? `tel:${cleanPhone(telefono)}` : '#';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft transition hover:border-slate-300">
      <div className="grid grid-cols-[76px_1fr] gap-3 sm:grid-cols-[96px_1fr_auto] sm:items-center">
        <Link href={`/comercios/${comercio.id}`} className="group relative h-24 overflow-hidden rounded-xl bg-slate-100 sm:h-24">
          <img src={getMainImage(comercio)} alt={comercio.nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
            <Images className="h-3 w-3" />
            {photos.length}
          </span>
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-accent">{comercio.categoria}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{comercio.ciudad}</span>
          </div>
          <Link href={`/comercios/${comercio.id}`} className="mt-2 block">
            <h3 className="truncate text-lg font-semibold text-slate-950">{comercio.nombre}</h3>
            <p className="truncate text-sm text-slate-600">{comercio.rubro}</p>
          </Link>
          <div className="mt-2 space-y-1">
            <p className="truncate text-xs text-slate-500">{comercio.direccion ?? 'Ubicacion disponible por WhatsApp'}</p>
            {horario ? (
              <p className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-slate-600">
                <Clock className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate">{horario}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
            <a href={telUrl} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700" aria-label={`Llamar a ${comercio.nombre}`}>
              <Phone className="h-4 w-4" />
              Llamar
            </a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 text-xs font-semibold text-white" aria-label={`WhatsApp de ${comercio.nombre}`}>
              <MessageCircle className="h-4 w-4" />
              Chat
            </a>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-slate-950 text-xs font-semibold text-white" aria-label={`Ubicacion de ${comercio.nombre}`}>
              <MapPin className="h-4 w-4" />
              Mapa
            </a>
          </div>
        </div>

        <div className="col-span-2 hidden min-w-[190px] flex-col gap-2 sm:col-span-1 sm:flex">
          <a href={telUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <Phone className="h-4 w-4" />
            {telefono ?? 'Llamar'}
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <Link href={`/comercios/${comercio.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Ver
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
