import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-slate-950">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-glow">
        <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Pagina no encontrada</h1>
        <p className="mt-3 text-sm text-slate-600">Vuelve a la guia para encontrar comercios, servicios y contactos.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
