"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAllComercios, getPublicationsByCommerce } from '@/lib/firebase/firestore';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import type { Comercio, Publicacion } from '@/types';

export default function ComercioDetailPage() {
  const params = useParams();
  const commerceId = params?.id as string | undefined;
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommerce = async () => {
      if (!commerceId) return;

      try {
        const comercios = await getAllComercios();
        const comercioItem = comercios.find((item) => item.id === commerceId) ?? null;
        setComercio(comercioItem);

        if (comercioItem) {
          const publicacionesData = await getPublicationsByCommerce(comercioItem.id);
          setPublicaciones(publicacionesData);
        }
      } catch {
        setComercio(null);
        setPublicaciones([]);
      } finally {
        setLoading(false);
      }
    };

    loadCommerce();
  }, [commerceId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
        <div className="mx-auto max-w-4xl py-24 text-center text-slate-400">Cargando comercio...</div>
      </main>
    );
  }

  if (!comercio) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
        <div className="mx-auto max-w-4xl py-24 text-center text-slate-400">No se encontró el comercio solicitado.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[2rem] bg-slate-900/95 p-4 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-800/90">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_35%)]" />
            <img src={comercio.portadaUrl} alt={comercio.nombre} className="h-56 w-full object-cover opacity-80" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-slate-50">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">{comercio.rubro}</p>
              <h1 className="mt-2 text-3xl font-semibold">{comercio.nombre}</h1>
              <p className="mt-2 text-sm text-slate-200">{comercio.direccion} · {comercio.ciudad}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4 rounded-3xl bg-slate-950/90 p-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-3xl bg-slate-700">
                  <img src={comercio.logoUrl} alt={comercio.nombre} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Comercio</p>
                  <p className="text-lg font-semibold text-slate-100">{comercio.nombre}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-300">{comercio.descripcion}</p>
              <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/90 p-3">Horario: {comercio.horario}</div>
                <div className="rounded-3xl bg-slate-900/90 p-3">Verificado: {comercio.verificado ? 'Sí' : 'Pendiente'}</div>
              </div>
            </div>
            <div className="space-y-3 rounded-3xl bg-slate-950/90 p-4 text-sm text-slate-300">
              <p className="text-slate-100">Contacto rápido</p>
              <div className="space-y-3">
                <p>WhatsApp</p>
                <a href={`https://wa.me/${comercio.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="block rounded-3xl bg-cyan-500 px-4 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-400">
                  Chatear por WhatsApp
                </a>
                <p className="text-xs text-slate-500">Haz click para abrir en el celular.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Publicaciones</p>
              <h2 className="mt-2 text-xl font-semibold">Promociones y novedades</h2>
            </div>
            <Link href="/publicar" className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700">
              Crear publicación
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {publicaciones.length > 0 ? (
              publicaciones.map((publicacion) => <PublicacionCard key={publicacion.id} publicacion={publicacion} />)
            ) : (
              <div className="rounded-3xl bg-slate-950/90 p-4 text-center text-sm text-slate-400">No hay publicaciones para este comercio aún.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
