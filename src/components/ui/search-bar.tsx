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
      className="rounded-2xl border border-slate-200 bg-white p-2 shadow-soft"
    >
      <label htmlFor="search" className="sr-only">Buscar comercios</label>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            id="search"
            type="search"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="h-11 w-full bg-transparent text-sm text-slate-950 placeholder:text-slate-400 outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 min-w-[76px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
