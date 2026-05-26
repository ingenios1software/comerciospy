import { BadgePercent } from 'lucide-react';
import type { Publicacion } from '@/types';
import { formatPrice } from '@/lib/utils/format';

export function PublicacionCard({ publicacion }: { publicacion: Publicacion }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:border-slate-300">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {publicacion.imagenUrl ? (
          <img src={publicacion.imagenUrl} alt={publicacion.titulo} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <BadgePercent className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <span>{publicacion.tipo}</span>
          <span>{publicacion.ciudad}</span>
        </div>
        <div>
          <h3 className="line-clamp-2 text-base font-semibold text-slate-950">{publicacion.titulo}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{publicacion.descripcion}</p>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{formatPrice(publicacion.precio)}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{publicacion.categoria}</span>
        </div>
      </div>
    </article>
  );
}
