"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeading } from '@/components/ui/section-heading';
import { getAllComercios, getLatestPublications } from '@/lib/firebase/firestore';
import { featuredComercios, samplePublicaciones } from '@/lib/mockData';
import type { Comercio, CommercePreview, Publicacion } from '@/types';

export default function Home() {
  const [comercios, setComercios] = useState<Array<Comercio | CommercePreview>>(featuredComercios);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(samplePublicaciones);
  const [loadingComercios, setLoadingComercios] = useState(true);
  const [loadingPublicaciones, setLoadingPublicaciones] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const comerciosData = await getAllComercios();
        if (comerciosData.length > 0) {
          setComercios(comerciosData.slice(0, 4));
        }
      } catch {
        setComercios(featuredComercios);
      } finally {
        setLoadingComercios(false);
      }
    };

    const loadPublicaciones = async () => {
      try {
        const publicacionesData = await getLatestPublications(4);
        if (publicacionesData.length > 0) {
          setPublicaciones(publicacionesData);
        }
      } catch {
        setPublicaciones(samplePublicaciones);
      } finally {
        setLoadingPublicaciones(false);
      }
    };

    loadData();
    loadPublicaciones();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6">
        <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <SectionHeading
            title="Tu app de comercios locales"
            description="Descubre comercios, ofertas y novedades en una experiencia móvil con navegación rápida y diseño táctil."
          />
          <div className="mt-5 space-y-4">
            <SearchBar />
            <div className="flex flex-wrap gap-3 text-sm">
              {['Ofertas', 'Delivery', 'Moda', 'Bebidas', 'Servicios'].map((tag) => (
                <span key={tag} className="rounded-full bg-slate-800 px-4 py-2 text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-slate-900/90 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Explorar</p>
              <h2 className="mt-2 text-xl font-semibold">Comercios destacados</h2>
            </div>
            <Link
              href="/comercios"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {loadingComercios ? (
              <p className="text-slate-400">Cargando comercios...</p>
            ) : (
              comercios.map((comercio) => <CommerceCard key={comercio.id} comercio={comercio} />)
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-slate-900/90 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Feed</p>
              <h2 className="mt-2 text-xl font-semibold">Publicaciones recientes</h2>
            </div>
            <Link
              href="/publicar"
              className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
            >
              Publicar ahora
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {loadingPublicaciones ? (
              <p className="text-slate-400">Cargando publicaciones...</p>
            ) : publicaciones.length > 0 ? (
              publicaciones.map((publicacion) => <PublicacionCard key={publicacion.id} publicacion={publicacion} />)
            ) : (
              <p className="text-slate-400">No hay publicaciones recientes.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
