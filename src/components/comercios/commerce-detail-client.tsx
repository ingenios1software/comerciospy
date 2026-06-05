"use client";

import Link from 'next/link';
import { Clock, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getComercioById, getPublicationsByCommerce, trackCommerceMetric } from '@/lib/firebase/firestore';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import { DigitalBusinessCard } from '@/components/comercios/digital-business-card';
import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';
import { sampleComercios, samplePublicaciones } from '@/lib/mockData';
import { isCommercePubliclyVisible } from '@/lib/subscription';
import { buildMapsUrl, buildWhatsappUrl, cleanPhone } from '@/lib/utils/format';
import type { Comercio, Publicacion } from '@/types';

type CommerceDetailClientProps = {
  commerceId: string;
  initialComercio: Comercio | null;
  initialPublicaciones: Publicacion[];
};

export function CommerceDetailClient({ commerceId, initialComercio, initialPublicaciones }: CommerceDetailClientProps) {
  const [comercio, setComercio] = useState<Comercio | null>(initialComercio);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(initialPublicaciones);
  const [selectedPublicationCategory, setSelectedPublicationCategory] = useState('Todos');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialComercio);

  useEffect(() => {
    let active = true;

    const loadCommerce = async () => {
      if (!commerceId) return;

      if (!initialComercio) {
        setLoading(true);
      }

      try {
        const comercioItem = await getComercioById(commerceId);
        const fallback = sampleComercios.find((item) => item.id === commerceId) ?? null;
        const selectedCommerce = comercioItem
          ? isCommercePubliclyVisible(comercioItem)
            ? comercioItem
            : null
          : initialComercio ?? fallback;

        if (!active) return;

        setComercio(selectedCommerce);

        if (selectedCommerce) {
          const publicacionesData = await getPublicationsByCommerce(selectedCommerce.id);
          if (!active) return;
          setPublicaciones(
            publicacionesData.length > 0
              ? publicacionesData
              : initialPublicaciones.length > 0
                ? initialPublicaciones
                : samplePublicaciones.filter((item) => item.comercioId === selectedCommerce.id)
          );
        }
      } catch {
        if (!active) return;

        const fallback = sampleComercios.find((item) => item.id === commerceId) ?? initialComercio;
        setComercio(fallback);
        setPublicaciones(
          initialPublicaciones.length > 0
            ? initialPublicaciones
            : samplePublicaciones.filter((item) => item.comercioId === commerceId)
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCommerce();

    return () => {
      active = false;
    };
  }, [commerceId, initialComercio, initialPublicaciones]);

  const gallery = useMemo(() => {
    if (!comercio) return [];
    return [comercio.portadaUrl, ...(comercio.fotos ?? [])].filter(Boolean).slice(0, 6);
  }, [comercio]);

  const galleryItems = useMemo<LightboxImage[]>(() => {
    if (!comercio) return [];

    return gallery.map((image, index) => ({
      src: image,
      alt: index === 0 ? `${comercio.nombre} portada` : `${comercio.nombre} foto ${index + 1}`
    }));
  }, [comercio, gallery]);

  const publicationCategoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(publicaciones.map((publicacion) => publicacion.categoria).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );

    return ['Todos', ...uniqueCategories];
  }, [publicaciones]);

  useEffect(() => {
    if (selectedPublicationCategory !== 'Todos' && !publicationCategoryOptions.includes(selectedPublicationCategory)) {
      setSelectedPublicationCategory('Todos');
    }
  }, [publicationCategoryOptions, selectedPublicationCategory]);

  useEffect(() => {
    if (comercio?.id) {
      void trackCommerceMetric(comercio.id, 'visitasFicha');
    }
  }, [comercio?.id]);

  const visiblePublicaciones = useMemo(() => {
    if (selectedPublicationCategory === 'Todos') return publicaciones;
    return publicaciones.filter((publicacion) => publicacion.categoria === selectedPublicationCategory);
  }, [publicaciones, selectedPublicationCategory]);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-4xl py-24 text-center text-slate-500">Cargando comercio...</div>
      </main>
    );
  }

  if (!comercio) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-4xl py-24 text-center text-slate-500">No se encontro el comercio solicitado.</div>
      </main>
    );
  }

  const telefono = comercio.telefono ?? comercio.whatsapp;
  const telUrl = cleanPhone(telefono) ? `tel:${cleanPhone(telefono)}` : '#';
  const whatsappUrl = buildWhatsappUrl(comercio.whatsapp, `Hola, vi ${comercio.nombre} en ComerciosPY y quiero consultar.`);
  const mapsUrl = buildMapsUrl(comercio);

  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-glow">
          <div className="relative min-h-[320px] bg-slate-100">
            <button
              type="button"
              onClick={() => setActiveGalleryIndex(0)}
              className="absolute inset-0 h-full w-full cursor-zoom-in"
              aria-label={`Ampliar portada de ${comercio.nombre}`}
            >
              <img src={comercio.portadaUrl} alt={comercio.nombre} className="h-full w-full object-cover" />
            </button>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-950">{comercio.categoria}</span>
                <span className="rounded-full bg-slate-950/65 px-3 py-1 text-xs font-semibold text-white">{comercio.rubro}</span>
                {comercio.verificado ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verificado
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{comercio.nombre}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">{comercio.resumen ?? comercio.descripcion}</p>
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px] lg:p-6">
            <div className="order-2 space-y-6 lg:order-1">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Informacion</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{comercio.descripcion}</p>
              </div>

              {comercio.servicios?.length ? (
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Servicios</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {comercio.servicios.map((servicio) => (
                      <span key={servicio} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                        {servicio}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {gallery.length ? (
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Fotos</h2>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {gallery.map((image, index) => (
                      <button
                        type="button"
                        key={`${image}-${index}`}
                        onClick={() => setActiveGalleryIndex(index)}
                        className="group aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                        aria-label={`Ampliar ${index === 0 ? 'portada' : `foto ${index + 1}`} de ${comercio.nombre}`}
                      >
                        <img src={image} alt={`${comercio.nombre} foto ${index + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="order-1 space-y-3 lg:order-2">
              <DigitalBusinessCard comercio={comercio} compact />
              <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => void trackCommerceMetric(comercio.id, 'clicsWhatsapp')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                <MessageCircle className="h-4 w-4" />
                Conversar por WhatsApp
              </a>
              <a href={telUrl} onClick={() => void trackCommerceMetric(comercio.id, 'clicsLlamar')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
                <Phone className="h-4 w-4" />
                {telefono ?? 'Llamar'}
              </a>
              <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => void trackCommerceMetric(comercio.id, 'clicsMapa')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                <MapPin className="h-4 w-4" />
                Ver ubicacion
              </a>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-950">Direccion</p>
                <p>{comercio.direccion}</p>
                <p>{comercio.ciudad}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="flex items-center gap-2 font-semibold text-slate-950">
                  <Clock className="h-4 w-4" />
                  Horario
                </p>
                <p className="mt-1">{comercio.horario}</p>
              </div>
            </aside>
          </div>
        </section>

        <section id="publicaciones" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Publicaciones</h2>
              <p className="mt-1 text-sm text-slate-500">Promociones, novedades y servicios cargados por el comercio.</p>
            </div>
            <Link href="/publicar" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
              Crear publicacion
            </Link>
          </div>
          {publicationCategoryOptions.length > 2 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {publicationCategoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedPublicationCategory(category)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-[11px] font-bold transition ${
                    selectedPublicationCategory === category
                      ? 'bg-slate-950 text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {category === 'Todos' ? 'Todas' : category}
                </button>
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visiblePublicaciones.length > 0 ? (
              visiblePublicaciones.map((publicacion) => <PublicacionCard key={publicacion.id} publicacion={publicacion} comercio={comercio} variant="compact" />)
            ) : (
              <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-soft sm:col-span-3 lg:col-span-4 xl:col-span-5">{publicaciones.length > 0 ? 'No hay publicaciones en esta categoria.' : 'No hay publicaciones para este comercio aun.'}</div>
            )}
          </div>
        </section>
      </div>
      <ImageLightbox images={galleryItems} activeIndex={activeGalleryIndex} onChange={setActiveGalleryIndex} onClose={() => setActiveGalleryIndex(null)} />
    </main>
  );
}
