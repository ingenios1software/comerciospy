import { categories } from '@/lib/categories';
import { createCategory } from './firestore';
import type { Categoria } from '@/types';

export const defaultCategorias: Categoria[] = categories.map((category) => ({
  id: category.id.toLowerCase(),
  nombre: category.label,
  activo: true,
  creadoEn: new Date().toISOString()
}));

export async function seedDefaultCategories() {
  return Promise.all(defaultCategorias.map((categoria) => createCategory(categoria)));
}
