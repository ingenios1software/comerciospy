import type { Category } from '@/lib/categories';

type CategoryPillsProps = {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export function CategoryPills({ categories, selectedCategory, onSelectCategory }: CategoryPillsProps) {
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => {
        const selected = selectedCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelectCategory(category.id)}
            className={`min-w-max rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 ${
              selected
                ? 'border-slate-950 bg-slate-950 text-white shadow-soft'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
