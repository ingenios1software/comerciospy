import Link from 'next/link';
import { sampleComercios } from '@/lib/mockData';

export default function MapaPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Mapa</p>
              <h1 className="mt-2 text-3xl font-semibold">Comercios cercanos</h1>
              <p className="mt-2 text-sm text-slate-400">Visualiza opciones locales y contacta rápido desde tu celular.</p>
            </div>
            <Link href="/comercios" className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Explorar comercios
            </Link>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
            <div className="h-72 overflow-hidden rounded-[2rem] bg-slate-800 text-center text-slate-400">
              <p className="mt-28 text-sm">Mapa interactivo listo para conectar con geolocalización.</p>
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cercanos</p>
            <div className="mt-4 space-y-4">
              {sampleComercios.map((comercio) => (
                <div key={comercio.id} className="rounded-3xl bg-slate-950/90 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-100">{comercio.nombre}</p>
                      <p className="text-sm text-slate-400">{comercio.rubro} · {comercio.ciudad}</p>
                    </div>
                    <Link href={`/comercios/${comercio.id}`} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
