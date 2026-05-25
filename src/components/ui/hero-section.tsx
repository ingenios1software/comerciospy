import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="rounded-[2rem] bg-slate-900/90 px-5 py-7 shadow-soft ring-1 ring-white/10 sm:px-6">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Bienvenido</p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">La plataforma móvil para comercios locales.</h1>
        <p className="max-w-xl text-sm text-slate-300 sm:text-base">
          Regístrate, publica ofertas y haz que tus clientes te encuentren desde el celular.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/registro" className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 sm:w-auto">
            Regístrate ahora
          </Link>
          <Link href="/comercios" className="inline-flex w-full items-center justify-center rounded-full border border-slate-700 bg-transparent px-5 py-3 text-sm text-slate-300 transition hover:bg-slate-800 sm:w-auto">
            Buscar comercios
          </Link>
        </div>
      </div>
    </section>
  );
}
