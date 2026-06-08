"use client";

import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  BriefcaseBusiness,
  Heart,
  MapPin,
  Search,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import { FilterSelect } from '@/components/ui/filter-select';
import { categoryGroups, categoryMatchesFilter, getCategoriesForGroup, getCategoryGroupForCategory } from '@/lib/categories';
import { cityMatches, getCityOptions } from '@/lib/cities';
import { getAllComercios, getAllPublications } from '@/lib/firebase/firestore';
import { sampleComercios, samplePublicaciones } from '@/lib/mockData';
import { matchesCommerceSearch } from '@/lib/search';
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
        const publicacionesData = await getAllPublications();
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

  const publicacionesByCommerceId = useMemo(() => {
    return publicaciones.reduce((map, publicacion) => {
      const current = map.get(publicacion.comercioId) ?? [];
      current.push(publicacion);
      map.set(publicacion.comercioId, current);
      return map;
    }, new Map<string, Publicacion[]>());
  }, [publicaciones]);
  const comerciosById = useMemo(() => new Map(comercios.map((comercio) => [comercio.id, comercio])), [comercios]);

  const visibleComercios = useMemo(() => {
    return comercios.filter((comercio) => {
      const publicacionesDelComercio = publicacionesByCommerceId.get(comercio.id) ?? [];
      const categoryValues = [comercio.categoria, ...publicacionesDelComercio.map((publicacion) => publicacion.categoria)];
      const matchesCategory = categoryValues.some((category) => categoryMatchesFilter(category, selectedCategory, selectedCategoryGroup));
      const matchesCity = cityMatches(comercio.ciudad, selectedCity);
      const matchesSearch = matchesCommerceSearch(comercio, searchValue, publicacionesDelComercio);
      return matchesCategory && matchesCity && matchesSearch;
    });
  }, [comercios, publicacionesByCommerceId, searchValue, selectedCategory, selectedCategoryGroup, selectedCity]);

  const visiblePublicaciones = useMemo(() => {
    return publicaciones.filter((publicacion) => {
      const comercio = comerciosById.get(publicacion.comercioId);
      const matchesCategory = [publicacion.categoria, comercio?.categoria].some((category) =>
        categoryMatchesFilter(category, selectedCategory, selectedCategoryGroup)
      );
      const matchesCity = cityMatches(publicacion.ciudad || comercio?.ciudad || '', selectedCity);
      const matchesSearch = !searchValue.trim() || (comercio ? matchesCommerceSearch(comercio, searchValue, [publicacion]) : false);

      return matchesCategory && matchesCity && matchesSearch;
    });
  }, [comerciosById, publicaciones, searchValue, selectedCategory, selectedCategoryGroup, selectedCity]);

  const recentPublicaciones = useMemo(() => visiblePublicaciones.slice(0, 12), [visiblePublicaciones]);
  const recentPublicationPreviewItems = useMemo(
    () => recentPublicaciones.map((publicacion) => ({ publicacion, comercio: comerciosById.get(publicacion.comercioId) })),
    [comerciosById, recentPublicaciones]
  );

  const cityOptions = useMemo(() => getCityOptions(comercios), [comercios]);
  const categoryOptions = useMemo(() => getCategoriesForGroup(selectedCategoryGroup), [selectedCategoryGroup]);

  const quickActions = [
    {
      label: 'Cuenta',
      href: '/login',
      Icon: Store
    },
    {
      label: 'Cerca',
      href: '/comercios',
      Icon: MapPin
    },
    {
      label: 'Ofertas',
      href: '#publicaciones',
      Icon: BadgePercent
    },
    {
      label: 'Carrito',
      href: '/carrito',
      Icon: ShoppingCart
    },
    {
      label: 'Favoritos',
      href: '/favoritos',
      Icon: Heart
    },
    {
      label: 'Vender',
      href: '/planes',
      Icon: BriefcaseBusiness,
    }
  ];

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
    <main className="min-h-screen overflow-x-hidden bg-[#ededed] pb-24 pt-[68px] text-slate-950 sm:pt-[70px]">
      <section className="bg-[linear-gradient(180deg,#dc2626_0%,#b91c1c_100%)] text-white">
        <div className="mx-auto max-w-7xl px-3 pb-8 pt-2 sm:px-5 sm:pb-12 sm:pt-5">
          <div>
            <div>
              <p className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-red-100 sm:block">ComerciosPY</p>
              <h1 className="hidden max-w-[340px] text-[24px] font-black leading-[1.04] sm:mt-2 sm:block sm:max-w-3xl sm:text-4xl">
                Lo mejor de tu zona esta mas cerca.
              </h1>
              <p className="hidden max-w-[330px] text-[11px] font-bold uppercase leading-4 text-red-50 sm:mt-2 sm:block sm:max-w-xl sm:text-[12px]">
                Busca comercios, servicios, ofertas y contactos por WhatsApp.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSearch();
                }}
                className="mt-1 flex max-w-full overflow-hidden rounded-md bg-white p-1 shadow-[0_14px_34px_rgba(127,29,29,0.28)] sm:mt-4 sm:max-w-3xl"
              >
                <label htmlFor="home-search" className="sr-only">Buscar comercios</label>
                <input
                  id="home-search"
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Buscar ciudad, categoria, grupo, negocio, contacto o articulo"
                  className="h-10 min-w-0 flex-1 px-3 text-[13px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-slate-950 px-3 text-[12px] font-bold text-white transition hover:bg-slate-800 sm:min-w-[92px]"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </form>

              <div className="mt-3 flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categoryGroups.slice(0, 6).map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleSelectCategoryGroup(group.id)}
                    className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                      selectedCategoryGroup === group.id
                        ? 'bg-white text-accent'
                        : 'bg-white/15 text-red-50 hover:bg-white/25'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-7 max-w-7xl space-y-3 px-3 sm:px-5">
        <section id="publicaciones" className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="inline-flex items-center gap-1.5 rounded-md bg-amber-300 px-2.5 py-1.5 text-[16px] font-black text-slate-950 shadow-sm ring-1 ring-amber-400">
                <BadgePercent className="h-4 w-4 text-accent" />
                Recien publicado
              </h2>
              <p className="mt-1 text-[11px] font-semibold text-slate-600">Fotos, ofertas y articulos listos para consultar.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2.5 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(185,28,28,0.28)] ring-1 ring-red-700 transition hover:bg-red-700"
            >
              <Store className="h-3.5 w-3.5" />
              Soy comercio
            </Link>
          </div>
          <div className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-2 scrollbar-none auto-cols-[155px] sm:auto-cols-[180px] lg:auto-cols-[190px]">
            {loadingPublicaciones ? (
              <p className="col-span-2 rounded-md border border-slate-200 bg-white p-3 text-[12px] font-semibold text-slate-500 shadow-sm sm:col-span-3 lg:col-span-4 xl:col-span-6">Cargando publicaciones...</p>
            ) : visiblePublicaciones.length > 0 ? (
              recentPublicationPreviewItems.map(({ publicacion, comercio }) => (
                <PublicacionCard
                  key={publicacion.id}
                  publicacion={publicacion}
                  comercio={comercio}
                  variant="compact"
                  previewItems={recentPublicationPreviewItems}
                />
              ))
            ) : (
              <p className="col-span-2 rounded-md border border-slate-200 bg-white p-3 text-[12px] font-semibold text-slate-500 shadow-sm sm:col-span-3 lg:col-span-4 xl:col-span-6">No hay publicaciones recientes.</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.Icon;
            const content = (
              <>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="min-w-0 truncate text-[11px] font-black text-slate-950">{action.label}</p>
              </>
            );

            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex h-11 min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 shadow-sm transition hover:border-red-200 hover:bg-red-50/30"
              >
                {content}
              </Link>
            );
          })}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-black text-slate-950">Filtros</h2>
              <p className="text-[10px] font-semibold text-slate-500">{visibleComercios.length} resultados</p>
            </div>
            <Link href="/comercios" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            <FilterSelect id="home-city-filter" label="Ciudad" value={selectedCity} options={cityOptions} onChange={setSelectedCity} />
            <FilterSelect id="home-category-group-filter" label="Grupo" value={selectedCategoryGroup} options={categoryGroups} onChange={handleSelectCategoryGroup} />
            <FilterSelect id="home-category-filter" label="Categoria" value={selectedCategory} options={categoryOptions} onChange={handleSelectCategory} />
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-black text-slate-950">Negocios disponibles</h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {visibleComercios.length} resultados{selectedCity !== 'Todas' ? ` en ${selectedCity}` : ''}.
              </p>
            </div>
            <Link href="/comercios" className="rounded-md bg-white px-3 py-2 text-[11px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
              Ver todos
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {loadingComercios ? (
              <p className="rounded-md border border-slate-200 bg-white p-3 text-[12px] font-semibold text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">Cargando comercios...</p>
            ) : visibleComercios.length > 0 ? (
              visibleComercios
                .slice(0, 12)
                .map((comercio) => <CommerceCard key={comercio.id} comercio={comercio} publicaciones={publicacionesByCommerceId.get(comercio.id) ?? []} />)
            ) : (
              <p className="rounded-md border border-slate-200 bg-white p-3 text-[12px] font-semibold text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">No hay comercios que coincidan con tu busqueda.</p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
