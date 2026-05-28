import { Code2 } from 'lucide-react';
import { developerBrand, developerSignature, developerTagline } from '@/lib/brand';

export function BrandFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 pb-28 pt-6 text-slate-600 sm:px-6 sm:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{developerSignature}</p>
          <p className="mt-1 text-xs">{developerTagline}</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          <Code2 className="h-4 w-4" />
          {developerBrand}
        </div>
      </div>
    </footer>
  );
}
