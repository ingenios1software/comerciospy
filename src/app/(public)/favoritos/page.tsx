"use client";

import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import { getAllComercios, getAllPublications } from '@/lib/firebase/firestore';
import { useFavorites } from '@/lib/favorites';
import { sampleComercios, samplePublicaciones } from '@/lib/mockData';
import type { Comercio, Publicacion } from '@/types';

export default function FavoritosPage() {
  const { favorites } = useFavorites();
  const [comercios, setComercios] = useState<Comercio[]>(sampleComercios);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(samplePublicaciones);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavoritesData = async () => {
      const [comerciosResult, publicacionesResult] = await Promise.allSettled([getAllComercios(), getAllPublications()]);

      setComercios(comerciosResult.status === 'fulfilled' ? comerciosResult.value : sampleComercios);
      setPublicaciones(publicacionesResult.status === 'fulfilled' ? publicacionesResult.value : samplePublicaciones);
      setLoading(false);
    };

    loadFavoritesData();
  }, []);

  const comerciosById = useMemo(() => new Map(comercios.map((comercio) => [comercio.id, comercio])), [comercios]);
  const publicacionesById = useMemo(() => new Map(publicaciones.map((publicacion) => [publicacion.id, publicacion])), [publicaciones]);
  const publicacionesByCommerceId = useMemo(() => {
    return publicaciones.reduce((map, publicacion) => {
      const current = map.get(publicacion.comercioId) ?? [];
      current.push(publicacion);
      map.set(publicacion.comercioId, current);
      return map;
    }, new Map<string, Publicacion[]>());
  }, [publicaciones]);

  const favoriteComercios = useMemo(() => {
    return favorites
      .filter((favorite) => favorite.kind === 'comercio')
      .map((favorite) => comerciosById.get(favorite.id))
      .filter((comercio): comercio is Comercio => Boolean(comercio));
  }, [comerciosById, favorites]);

  const favoritePublicaciones = useMemo(() => {
    return favorites
      .filter((favorite) => favorite.kind === 'publicacion')
      .map((favorite) => publicacionesById.get(favorite.id))
      .filter((publicacion): publicacion is Publicacion => Boolean(publicacion));
  }, [favorites, publicacionesById]);
  const favoritePublicationPreviewItems = useMemo(
    () => favoritePublicaciones.map((publicacion) => ({ publicacion, comercio: comerciosById.get(publicacion.comercioId) })),
    [comerciosById, favoritePublicaciones]
  );

  const missingFavorites = favorites.filter((favorite) => {
    return favorite.kind === 'comercio' ? !comerciosById.has(favorite.id) : !publicacionesById.has(favorite.id);
  });
  const hasFavorites = favoriteComercios.length > 0 || favoritePublicaciones.length > 0 || missingFavorites.length > 0;

  return (
    <main className="min-h-screen bg-surface px-3 pb-24 pt-20 text-slate-950 sm:px-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                <Heart className="h-3.5 w-3.5 fill-current" />
                Favoritos
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Tus me gusta</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">Guardados en este navegador para volver rapido a comercios y articulos.</p>
            </div>
            <Link href="/comercios" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800">
              Seguir buscando
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {loading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">Cargando favoritos...</p>
        ) : hasFavorites ? (
          <>
            {favoriteComercios.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-slate-950">Comercios favoritos</h2>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {favoriteComercios.map((comercio) => (
                    <CommerceCard key={comercio.id} comercio={comercio} publicaciones={publicacionesByCommerceId.get(comercio.id) ?? []} />
                  ))}
                </div>
              </section>
            ) : null}

            {favoritePublicaciones.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-slate-950">Articulos favoritos</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {favoritePublicationPreviewItems.map(({ publicacion, comercio }) => (
                    <PublicacionCard
                      key={publicacion.id}
                      publicacion={publicacion}
                      comercio={comercio}
                      variant="compact"
                      previewItems={favoritePublicationPreviewItems}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {missingFavorites.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-slate-950">Guardados recientes</h2>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {missingFavorites.map((favorite) => (
                    <Link key={`${favorite.kind}-${favorite.id}`} href={favorite.href} className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-red-200">
                      <div className="h-16 overflow-hidden rounded-md bg-slate-100">
                        {favorite.imageUrl ? <img src={favorite.imageUrl} alt={favorite.title} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0 py-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{favorite.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{favorite.subtitle ?? 'Favorito guardado'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
            <Heart className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-950">Todavia no guardaste favoritos</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Toca Me gusta en comercios o articulos para encontrarlos aca.</p>
          </section>
        )}
      </div>
    </main>
  );
}
