export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="rounded-[2rem] bg-slate-900/95 px-6 py-8 text-center shadow-soft ring-1 ring-white/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Cargando</p>
        <p className="mt-4 text-2xl font-semibold">Preparando la experiencia móvil...</p>
      </div>
    </main>
  );
}
