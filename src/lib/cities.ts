import type { Comercio } from '@/types';

export type CityOption = {
  id: string;
  label: string;
};

export const allCitiesOption: CityOption = { id: 'Todas', label: 'Todas' };

export const defaultCities: CityOption[] = [
  allCitiesOption,
  { id: 'Asuncion', label: 'Asuncion' },
  { id: 'Fernando de la Mora', label: 'Fernando de la Mora' },
  { id: 'Luque', label: 'Luque' },
  { id: 'San Lorenzo', label: 'San Lorenzo' },
  { id: 'Capiata', label: 'Capiata' },
  { id: 'Lambare', label: 'Lambare' },
  { id: 'Mariano Roque Alonso', label: 'Mariano Roque Alonso' },
  { id: 'Encarnacion', label: 'Encarnacion' },
  { id: 'Ciudad del Este', label: 'Ciudad del Este' }
];

export const normalizeCity = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const cityMatches = (commerceCity: string, selectedCity: string) =>
  selectedCity === allCitiesOption.id || normalizeCity(commerceCity) === normalizeCity(selectedCity);

export function getCityOptions(comercios: Comercio[]): CityOption[] {
  const options = new Map(defaultCities.map((city) => [normalizeCity(city.id), city]));

  comercios.forEach((comercio) => {
    const city = comercio.ciudad.trim();
    if (city) {
      options.set(normalizeCity(city), { id: city, label: city });
    }
  });

  const [, ...cities] = Array.from(options.values());
  return [allCitiesOption, ...cities.sort((a, b) => a.label.localeCompare(b.label, 'es'))];
}
