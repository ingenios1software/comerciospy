"use client";

import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  BriefcaseBusiness,
  Building2,
  Car,
  CircuitBoard,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  PlugZap,
  Search,
  Shirt,
  Smartphone,
  Store,
  Utensils,
  Wrench
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import { FilterSelect } from '@/components/ui/filter-select';
import { ShareAppButton } from '@/components/ui/share-app-button';
import { adminContactMessage, adminWhatsapp } from '@/lib/admin-contact';
import { categoryGroups, categoryMatchesGroup, getCategoriesForGroup, getCategoryGroupForCategory } from '@/lib/categories';
import { cityMatches, getCityOptions } from '@/lib/cities';
import { getAllComercios, getAllPublications } from '@/lib/firebase/firestore';
import { sampleComercios, samplePublicaciones } from '@/lib/mockData';
import { matchesCommerceSearch } from '@/lib/search';
import { buildWhatsappUrl } from '@/lib/utils/format';
import type { Comercio, Publicacion } from '@/types';

const categoryTiles = [
  { label: 'Comida y bebidas', category: 'Comida', Icon: Utensils },
  { label: 'Celulares y tecnologia', category: 'Tecnologia', Icon: Smartphone },
  { label: 'Servicios locales', category: 'Servicios', Icon: Wrench },
  { label: 'Moda y bienestar', category: 'Moda', Icon: Shirt },
  { label: 'Hogar y vivienda', category: 'Hogar', Icon: HomeIcon },
  { label: 'Electricidad', category: 'Electricidad', Icon: PlugZap },
  { label: 'Autos y motos', category: 'Autos', Icon: Car },
  { label: 'Profesionales', category: 'Servicios', Icon: BriefcaseBusiness },
  { label: 'Ofertas', category: 'Todos', Icon: BadgePercent },
  { label: 'Locales destacados', category: 'Todos', Icon: Store },
  { label: 'Inmuebles', category: 'Vivienda', Icon: Building2 },
  { label: 'Computacion', category: 'Tecnologia', Icon: CircuitBoard }
];

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
      const matchesCategory =
        selectedCategory === 'Todos'
          ? categoryMatchesGroup(comercio.categoria, selectedCategoryGroup)
          : comercio.categoria === selectedCategory;
      const matchesCity = cityMatches(comercio.ciudad, selectedCity);
      const matchesSearch = matchesCommerceSearch(comercio, searchValue, publicacionesByCommerceId.get(comercio.id) ?? []);
      return matchesCategory && matchesCity && matchesSearch;
    });
  }, [comercios, publicacionesByCommerceId, searchValue, selectedCategory, selectedCategoryGroup, selectedCity]);

  const cityOptions = useMemo(() => getCityOptions(comercios), [comercios]);
  const categoryOptions = useMemo(() => getCategoriesForGroup(selectedCategoryGroup), [selectedCategoryGroup]);

  const quickActions = [
    {
      label: 'Ingresa a tu cuenta',
      description: 'Administra tu comercio y publicaciones.',
      cta: 'Entrar',
      href: '/login',
      Icon: Store
    },
    {
      label: 'Comercios cerca',
      description: 'Filtra por ciudad y categoria.',
      cta: 'Buscar',
      href: '/comercios',
      Icon: MapPin
    },
    {
      label: 'Ofertas recientes',
      description: 'Mira productos y servicios publicados.',
      cta: 'Ver ofertas',
      href: '#publicaciones',
      Icon: BadgePercent
    },
    {
      label: 'Categorias',
      description: 'Explora rubros populares.',
      cta: 'Explorar',
      href: '#categorias',
      Icon: Building2
    },
    {
      label: 'Comparte la guia',
      description: 'Pasa la app a otro cliente.',
      cta: 'Compartir',
      href: '#compartir',
      Icon: MessageCircle
    },
    {
      label: 'Vende con nosotros',
      description: 'Publica tus servicios gratis.',
      cta: 'Empezar',
      href: adminWhatsappUrl,
      Icon: BriefcaseBusiness,
      external: true
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
        <div className="mx-auto max-w-7xl px-3 pb-10 pt-5 sm:px-5 sm:pb-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-100">ComerciosPY</p>
              <h1 className="mt-2 max-w-[340px] text-[24px] font-black leading-[1.04] sm:max-w-3xl sm:text-4xl">
                Lo mejor de tu zona esta mas cerca.
              </h1>
              <p className="mt-2 max-w-[330px] text-[11px] font-bold uppercase leading-4 text-red-50 sm:max-w-xl sm:text-[12px]">
                <span className="sm:hidden">Busca comercios, servicios y ofertas.</span>
                <span className="hidden sm:inline">Busca comercios, servicios, ofertas y contactos por WhatsApp.</span>
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSearch();
                }}
                className="mt-4 flex max-w-full overflow-hidden rounded-md bg-white p-1 shadow-[0_14px_34px_rgba(127,29,29,0.28)] sm:max-w-3xl"
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

            <div className="grid max-w-full grid-cols-3 gap-2 rounded-md bg-white/12 p-2 ring-1 ring-white/15">
              {[
                { label: 'Comercios', value: visibleComercios.length },
                { label: 'Ciudades', value: cityOptions.length },
                { label: 'Avisos', value: publicaciones.length }
              ].map((item) => (
                <div key={item.label} className="min-w-0 rounded-md bg-white px-2 py-2 text-center text-slate-950">
                  <p className="text-lg font-black leading-none">{item.value}</p>
                  <p className="mt-1 text-[9px] font-bold uppercase text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-7 max-w-7xl space-y-3 px-3 sm:px-5">
        <section id="publicaciones" className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-black text-slate-950">Recien publicado</h2>
              <p className="text-[11px] font-semibold text-slate-500">Fotos, ofertas y articulos listos para consultar.</p>
            </div>
            <a
              href={adminWhatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-slate-950 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              Soy comercio
            </a>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {loadingPublicaciones ? (
              <p className="col-span-2 rounded-md border border-slate-200 bg-white p-3 text-[12px] font-semibold text-slate-500 shadow-sm sm:col-span-3 lg:col-span-4 xl:col-span-6">Cargando publicaciones...</p>
            ) : publicaciones.length > 0 ? (
              publicaciones
                .slice(0, 12)
                .map((publicacion) => <PublicacionCard key={publicacion.id} publicacion={publicacion} comercio={comerciosById.get(publicacion.comercioId)} variant="compact" />)
            ) : (
              <p className="col-span-2 rounded-md border border-slate-200 bg-white p-3 text-[12px] font-semibold text-slate-500 shadow-sm sm:col-span-3 lg:col-span-4 xl:col-span-6">No hay publicaciones recientes.</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.Icon;
            const content = (
              <>
                <div className="flex h-11 items-center justify-center rounded-md bg-slate-50 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black text-slate-950">{action.label}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-4 text-slate-500">{action.description}</p>
                  <span className="mt-2 inline-flex h-6 items-center rounded bg-red-50 px-2 text-[10px] font-bold text-accent">
                    {action.cta}
                  </span>
                </div>
              </>
            );

            return action.external ? (
              <a
                key={action.label}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[118px] min-w-0 flex-col gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm transition hover:border-red-200 hover:shadow-soft"
              >
                {content}
              </a>
            ) : (
              <Link
                key={action.label}
                href={action.href}
                className="flex min-h-[118px] min-w-0 flex-col gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm transition hover:border-red-200 hover:shadow-soft"
              >
                {content}
              </Link>
            );
          })}
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-black text-slate-950">Filtros rapidos</h2>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{visibleComercios.length} resultados disponibles</p>
              </div>
              <Link href="/comercios" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <FilterSelect id="home-city-filter" label="Ciudad" value={selectedCity} options={cityOptions} onChange={setSelectedCity} />
              <FilterSelect id="home-category-group-filter" label="Grupo" value={selectedCategoryGroup} options={categoryGroups} onChange={handleSelectCategoryGroup} />
              <FilterSelect id="home-category-filter" label="Categoria" value={selectedCategory} options={categoryOptions} onChange={handleSelectCategory} />
            </div>
          </div>

          <div id="compartir" className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[13px] font-black text-slate-950">ComerciosPY en tu celular</p>
            <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">Comparte la guia o guardala para encontrar contactos rapido.</p>
            <div className="mt-3">
              <ShareAppButton mode="panel" />
            </div>
          </div>
        </section>

        <section id="categorias" className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-black text-slate-950">Categorias</h2>
            <Link href="/comercios" className="text-[11px] font-bold text-accent">
              Mostrar todas
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTiles.map((tile) => {
              const Icon = tile.Icon;
              const href = tile.category === 'Todos' ? '/comercios' : `/comercios?category=${encodeURIComponent(tile.category)}`;
              return (
                <Link key={`${tile.label}-${tile.category}`} href={href} className="grid min-w-0 grid-cols-[54px_minmax(0,1fr)] overflow-hidden rounded-md border border-slate-200 transition hover:border-red-200 hover:bg-red-50/30 sm:grid-cols-[66px_minmax(0,1fr)]">
                  <div className="flex h-14 items-center justify-center bg-slate-50 text-slate-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex min-w-0 items-center px-3">
                    <p className="line-clamp-2 text-[12px] font-bold leading-4 text-slate-800">{tile.label}</p>
                  </div>
                </Link>
              );
            })}
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
