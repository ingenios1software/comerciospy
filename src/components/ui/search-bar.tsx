import type React from 'react';

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
      className="rounded-3xl border border-slate-800/80 bg-slate-950/95 p-4 shadow-soft"
    >
      <label htmlFor="search" className="sr-only">Buscar comercios</label>
      <div className="flex items-center gap-3">
        <input
          id="search"
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-3xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
        <button
          type="submit"
          className="inline-flex h-12 min-h-[3rem] items-center justify-center rounded-full bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
