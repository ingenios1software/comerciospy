import type { Category } from '@/lib/categories';

type CategoryPillsProps = {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export function CategoryPills({ categories, selectedCategory, onSelectCategory }: CategoryPillsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((category) => {
        const selected = selectedCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={`min-w-max rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selected
                ? 'border-cyan-400 bg-cyan-500 text-slate-950 shadow-soft'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-400 hover:bg-slate-800'
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
