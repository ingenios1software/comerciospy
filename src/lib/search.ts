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
  'contacto',
  'nombre',
  'articulo',
  'articulos',
  'categoria',
  'categorias',
  'rubro',
  'rubros',
  'ciudad',
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
  const category = categories.find((item) => item.id === categoryId || item.label === categoryId);
  const normalizedCategoryId = category?.id ?? categoryId;
  const groups = categoryGroups.filter((group) => group.id !== 'Todos' && group.categoryIds.includes(normalizedCategoryId));

  return [
    categoryId,
    category?.id,
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

function termsMatchValue(terms: string[], value: SearchValue) {
  const normalizedValue = normalizeSearchText(value);
  return terms.length > 0 && terms.every((term) => normalizedValue.includes(term));
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

export function scoreCommerceSearch(comercio: Comercio, query: string, publicaciones: Publicacion[] = []) {
  const normalizedQuery = normalizeSearchText(query);
  const terms = getSearchTerms(query);

  if (!normalizedQuery || !terms.length || !matchesCommerceSearch(comercio, query, publicaciones)) return 0;

  const weightedValues: Array<{ value: SearchValue; weight: number }> = [
    { value: comercio.nombre, weight: 12 },
    { value: comercio.contactoNombre, weight: 10 },
    { value: comercio.ciudad, weight: 8 },
    { value: comercio.rubro, weight: 8 },
    { value: [comercio.categoria, getCategorySearchValues(comercio.categoria)], weight: 7 },
    { value: comercio.servicios, weight: 6 },
    { value: [comercio.descripcion, comercio.resumen], weight: 3 },
    ...publicaciones.flatMap((publicacion) => [
      { value: publicacion.titulo, weight: 10 },
      { value: [publicacion.categoria, publicacion.tipo, getCategorySearchValues(publicacion.categoria)], weight: 7 },
      { value: publicacion.descripcion, weight: 4 }
    ])
  ];

  const score = weightedValues.reduce((total, item) => {
    const normalizedValue = normalizeSearchText(item.value);
    const termMatches = terms.filter((term) => normalizedValue.includes(term)).length;
    const exactBonus = normalizedValue.includes(normalizedQuery) ? item.weight * 2 : 0;
    return total + termMatches * item.weight + exactBonus;
  }, 0);

  return score + terms.length;
}

export function getCommerceSearchMatchLabel(comercio: Comercio, query: string, publicaciones: Publicacion[] = []) {
  const terms = getSearchTerms(query);
  const matchedPublication = publicaciones.find((publicacion) => termsMatchValue(terms, getPublicationSearchValues(publicacion)));

  if (matchedPublication) return `Articulo: ${matchedPublication.titulo}`;
  if (termsMatchValue(terms, comercio.nombre)) return `Comercio: ${comercio.nombre}`;
  if (termsMatchValue(terms, comercio.contactoNombre)) return `Contacto: ${comercio.contactoNombre}`;
  if (termsMatchValue(terms, comercio.ciudad)) return `Ciudad: ${comercio.ciudad}`;
  if (termsMatchValue(terms, comercio.rubro)) return `Rubro: ${comercio.rubro}`;
  if (termsMatchValue(terms, [comercio.categoria, getCategorySearchValues(comercio.categoria)])) return `Categoria: ${comercio.categoria}`;
  if (termsMatchValue(terms, comercio.servicios)) return `Servicio relacionado`;

  return `${comercio.rubro} - ${comercio.ciudad}`;
}
