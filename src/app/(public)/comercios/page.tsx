"use client";

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryPills } from '@/components/ui/category-pills';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { FilterSelect } from '@/components/ui/filter-select';
import { SearchBar } from '@/components/ui/search-bar';
import { adminContactMessage, adminWhatsapp } from '@/lib/admin-contact';
import { categories } from '@/lib/categories';
import { cityMatches, getCityOptions } from '@/lib/cities';
import { getAllComercios } from '@/lib/firebase/firestore';
import { sampleComercios } from '@/lib/mockData';
import { buildWhatsappUrl } from '@/lib/utils/format';
import type { Comercio } from '@/types';

export default function ComerciosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [comercios, setComercios] = useState<Comercio[]>(sampleComercios);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? 'Todos');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') ?? 'Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComercios = async () => {
      try {
        const data = await getAllComercios();
        setComercios(data);
      } catch {
        setComercios(sampleComercios);
      } finally {
        setLoading(false);
      }
    };

    loadComercios();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setSelectedCategory(searchParams.get('category') ?? 'Todos');
    setSelectedCity(searchParams.get('city') ?? 'Todas');
  }, [searchParams]);

  const cityOptions = useMemo(() => getCityOptions(comercios), [comercios]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategory !== 'Todos') params.set('category', selectedCategory);
    if (selectedCity !== 'Todas') params.set('city', selectedCity);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category !== 'Todos') params.set('category', category);
    if (selectedCity !== 'Todas') params.set('city', selectedCity);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategory !== 'Todos') params.set('category', selectedCategory);
    if (city !== 'Todas') params.set('city', city);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const filteredComercios = useMemo(
    () =>
      comercios.filter((comercio) => {
        const matchesCategory = selectedCategory === 'Todos' || comercio.categoria === selectedCategory;
        const matchesCity = cityMatches(comercio.ciudad, selectedCity);
        const matchesSearch = `${comercio.nombre} ${comercio.rubro} ${comercio.categoria} ${comercio.direccion}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesCategory && matchesCity && matchesSearch;
      }),
    [comercios, search, selectedCategory, selectedCity]
  );

  return (
    <main className="min-h-screen bg-surface px-3 pb-24 pt-20 text-slate-950 sm:px-5">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Guia completa</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Comercios y servicios</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">Busca, compara y entra a la ficha del comercio para ver fotos, publicaciones, ubicacion y contacto.</p>
            </div>
            <a
              href={buildWhatsappUrl(adminWhatsapp, adminContactMessage)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Quiero aparecer
            </a>
          </div>
        </section>

        <section className="space-y-2">
          <SearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSubmit={handleSearch}
            placeholder="Buscar por nombre, rubro o direccion"
            buttonLabel="Buscar"
            size="compact"
          />
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Filtros</p>
              <span className="text-xs font-semibold text-slate-500">{filteredComercios.length} resultados</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-[240px_1fr] lg:items-end">
              <FilterSelect id="city-filter" label="Ciudad" value={selectedCity} options={cityOptions} onChange={handleSelectCity} />
              <div className="min-w-0">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Categoria</p>
                <CategoryPills categories={categories} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} size="compact" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">
              {filteredComercios.length} comercios encontrados{selectedCity !== 'Todas' ? ` en ${selectedCity}` : ''}
            </p>
            <Link href="/" className="text-sm font-semibold text-accent hover:text-red-700">
              Inicio
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">Cargando comercios...</p>
            ) : filteredComercios.length > 0 ? (
              filteredComercios.map((comercio) => <CommerceCard key={comercio.id} comercio={comercio} />)
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">No se encontraron comercios con esos filtros.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
