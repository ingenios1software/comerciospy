"use client";

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryPills } from '@/components/ui/category-pills';
import { CommerceCard } from '@/components/comercios/commerce-card';
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
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Guia completa</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Explorar comercios y servicios</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Filtra contactos por ciudad, rubro, categoria, WhatsApp y ubicacion sin crear cuenta.</p>
          </div>
          <a
            href={buildWhatsappUrl(adminWhatsapp, adminContactMessage)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            Quiero aparecer
          </a>
        </section>

        <section className="space-y-3">
          <SearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSubmit={handleSearch}
            placeholder="Buscar por nombre, rubro o direccion"
            buttonLabel="Buscar"
          />
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Filtros</p>
              <span className="text-xs font-semibold text-slate-500">{filteredComercios.length} resultados</span>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ciudad</p>
              <CategoryPills categories={cityOptions} selectedCategory={selectedCity} onSelectCategory={handleSelectCity} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Categoria de negocio</p>
              <CategoryPills categories={categories} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-700">
              {filteredComercios.length} comercios encontrados{selectedCity !== 'Todas' ? ` en ${selectedCity}` : ''}
            </p>
            <Link href="/" className="text-sm font-semibold text-accent hover:text-red-700">
              Inicio
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">Cargando comercios...</p>
            ) : filteredComercios.length > 0 ? (
              filteredComercios.map((comercio) => <CommerceCard key={comercio.id} comercio={comercio} />)
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">No se encontraron comercios con esos filtros.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
