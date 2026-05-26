export const formatPrice = (value?: number | null) => {
  if (value == null) return '';
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0
  }).format(value);
};

export const cleanPhone = (value?: string | null) => (value ?? '').replace(/[^0-9]/g, '');

export const buildWhatsappUrl = (phone?: string | null, message?: string) => {
  const clean = cleanPhone(phone);
  const suffix = message ? `?text=${encodeURIComponent(message)}` : '';
  return clean ? `https://wa.me/${clean}${suffix}` : '#';
};

export const buildMapsUrl = (comercio: { ubicacionUrl?: string; direccion?: string; ciudad?: string; nombre?: string }) => {
  if (comercio.ubicacionUrl) return comercio.ubicacionUrl;
  const query = [comercio.nombre, comercio.direccion, comercio.ciudad].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export const buildPublicCommerceUrl = (id: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `${baseUrl.replace(/\/$/, '')}/comercios/${id}`;
};
