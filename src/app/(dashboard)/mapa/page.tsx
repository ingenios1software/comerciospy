import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { CommerceCard } from '@/components/comercios/commerce-card';
import { sampleComercios } from '@/lib/mockData';

export default function MapaPage() {
  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Mapa</p>
              <h1 className="mt-2 text-3xl font-semibold">Ubicaciones de comercios</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Atajo para abrir cada negocio en Google Maps.</p>
            </div>
            <Link href="/comercios" className="inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
              Explorar guia
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex h-72 items-center justify-center rounded-3xl bg-slate-100 text-center text-slate-500">
            <div>
              <MapPin className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-3 text-sm">Mapa interactivo preparado para una integracion futura.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">Comercios con ubicacion</h2>
          {sampleComercios.map((comercio) => (
            <CommerceCard key={comercio.id} comercio={comercio} />
          ))}
        </section>
      </div>
    </main>
  );
}
