"use client";

import Link from 'next/link';
import { MessageCircle, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import { FilterSelect } from '@/components/ui/filter-select';
import { SearchBar } from '@/components/ui/search-bar';
import { ShareAppButton } from '@/components/ui/share-app-button';
import { adminContactMessage, adminWhatsapp } from '@/lib/admin-contact';
import { categoryGroups, categoryMatchesGroup, getCategoriesForGroup, getCategoryGroupForCategory } from '@/lib/categories';
import { cityMatches, getCityOptions } from '@/lib/cities';
import { getAllComercios, getLatestPublications } from '@/lib/firebase/firestore';
import { sampleComercios, samplePublicaciones } from '@/lib/mockData';
import { buildWhatsappUrl } from '@/lib/utils/format';
import type { Comercio, Publicacion } from '@/types';

export default function Home() {
  const router = useRouter();
  const [comercios, setComercios] = useState<Comercio[]>(sampleComercios);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(samplePublicaciones);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [loadingComercios, setLoadingComercios] = useState(true);
  const [loadingPublicaciones, setLoadingPublicaciones] = useState(true);
  const adminWhatsappUrl = useMemo(() => buildWhatsappUrl(adminWhatsapp, adminContactMessage), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const comerciosData = await getAllComercios();
        setComercios(comerciosData);
      } catch {
        setComercios(sampleComercios);
      } finally {
        setLoadingComercios(false);
      }
    };

    const loadPublicaciones = async () => {
      try {
        const publicacionesData = await getLatestPublications(4);
        setPublicaciones(publicacionesData);
      } catch {
        setPublicaciones(samplePublicaciones);
      } finally {
        setLoadingPublicaciones(false);
      }
    };

    loadData();
    loadPublicaciones();
  }, []);

  const visibleComercios = useMemo(() => {
    const normalizedSearch = searchValue.toLowerCase().trim();

    return comercios.filter((comercio) => {
      const matchesCategory =
        selectedCategory === 'Todos'
          ? categoryMatchesGroup(comercio.categoria, selectedCategoryGroup)
          : comercio.categoria === selectedCategory;
      const matchesCity = cityMatches(comercio.ciudad, selectedCity);
      const matchesSearch = [comercio.nombre, comercio.rubro, comercio.categoria, comercio.direccion]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
      return matchesCategory && matchesCity && matchesSearch;
    });
  }, [comercios, searchValue, selectedCategory, selectedCategoryGroup, selectedCity]);

  const cityOptions = useMemo(() => getCityOptions(comercios), [comercios]);
  const categoryOptions = useMemo(() => getCategoriesForGroup(selectedCategoryGroup), [selectedCategoryGroup]);
  const handleSelectCategoryGroup = (group: string) => {
    setSelectedCategoryGroup(group);
    setSelectedCategory('Todos');
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    if (category !== 'Todos') {
      setSelectedCategoryGroup(getCategoryGroupForCategory(category));
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchValue.trim()) {
      params.set('search', searchValue.trim());
    }

    if (selectedCategory !== 'Todos') {
      params.set('category', selectedCategory);
    } else if (selectedCategoryGroup !== 'Todos') {
      params.set('group', selectedCategoryGroup);
    }

    if (selectedCity !== 'Todas') {
      params.set('city', selectedCity);
    }

    const queryString = params.toString();
    router.push(`/comercios${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <main className="min-h-screen bg-surface px-3 pb-24 pt-20 text-slate-950 sm:px-5">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="grid gap-4 pt-1 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">ComerciosPY</p>
            <h1 className="max-w-3xl text-2xl font-semibold leading-tight sm:text-4xl">
              Directorio local para encontrar y contactar comercios en minutos.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Busca por ciudad, rubro o categoria. Abri WhatsApp, llama o mira la ubicacion sin registrarte.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Gratis', 'Sin registro', 'WhatsApp directo', 'Filtro por ciudad'].map((item) => (
                <span key={item} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                  {item}
                </span>
              ))}
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-2 pt-2">
              {[
                { label: 'Comercios', value: visibleComercios.length },
                { label: 'Ciudades', value: cityOptions.length },
                { label: 'Novedades', value: publicaciones.length }
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <p className="text-lg font-semibold text-slate-950">{item.value}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:block">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-accent">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Acceso gratis para usuarios</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Filtra por ciudad y categoria, abre WhatsApp, llama o mira la ubicacion sin registrarte.</p>
              </div>
            </div>
            <Link
              href="/comercios"
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Search className="h-4 w-4" />
              Buscar gratis
            </Link>
            <a
              href={adminWhatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4" />
              Soy comercio y quiero aparecer
            </a>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <ShareAppButton mode="panel" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SearchBar
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onSubmit={handleSearch}
            placeholder="Buscar negocio, rubro o direccion"
            buttonLabel="Ir"
            size="compact"
          />
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Filtros rapidos</p>
              <span className="text-xs font-semibold text-slate-500">{visibleComercios.length} resultados</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FilterSelect id="home-city-filter" label="Ciudad" value={selectedCity} options={cityOptions} onChange={setSelectedCity} />
              <FilterSelect id="home-category-group-filter" label="Grupo" value={selectedCategoryGroup} options={categoryGroups} onChange={handleSelectCategoryGroup} />
              <FilterSelect id="home-category-filter" label="Categoria" value={selectedCategory} options={categoryOptions} onChange={handleSelectCategory} />
            </div>
          </div>
          <a
            href={adminWhatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
          >
            <span>Soy comercio o prestador</span>
            <span className="text-accent">Quiero aparecer</span>
          </a>
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
            <ShareAppButton mode="panel" />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Negocios disponibles</h2>
              <p className="mt-1 text-sm text-slate-500">
                {visibleComercios.length} resultados gratis{selectedCity !== 'Todas' ? ` en ${selectedCity}` : ''} para consultar ahora.
              </p>
            </div>
            <Link href="/comercios" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:border-slate-300">
              Ver todos
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {loadingComercios ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">Cargando comercios...</p>
            ) : visibleComercios.length > 0 ? (
              visibleComercios.slice(0, 12).map((comercio) => <CommerceCard key={comercio.id} comercio={comercio} />)
            ) : (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">No hay comercios que coincidan con tu busqueda.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h2 className="text-xl font-semibold text-slate-950">Publicaciones recientes</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">Ofertas, servicios y novedades cargadas por los comercios.</p>
            </div>
            <a
              href={adminWhatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
            >
              Soy comercio
            </a>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {loadingPublicaciones ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">Cargando publicaciones...</p>
            ) : publicaciones.length > 0 ? (
              publicaciones.slice(0, 3).map((publicacion) => <PublicacionCard key={publicacion.id} publicacion={publicacion} />)
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">No hay publicaciones recientes.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
