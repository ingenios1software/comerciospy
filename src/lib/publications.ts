import type { Comercio, Publicacion } from '@/types';
import { formatPrice } from '@/lib/utils/format';

type CommerceContact = Pick<Comercio, 'id' | 'nombre' | 'whatsapp' | 'telefono'> | null | undefined;

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

export function buildPublicationWhatsappMessage(publicacion: Publicacion, comercio?: CommerceContact, appOrigin = 'https://comerciospy.vercel.app') {
  const code = getPublicationCode(publicacion);
  const price = formatPrice(publicacion.precio);
  const lines = [
    `Hola, quiero consultar por ${publicacion.titulo} (#${code}).`,
    price ? `Precio: ${price}` : '',
    `${appOrigin}${getPublicationHref(publicacion)}`
  ].filter(Boolean);

  return lines.join('\n');
}
