import Link from 'next/link';
import { ArrowUpRight, Clock, Images, MapPin, MessageCircle, Phone, Store } from 'lucide-react';
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
  const mainImage = getMainImage(comercio);

  return (
    <article className="h-full rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft">
      <div className="grid h-full grid-cols-[74px_1fr] gap-2">
        <Link href={`/comercios/${comercio.id}`} className="group relative h-[74px] overflow-hidden rounded-md bg-slate-100">
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

        <div className="min-w-0 self-start">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="max-w-[58%] truncate rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-accent ring-1 ring-red-100">{comercio.categoria}</span>
            <span className="min-w-0 truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{comercio.ciudad}</span>
          </div>
          <Link href={`/comercios/${comercio.id}`} className="mt-1 block">
            <h3 className="truncate text-[15px] font-semibold leading-5 text-slate-950">{comercio.nombre}</h3>
            <p className="truncate text-xs font-medium text-slate-600">{comercio.rubro}</p>
          </Link>
          <div className="mt-1 space-y-0.5">
            <p className="truncate text-[11px] text-slate-500">{comercio.direccion ?? 'Ubicacion disponible por WhatsApp'}</p>
            {horario ? (
              <p className="flex min-w-0 items-center gap-1 truncate text-[11px] font-medium text-slate-600">
                <Clock className="h-3 w-3 shrink-0 text-accent" />
                <span className="truncate">{horario}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="col-span-2 mt-1 grid grid-cols-4 gap-1.5">
          <a href={telUrl} className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]" aria-label={`Llamar a ${comercio.nombre}`}>
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden min-[360px]:inline">Llamar</span>
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]" aria-label={`WhatsApp de ${comercio.nombre}`}>
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </a>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]" aria-label={`Ubicacion de ${comercio.nombre}`}>
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
