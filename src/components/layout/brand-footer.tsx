import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { developerBrand, developerSignature, developerTagline } from '@/lib/brand';

export function BrandFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 pb-28 pt-6 text-slate-600 sm:px-6 sm:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{developerSignature}</p>
          <p className="mt-1 text-xs">{developerTagline}</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600" aria-label="Informacion legal">
            <Link href="/privacidad" className="transition hover:text-accent">
              Privacidad
            </Link>
            <Link href="/eliminar-cuenta" className="transition hover:text-accent">
              Eliminar cuenta
            </Link>
          </nav>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Code2 className="h-4 w-4" />
            {developerBrand}
          </div>
        </div>
      </div>
    </footer>
  );
}
