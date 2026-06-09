import type { Comercio, Publicacion } from '@/types';
import { formatPrice } from '@/lib/utils/format';

type CommerceContact = Pick<Comercio, 'id' | 'nombre' | 'whatsapp' | 'telefono'> | null | undefined;
type PublicationLocationCommerce = Partial<Pick<Comercio, 'ciudad' | 'barrio' | 'direccion'>> | null | undefined;

export function getPublicationMediaUrl(publicacion: Publicacion) {
  return publicacion.mediaUrl || publicacion.imagenUrl || '';
}

export function getPublicationCode(publicacion: Pick<Publicacion, 'id'>) {
  const cleanId = publicacion.id.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();
  return cleanId || publicacion.id.slice(0, 8).toUpperCase();
}

export function getPublicationAnchorId(publicacion: Pick<Publicacion, 'id'>) {
  return `p-${getPublicationCode(publicacion)}`;
}

export function getPublicationHref(publicacion: Publicacion) {
  return `/comercios/${publicacion.comercioId}#${getPublicationAnchorId(publicacion)}`;
}

export function formatPublicationPrice(
  publicacion: Pick<Publicacion, 'precio'>
) {
  const price = Number(publicacion.precio ?? 0);
  const hasPrice = Number.isFinite(price) && price > 0;

  return `Precio: ${hasPrice ? formatPrice(price) : '0'}`;
}

export function getPublicationLocationLabel(publicacion: Pick<Publicacion, 'ciudad' | 'barrio'>, comercio?: PublicationLocationCommerce) {
  const city = publicacion.ciudad || comercio?.ciudad || '';
  const neighborhood = publicacion.barrio || comercio?.barrio || '';

  if (neighborhood && city) return `${city}, ${neighborhood}`;
  if (neighborhood) return neighborhood;
  if (city) return city;

  return comercio?.direccion ?? '';
}

export function buildPublicationWhatsappMessage(publicacion: Publicacion, comercio?: CommerceContact, appOrigin = 'https://comerciospy.vercel.app') {
  const code = getPublicationCode(publicacion);
  const price = formatPublicationPrice(publicacion);
  const lines = [
    `Hola, quiero consultar por ${publicacion.titulo} (#${code}).`,
    price,
    `${appOrigin}${getPublicationHref(publicacion)}`
  ].filter(Boolean);

  return lines.join('\n');
}
