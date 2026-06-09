import type React from 'react';
import { useState } from 'react';
import { Search } from 'lucide-react';

type SearchSuggestion = {
  label: string;
  hint?: string;
};

type SearchBarProps = {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  placeholder?: string;
  buttonLabel?: string;
  size?: 'regular' | 'compact';
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (value: string) => void;
};

export function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Buscar ciudad, categoria, grupo, contacto o articulo',
  buttonLabel = 'Buscar',
  size = 'regular',
  suggestions = [],
  onSuggestionSelect
}: SearchBarProps) {
  const compact = size === 'compact';
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hasSuggestions = showSuggestions && suggestions.length > 0;

  return (
    <div className="relative">
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
              onChange={(event) => {
                setShowSuggestions(true);
                onChange?.(event);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
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

      {hasSuggestions ? (
        <div className="absolute left-0 right-0 top-[calc(100%_+_6px)] z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.label}-${suggestion.hint ?? ''}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setShowSuggestions(false);
                onSuggestionSelect?.(suggestion.label);
              }}
              className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left text-xs font-semibold text-slate-800 transition hover:bg-red-50 hover:text-accent"
            >
              <span className="truncate">{suggestion.label}</span>
              {suggestion.hint ? <span className="shrink-0 text-[10px] text-slate-400">{suggestion.hint}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
