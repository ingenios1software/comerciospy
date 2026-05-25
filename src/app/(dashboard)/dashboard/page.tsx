import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { samplePublicaciones } from '@/lib/mockData';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar />
        <div className="mx-auto w-full max-w-4xl px-4 pb-28 py-6 sm:px-6 lg:px-8">
          <div className="space-y-6 rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold">Panel de control</h1>
              </div>
              <Link href="/publicar" className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Nueva publicación
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-950/90 p-5">
                <p className="text-sm text-slate-400">Comercios activos</p>
                <p className="mt-4 text-3xl font-semibold text-slate-100">12</p>
              </div>
              <div className="rounded-3xl bg-slate-950/90 p-5">
                <p className="text-sm text-slate-400">Publicaciones</p>
                <p className="mt-4 text-3xl font-semibold text-slate-100">24</p>
              </div>
              <div className="rounded-3xl bg-slate-950/90 p-5">
                <p className="text-sm text-slate-400">Usuarios</p>
                <p className="mt-4 text-3xl font-semibold text-slate-100">8</p>
              </div>
            </div>
            <div className="rounded-[2rem] bg-slate-950/90 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Actividades</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-100">Publicaciones recientes</h2>
                </div>
                <Link href="/publicar" className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700">
                  Agregar nueva
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {samplePublicaciones.slice(0, 2).map((publicacion) => (
                  <PublicacionCard key={publicacion.id} publicacion={publicacion} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
