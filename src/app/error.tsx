"use client";

import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 text-center shadow-soft ring-1 ring-white/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Error</p>
        <h1 className="mt-4 text-3xl font-semibold">Algo no salió bien</h1>
        <p className="mt-3 text-sm text-slate-400">Estamos reintentando cargar la experiencia móvil.</p>
        <p className="mt-2 text-xs text-slate-500">{error.message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => reset()} className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Reintentar
          </button>
          <Link href="/" className="rounded-full border border-slate-700 bg-transparent px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
