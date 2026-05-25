"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryPills } from '@/components/ui/category-pills';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { SearchBar } from '@/components/ui/search-bar';
import { categories } from '@/lib/categories';
import { getAllComercios } from '@/lib/firebase/firestore';
import type { Comercio } from '@/types';

export default function ComerciosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? 'Todos');
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

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setSelectedCategory(searchParams.get('category') ?? 'Todos');
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategory !== 'Todos') params.set('category', selectedCategory);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category !== 'Todos') params.set('category', category);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const filteredComercios = useMemo(
    () =>
      comercios.filter((comercio) => {
        const matchesCategory = selectedCategory === 'Todos' || comercio.categoria === selectedCategory;
        const matchesSearch = `${comercio.nombre} ${comercio.rubro} ${comercio.ciudad} ${comercio.categoria}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [comercios, search, selectedCategory]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Comercios</p>
              <h1 className="mt-2 text-3xl font-semibold">Explora tu comercio ideal</h1>
              <p className="mt-2 text-sm text-slate-400">Navega por categoría y busca rápidamente desde tu celular.</p>
            </div>
            <Link href="/registro" className="rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Crear comercio
            </Link>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Buscar</p>
                <p className="mt-2 text-sm text-slate-400">Filtra por nombre, rubro, ciudad o categoría.</p>
              </div>
              <SearchBar
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onSubmit={handleSearch}
                placeholder="Buscar comercios, ofertas o ciudad"
                buttonLabel="Buscar"
              />
            </div>

            <div className="mt-5">
              <CategoryPills
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
            </div>
          </section>

          <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resultados</p>
                <h2 className="mt-2 text-xl font-semibold">Comercios disponibles</h2>
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
                <p className="text-slate-400">No se encontraron comercios que coincidan con tu búsqueda.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
