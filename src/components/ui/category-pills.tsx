import type { Category } from '@/lib/categories';

type CategoryPillsProps = {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export function CategoryPills({ categories, selectedCategory, onSelectCategory }: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((category) => {
        const selected = selectedCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={`min-w-max rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              selected
                ? 'border-accent bg-accent text-white shadow-soft'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
