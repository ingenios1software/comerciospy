import type { Publicacion } from '@/types';
import { formatPrice } from '@/lib/utils/format';

export function PublicacionCard({ publicacion }: { publicacion: Publicacion }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-slate-900/95 shadow-soft ring-1 ring-white/10 transition hover:bg-slate-800">
      <div className="h-52 overflow-hidden bg-slate-700">
        <img src={publicacion.imagenUrl} alt={publicacion.titulo} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-cyan-300">
          <span>{publicacion.tipo}</span>
          <span>{publicacion.ciudad}</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-100">{publicacion.titulo}</h3>
        <p className="text-sm leading-6 text-slate-300">{publicacion.descripcion}</p>
        <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
          <span>{formatPrice(publicacion.precio)}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{publicacion.categoria}</span>
        </div>
      </div>
    </article>
  );
}
