import type { Comercio, CommercePreview } from '@/types';
import Link from 'next/link';

type CommerceCardProps = {
  comercio: CommercePreview | (Comercio & { imagen?: string });
};

export function CommerceCard({ comercio }: CommerceCardProps) {
  const imagen = 'imagen' in comercio ? comercio.imagen : comercio.portadaUrl;

  return (
    <Link
      href={`/comercios/${comercio.id}`}
      className="group block overflow-hidden rounded-3xl bg-slate-900/95 shadow-soft ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
    >
      <div className="h-44 overflow-hidden bg-slate-700">
        <img src={imagen} alt={comercio.nombre} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">{comercio.nombre}</p>
            <p className="mt-1 text-xs text-slate-500">{comercio.rubro}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {comercio.categoria}
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {comercio.ciudad}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-300">Publicaciones recientes y promociones aquí.</p>
      </div>
    </Link>
  );
}
