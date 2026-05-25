export function SearchBar() {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/95 p-4 shadow-soft">
      <label htmlFor="search" className="sr-only">Buscar comercios</label>
      <div className="flex items-center gap-3">
        <input
          id="search"
          type="search"
          placeholder="Buscar comercios, ofertas o ciudad"
          className="w-full rounded-3xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
        <button className="inline-flex h-12 min-h-[3rem] items-center justify-center rounded-full bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
          Buscar
        </button>
      </div>
    </div>
  );
}
