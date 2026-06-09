import { categories } from '@/lib/categories';
import { defaultCities } from '@/lib/cities';
import { normalizeSearchText } from '@/lib/search';
import type { Comercio, Publicacion } from '@/types';

export type SearchSuggestion = {
  label: string;
  hint: string;
};

const baseSuggestions: SearchSuggestion[] = [
  { label: 'Electricistas', hint: 'Servicio' },
  { label: 'Panaderias', hint: 'Rubro' },
  { label: 'Mecanicos', hint: 'Servicio' },
  { label: 'Farmacias', hint: 'Rubro' },
  { label: 'Ferreterias', hint: 'Rubro' },
  { label: 'Panaderia', hint: 'Categoria sugerida' },
  { label: 'Pan frances', hint: 'Producto' },
  { label: 'Pan de viga', hint: 'Producto' },
  { label: 'Chipa', hint: 'Producto' },
  { label: 'Aire acondicionado', hint: 'Servicio' },
  { label: 'Plomeria', hint: 'Servicio' },
  { label: 'Reparacion de celulares', hint: 'Servicio' }
];

const smartSuggestionGroups = [
  {
    triggers: ['pan', 'panaderia', 'panificados'],
    suggestions: ['Panaderia', 'Pan frances', 'Pan de viga', 'Chipa']
  },
  {
    triggers: ['elec', 'electric', 'electricista'],
    suggestions: ['Electricistas', 'Electricidad', 'Instalacion electrica']
  },
  {
    triggers: ['mec', 'mecanico', 'auto'],
    suggestions: ['Mecanicos', 'Autos', 'Reparacion de autos']
  },
  {
    triggers: ['far', 'farm'],
    suggestions: ['Farmacias', 'Medicamentos', 'Delivery farmacia']
  }
];

function uniqueByNormalized(items: SearchSuggestion[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = normalizeSearchText(item.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSmartSuggestions(query: string): SearchSuggestion[] {
  const normalizedQuery = normalizeSearchText(query);
  const matchingGroup = smartSuggestionGroups.find((group) =>
    group.triggers.some((trigger) => normalizedQuery.startsWith(trigger) || trigger.startsWith(normalizedQuery))
  );

  if (!matchingGroup) return [];
  return matchingGroup.suggestions.map((label) => ({ label, hint: 'Sugerencia' }));
}

function getDataSuggestions(comercios: Comercio[], publicaciones: Publicacion[]) {
  const commerceSuggestions = comercios.flatMap<SearchSuggestion>((comercio) => [
    { label: comercio.nombre, hint: 'Comercio' },
    { label: comercio.rubro, hint: comercio.ciudad },
    { label: comercio.categoria, hint: 'Categoria' },
    ...(comercio.servicios ?? []).map((servicio) => ({ label: servicio, hint: comercio.nombre }))
  ]);

  const publicationSuggestions = publicaciones.flatMap<SearchSuggestion>((publicacion) => [
    { label: publicacion.titulo, hint: publicacion.categoria },
    { label: publicacion.categoria, hint: 'Categoria' }
  ]);

  const categorySuggestions = categories
    .filter((category) => category.id !== 'Todos')
    .map((category) => ({ label: category.label, hint: 'Categoria' }));

  const citySuggestions = defaultCities
    .filter((city) => city.id !== 'Todas')
    .map((city) => ({ label: city.label, hint: 'Ciudad' }));

  return [...commerceSuggestions, ...publicationSuggestions, ...categorySuggestions, ...citySuggestions, ...baseSuggestions];
}

export function getSearchSuggestions(query: string, comercios: Comercio[], publicaciones: Publicacion[], limit = 6) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const smartSuggestions = getSmartSuggestions(query);
  const smartKeys = new Set(smartSuggestions.map((item) => normalizeSearchText(item.label)));
  const candidates = uniqueByNormalized([...smartSuggestions, ...getDataSuggestions(comercios, publicaciones)]);

  return candidates
    .filter((item) => {
      const normalizedLabel = normalizeSearchText(item.label);
      return smartKeys.has(normalizedLabel) || normalizedLabel.includes(normalizedQuery) || normalizedQuery.includes(normalizedLabel);
    })
    .sort((a, b) => {
      const normalizedA = normalizeSearchText(a.label);
      const normalizedB = normalizeSearchText(b.label);
      const aSmart = smartKeys.has(normalizedA) ? 0 : 1;
      const bSmart = smartKeys.has(normalizedB) ? 0 : 1;
      const aStarts = normalizedA.startsWith(normalizedQuery) ? 0 : 1;
      const bStarts = normalizedB.startsWith(normalizedQuery) ? 0 : 1;
      return aSmart - bSmart || aStarts - bStarts || a.label.length - b.label.length || a.label.localeCompare(b.label, 'es');
    })
    .slice(0, limit);
}
