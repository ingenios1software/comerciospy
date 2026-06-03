export type Category = {
  id: string;
  label: string;
};

export type CategoryGroup = Category & {
  categoryIds: string[];
};

export const categories: Category[] = [
  { id: 'Todos', label: 'Todas' },
  { id: 'Comida', label: 'Comida' },
  { id: 'Bebidas', label: 'Bebidas' },
  { id: 'Moda', label: 'Moda' },
  { id: 'Bienestar', label: 'Bienestar' },
  { id: 'Servicios', label: 'Servicios' },
  { id: 'Vivienda', label: 'Vivienda' },
  { id: 'Electricidad', label: 'Electricidad' },
  { id: 'Plomeria', label: 'Plomeria' },
  { id: 'Tecnologia', label: 'Tecnologia' },
  { id: 'Hogar', label: 'Hogar' },
  { id: 'Autos', label: 'Autos' }
];

export const categoryGroups: CategoryGroup[] = [
  { id: 'Todos', label: 'Todos los grupos', categoryIds: categories.filter((category) => category.id !== 'Todos').map((category) => category.id) },
  { id: 'Gastronomia', label: 'Gastronomia', categoryIds: ['Comida', 'Bebidas'] },
  { id: 'ModaBienestar', label: 'Moda y bienestar', categoryIds: ['Moda', 'Bienestar'] },
  { id: 'ServiciosLocales', label: 'Servicios locales', categoryIds: ['Servicios', 'Electricidad', 'Plomeria'] },
  { id: 'HogarVivienda', label: 'Hogar y vivienda', categoryIds: ['Vivienda', 'Hogar'] },
  { id: 'TecnologiaAutos', label: 'Tecnologia y autos', categoryIds: ['Tecnologia', 'Autos'] }
];

export function getCategoryGroupForCategory(categoryId: string) {
  return categoryGroups.find((group) => group.id !== 'Todos' && group.categoryIds.includes(categoryId))?.id ?? 'Todos';
}

export function getCategoriesForGroup(groupId: string) {
  const group = categoryGroups.find((item) => item.id === groupId);
  if (!group || group.id === 'Todos') return categories;

  const groupedCategories = categories.filter((category) => group.categoryIds.includes(category.id));
  return [{ id: 'Todos', label: 'Todas' }, ...groupedCategories];
}

export function categoryMatchesGroup(categoryId: string, groupId: string) {
  if (groupId === 'Todos') return true;
  const group = categoryGroups.find((item) => item.id === groupId);
  return Boolean(group?.categoryIds.includes(categoryId));
}
