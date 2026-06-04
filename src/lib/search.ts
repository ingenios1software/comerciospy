import { categories, categoryGroups } from '@/lib/categories';
import type { Comercio, Publicacion } from '@/types';

type SearchValue = string | number | null | undefined | SearchValue[];

const stopWords = new Set([
  'busco',
  'buscar',
  'quiero',
  'necesito',
  'encontrar',
  'encuentra',
  'mostrame',
  'muestrame',
  'donde',
  'hay',
  'un',
  'una',
  'unos',
  'unas',
  'el',
  'la',
  'los',
  'las',
  'de',
  'del',
  'para',
  'por',
  'favor',
  'en',
  'cerca',
  'comercio',
  'negocio',
  'servicio',
  'servicios',
  'y'
]);

function flattenSearchValues(values: SearchValue[]): string[] {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return flattenSearchValues(value);
    if (value === null || value === undefined) return [];
    return String(value);
  });
}

export function normalizeSearchText(value: SearchValue) {
  return flattenSearchValues([value])
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSearchTerms(query: string) {
  const normalized = normalizeSearchText(query);
  const terms = normalized.split(' ').filter((term) => term && !stopWords.has(term));

  return terms.length > 0 ? terms : normalized.split(' ').filter(Boolean);
}

function getCategorySearchValues(categoryId: string) {
  const category = categories.find((item) => item.id === categoryId);
  const groups = categoryGroups.filter((group) => group.id !== 'Todos' && group.categoryIds.includes(categoryId));

  return [
    categoryId,
    category?.label,
    ...groups.flatMap((group) => [group.id, group.label])
  ];
}

function getPublicationSearchValues(publicacion: Publicacion) {
  return [
    publicacion.titulo,
    publicacion.descripcion,
    publicacion.tipo,
    publicacion.categoria,
    publicacion.ciudad,
    getCategorySearchValues(publicacion.categoria)
  ];
}

export function buildCommerceSearchText(comercio: Comercio, publicaciones: Publicacion[] = []) {
  return normalizeSearchText([
    comercio.nombre,
    comercio.contactoNombre,
    comercio.rubro,
    comercio.categoria,
    getCategorySearchValues(comercio.categoria),
    comercio.descripcion,
    comercio.resumen,
    comercio.ciudad,
    comercio.direccion,
    comercio.telefono,
    comercio.whatsapp,
    comercio.horario,
    comercio.servicios,
    publicaciones.map(getPublicationSearchValues)
  ]);
}

export function matchesCommerceSearch(comercio: Comercio, query: string, publicaciones: Publicacion[] = []) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchText = buildCommerceSearchText(comercio, publicaciones);
  if (searchText.includes(normalizedQuery)) return true;

  return getSearchTerms(normalizedQuery).every((term) => searchText.includes(term));
}
