import type React from 'react';
import { Search } from 'lucide-react';

type SearchBarProps = {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  placeholder?: string;
  buttonLabel?: string;
};

export function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Buscar comercios, ofertas o ciudad',
  buttonLabel = 'Buscar'
}: SearchBarProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className="rounded-2xl border border-slate-200 bg-white p-2 shadow-soft transition focus-within:border-slate-400 focus-within:shadow-glow"
    >
      <label htmlFor="search" className="sr-only">Buscar comercios</label>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-slate-200">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            id="search"
            type="search"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="h-11 w-full bg-transparent text-sm font-medium text-slate-950 placeholder:font-normal placeholder:text-slate-400 outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 min-w-[76px] items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
