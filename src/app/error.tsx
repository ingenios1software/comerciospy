"use client";

import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-slate-950">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-glow">
        <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">Error</p>
        <h1 className="mt-4 text-3xl font-semibold">Algo no salio bien</h1>
        <p className="mt-3 text-sm text-slate-600">No pudimos cargar esta vista.</p>
        <p className="mt-2 text-xs text-slate-500">{error.message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => reset()} className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
            Reintentar
          </button>
          <Link href="/" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
