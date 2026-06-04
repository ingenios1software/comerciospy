"use client";

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { FilterSelect } from '@/components/ui/filter-select';
import { SearchBar } from '@/components/ui/search-bar';
import { categoryGroups, categoryMatchesGroup, getCategoriesForGroup, getCategoryGroupForCategory } from '@/lib/categories';
import { cityMatches, getCityOptions } from '@/lib/cities';
import { getAllComercios, getAllPublications } from '@/lib/firebase/firestore';
import { sampleComercios, samplePublicaciones } from '@/lib/mockData';
import { matchesCommerceSearch } from '@/lib/search';
import type { Comercio, Publicacion } from '@/types';

export default function ComerciosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [comercios, setComercios] = useState<Comercio[]>(sampleComercios);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(samplePublicaciones);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? 'Todos');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState(
    searchParams.get('group') ?? getCategoryGroupForCategory(searchParams.get('category') ?? 'Todos')
  );
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') ?? 'Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComercios = async () => {
      const [comerciosResult, publicacionesResult] = await Promise.allSettled([getAllComercios(), getAllPublications()]);

      setComercios(comerciosResult.status === 'fulfilled' ? comerciosResult.value : sampleComercios);
      setPublicaciones(publicacionesResult.status === 'fulfilled' ? publicacionesResult.value : samplePublicaciones);
      setLoading(false);
    };

    loadComercios();
  }, []);

  useEffect(() => {
    const nextCategory = searchParams.get('category') ?? 'Todos';
    setSearch(searchParams.get('search') ?? '');
    setSelectedCategory(nextCategory);
    setSelectedCategoryGroup(searchParams.get('group') ?? getCategoryGroupForCategory(nextCategory));
    setSelectedCity(searchParams.get('city') ?? 'Todas');
  }, [searchParams]);

  const cityOptions = useMemo(() => getCityOptions(comercios), [comercios]);
  const categoryOptions = useMemo(() => getCategoriesForGroup(selectedCategoryGroup), [selectedCategoryGroup]);
  const publicacionesByCommerceId = useMemo(() => {
    return publicaciones.reduce((map, publicacion) => {
      const current = map.get(publicacion.comercioId) ?? [];
      current.push(publicacion);
      map.set(publicacion.comercioId, current);
      return map;
    }, new Map<string, Publicacion[]>());
  }, [publicaciones]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategoryGroup !== 'Todos') params.set('group', selectedCategoryGroup);
    if (selectedCategory !== 'Todos') params.set('category', selectedCategory);
    if (selectedCity !== 'Todas') params.set('city', selectedCity);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSelectCategoryGroup = (group: string) => {
    setSelectedCategoryGroup(group);
    setSelectedCategory('Todos');
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (group !== 'Todos') params.set('group', group);
    if (selectedCity !== 'Todas') params.set('city', selectedCity);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSelectCategory = (category: string) => {
    const group = category === 'Todos' ? selectedCategoryGroup : getCategoryGroupForCategory(category);
    setSelectedCategory(category);
    setSelectedCategoryGroup(group);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (group !== 'Todos') params.set('group', group);
    if (category !== 'Todos') params.set('category', category);
    if (selectedCity !== 'Todas') params.set('city', selectedCity);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategoryGroup !== 'Todos') params.set('group', selectedCategoryGroup);
    if (selectedCategory !== 'Todos') params.set('category', selectedCategory);
    if (city !== 'Todas') params.set('city', city);
    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const filteredComercios = useMemo(
    () =>
      comercios.filter((comercio) => {
        const matchesCategory =
          selectedCategory === 'Todos'
            ? categoryMatchesGroup(comercio.categoria, selectedCategoryGroup)
            : comercio.categoria === selectedCategory;
        const matchesCity = cityMatches(comercio.ciudad, selectedCity);
        const matchesSearch = matchesCommerceSearch(comercio, search, publicacionesByCommerceId.get(comercio.id) ?? []);
        return matchesCategory && matchesCity && matchesSearch;
      }),
    [comercios, publicacionesByCommerceId, search, selectedCategory, selectedCategoryGroup, selectedCity]
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
            <Link
              href="/planes"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Quiero aparecer
            </Link>
          </div>
        </section>

        <section className="space-y-2">
          <SearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSubmit={handleSearch}
            placeholder="Buscar ciudad, categoria, grupo, contacto o articulo"
            buttonLabel="Buscar"
            size="compact"
          />
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Filtros</p>
              <span className="text-xs font-semibold text-slate-500">{filteredComercios.length} resultados</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FilterSelect id="city-filter" label="Ciudad" value={selectedCity} options={cityOptions} onChange={handleSelectCity} />
              <FilterSelect id="category-group-filter" label="Grupo" value={selectedCategoryGroup} options={categoryGroups} onChange={handleSelectCategoryGroup} />
              <FilterSelect id="category-filter" label="Categoria" value={selectedCategory} options={categoryOptions} onChange={handleSelectCategory} />
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
              filteredComercios.map((comercio) => (
                <CommerceCard key={comercio.id} comercio={comercio} publicaciones={publicacionesByCommerceId.get(comercio.id) ?? []} />
              ))
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">No se encontraron comercios con esos filtros.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
