import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 text-center shadow-soft ring-1 ring-white/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Página no encontrada</h1>
        <p className="mt-3 text-sm text-slate-400">Vuelve al feed móvil para encontrar comercios, ofertas y novedades.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
