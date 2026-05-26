export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface text-slate-950">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.26em] text-accent">Cargando</p>
        <p className="mt-4 text-2xl font-semibold">Preparando la guia...</p>
      </div>
    </main>
  );
}
