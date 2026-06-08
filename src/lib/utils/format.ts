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

const formatCoordinate = (value: number) => value.toFixed(6).replace(/\.?0+$/, '');

const getUsableCoordinates = (lat?: number, lng?: number) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === undefined || lng === undefined || (lat === 0 && lng === 0)) {
    return null;
  }

  return { lat, lng };
};

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const isZeroCoordinateLocation = (value: string) => {
  const text = safeDecodeURIComponent(value.trim());

  return (
    /(?:^|[?&=,@\s])0(?:\.0+)?\s*,\s*0(?:\.0+)?(?:$|[&,\s])/.test(text) ||
    /0[\u00b0\u00ba]\s*0['\u2019]\s*0(?:\.0+)?["\u201d]?[NS]\s+0[\u00b0\u00ba]\s*0['\u2019]\s*0(?:\.0+)?["\u201d]?[EW]/i.test(text)
  );
};

const buildAutomaticMapsQuery = (comercio: {
  direccion?: string;
  ciudad?: string;
  nombre?: string;
  telefono?: string;
  whatsapp?: string;
}) => {
  const phone = cleanPhone(comercio.whatsapp || comercio.telefono);
  const locationHint = phone || comercio.direccion;

  return [comercio.nombre, comercio.ciudad, locationHint].filter(Boolean).join(' ');
};

export const buildMapsUrl = (comercio: {
  ubicacionUrl?: string;
  ubicacion?: {
    lat?: number;
    lng?: number;
  };
  direccion?: string;
  ciudad?: string;
  nombre?: string;
  telefono?: string;
  whatsapp?: string;
}) => {
  const lat = comercio.ubicacion?.lat;
  const lng = comercio.ubicacion?.lng;

  const savedUrl = comercio.ubicacionUrl?.trim();
  if (savedUrl && !isZeroCoordinateLocation(savedUrl)) return savedUrl;

  const coordinates = getUsableCoordinates(lat, lng);

  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${formatCoordinate(coordinates.lat)},${formatCoordinate(coordinates.lng)}`;
  }

  const query = buildAutomaticMapsQuery(comercio);
  if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return 'https://www.google.com/maps';
};

export const buildPublicCommerceUrl = (id: string, options?: { installPrompt?: boolean }) => {
  const installQuery = options?.installPrompt ? '?install=1&source=digital-card' : '';

  return `${getAppUrl()}/comercios/${id}${installQuery}`;
};

export const getAppUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comerciospy.vercel.app';
  return baseUrl.replace(/\/$/, '');
};
