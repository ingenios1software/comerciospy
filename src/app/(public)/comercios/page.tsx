"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { SearchBar } from '@/components/ui/search-bar';
import { getAllComercios } from '@/lib/firebase/firestore';
import type { Comercio } from '@/types';

export default function ComerciosPage() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComercios = async () => {
      try {
        const data = await getAllComercios();
        setComercios(data);
      } catch {
        setComercios([]);
      } finally {
        setLoading(false);
      }
    };

    loadComercios();
  }, []);

  const filteredComercios = comercios.filter((comercio) =>
    `${comercio.nombre} ${comercio.rubro} ${comercio.ciudad}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Comercios</p>
              <h1 className="mt-2 text-3xl font-semibold">Explora y encuentra tu comercio ideal</h1>
              <p className="mt-2 text-sm text-slate-400">Buscador rápido pensado para pantalla chica y navegación táctil.</p>
            </div>
            <Link href="/registro" className="rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Crear comercio
            </Link>
          </div>
        </section>

        <div className="space-y-5">
          <div className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Buscar</p>
                <p className="mt-2 text-sm text-slate-400">Filtra comercios por nombre, rubro o ciudad.</p>
              </div>
              <div className="flex w-full max-w-md items-center gap-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar comercios, ofertas o ciudad"
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
            </div>
          </div>

          <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Comercios</p>
                <h2 className="mt-2 text-xl font-semibold">Resultados</h2>
              </div>
              <Link href="/publicar" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Agregar nueva
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {loading ? (
                <p className="text-slate-400">Cargando comercios...</p>
              ) : filteredComercios.length > 0 ? (
                filteredComercios.map((comercio) => <CommerceCard key={comercio.id} comercio={comercio} />)
              ) : (
                <p className="text-slate-400">No se encontraron comercios para tu búsqueda.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
