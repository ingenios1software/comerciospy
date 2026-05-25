export const formatPrice = (value?: number | null) => {
  if (value == null) return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);
};
