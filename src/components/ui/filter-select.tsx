import type { Category } from '@/lib/categories';

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  options: Category[];
  onChange: (value: string) => void;
};

export function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <label htmlFor={id} className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
