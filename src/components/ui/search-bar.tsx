import type React from 'react';
import { Search } from 'lucide-react';

type SearchBarProps = {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  placeholder?: string;
  buttonLabel?: string;
  size?: 'regular' | 'compact';
};

export function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Buscar comercios, ofertas o ciudad',
  buttonLabel = 'Buscar',
  size = 'regular'
}: SearchBarProps) {
  const compact = size === 'compact';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className={`border border-slate-200 bg-white transition focus-within:border-slate-400 ${
        compact ? 'rounded-lg p-1.5 shadow-sm' : 'rounded-2xl p-2 shadow-soft focus-within:shadow-glow'
      }`}
    >
      <label htmlFor="search" className="sr-only">Buscar comercios</label>
      <div className="flex items-center gap-2">
        <div className={`flex min-w-0 flex-1 items-center gap-2 bg-slate-50 px-3 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-slate-200 ${compact ? 'rounded-md' : 'rounded-xl'}`}>
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            id="search"
            type="search"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`${compact ? 'h-9' : 'h-11'} min-w-0 w-full bg-transparent text-sm font-medium text-slate-950 placeholder:font-normal placeholder:text-slate-400 outline-none`}
          />
        </div>
        <button
          type="submit"
          className={`${compact ? 'h-9 min-w-[68px] rounded-md px-3 text-xs' : 'h-11 min-w-[76px] rounded-xl px-4 text-sm'} inline-flex items-center justify-center bg-slate-950 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2`}
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
