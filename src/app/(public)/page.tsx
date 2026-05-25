"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import { CategoryPills } from '@/components/ui/category-pills';
import { HeroSection } from '@/components/ui/hero-section';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeading } from '@/components/ui/section-heading';
import { categories } from '@/lib/categories';
import { getAllComercios, getLatestPublications } from '@/lib/firebase/firestore';
import { featuredComercios, samplePublicaciones } from '@/lib/mockData';
import type { Comercio, CommercePreview, Publicacion } from '@/types';

export default function Home() {
  const router = useRouter();
  const [comercios, setComercios] = useState<Array<Comercio | CommercePreview>>(featuredComercios);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(samplePublicaciones);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
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

  const visibleComercios = useMemo(() => {
    return comercios.filter((comercio) => {
      const matchesCategory = selectedCategory === 'Todos' || comercio.categoria === selectedCategory;
      const matchesSearch = [comercio.nombre, comercio.rubro, comercio.ciudad, comercio.categoria]
        .join(' ')
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [comercios, searchValue, selectedCategory]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchValue.trim()) {
      params.set('search', searchValue.trim());
    }

    if (selectedCategory !== 'Todos') {
      params.set('category', selectedCategory);
    }

    const queryString = params.toString();
    router.push(`/comercios${queryString ? `?${queryString}` : ''}`);
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();

    if (category !== 'Todos') {
      params.set('category', category);
    }

    router.push(`/comercios${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-32 pt-28 sm:px-6">
        <HeroSection />

        <section className="mt-6 rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <SectionHeading
            title="Guía inteligente de comercios locales"
            description="Encuentra ofertas, horarios y comercios verificados con una experiencia móvil rápida e intuitiva."
          />

          <div className="mt-6 space-y-5">
            <SearchBar
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onSubmit={handleSearch}
              placeholder="Busca por comercio, categoría o ciudad"
              buttonLabel="Ir"
            />

            <div className="space-y-4 rounded-[2rem] bg-slate-950/90 p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Categorías</p>
              <CategoryPills
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/comercios" className="rounded-[2rem] bg-slate-950/90 p-5 text-left shadow-soft ring-1 ring-white/10 transition hover:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Explorar</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-50">Navega comercios por categoría</h3>
                <p className="mt-3 text-sm text-slate-400">Descubre negocios locales, ofertas y servicios con un solo toque.</p>
              </Link>
              <Link href="/registro" className="rounded-[2rem] bg-cyan-500/95 p-5 text-left shadow-soft ring-1 ring-cyan-400/20 transition hover:bg-cyan-400">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-950/70">Vende aquí</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">Registra tu comercio</h3>
                <p className="mt-3 text-sm text-slate-950/80">Publica tu negocio y llega a clientes móviles en pocos minutos.</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-slate-900/90 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Destacados</p>
              <h2 className="mt-2 text-xl font-semibold">Comercios favoritos</h2>
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
            ) : visibleComercios.length > 0 ? (
              visibleComercios.slice(0, 4).map((comercio) => <CommerceCard key={comercio.id} comercio={comercio} />)
            ) : (
              <p className="text-slate-400">No se encontraron comercios que coincidan con tu búsqueda.</p>
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
