import type { Metadata } from 'next';
import { CommerceDetailClient } from '@/components/comercios/commerce-detail-client';
import { getPublicComercioById, getPublicPublicationsByCommerce } from '@/lib/firebase/firestore-public';
import { getAppUrl } from '@/lib/utils/format';
import type { Comercio } from '@/types';

type ComercioDetailPageProps = {
  params: Promise<{ id: string }>;
};

function truncateText(value: string, maxLength: number) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function getCommerceSeoTitle(comercio: Comercio) {
  return `${comercio.nombre} | ${comercio.rubro} en ${comercio.ciudad} | ComerciosPY`;
}

function getCommerceSeoDescription(comercio: Comercio) {
  return truncateText(`${comercio.nombre} en ${comercio.ciudad}: ${comercio.rubro}. ${comercio.resumen ?? comercio.descripcion}`, 155);
}

function getCommerceImages(comercio: Comercio) {
  return [comercio.portadaUrl, comercio.logoUrl, ...(comercio.fotos ?? [])].filter(Boolean);
}

function buildLocalBusinessJsonLd(comercio: Comercio) {
  const appUrl = getAppUrl();
  const images = getCommerceImages(comercio);
  const hasCoordinates = Number.isFinite(comercio.ubicacion?.lat) && Number.isFinite(comercio.ubicacion?.lng);

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${appUrl}/comercios/${comercio.id}#business`,
    name: comercio.nombre,
    description: comercio.descripcion,
    url: `${appUrl}/comercios/${comercio.id}`,
    image: images.length > 0 ? images : undefined,
    telephone: comercio.telefono ?? comercio.whatsapp,
    address: {
      '@type': 'PostalAddress',
      streetAddress: comercio.direccion,
      addressLocality: comercio.ciudad,
      addressCountry: 'PY'
    },
    geo: hasCoordinates
      ? {
          '@type': 'GeoCoordinates',
          latitude: comercio.ubicacion.lat,
          longitude: comercio.ubicacion.lng
        }
      : undefined
  };
}

export async function generateMetadata({ params }: ComercioDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const comercio = await getPublicComercioById(id);

  if (!comercio) {
    return {
      title: 'Comercio no encontrado | ComerciosPY',
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const title = getCommerceSeoTitle(comercio);
  const description = getCommerceSeoDescription(comercio);
  const images = getCommerceImages(comercio);

  return {
    title,
    description,
    alternates: {
      canonical: `/comercios/${comercio.id}`
    },
    openGraph: {
      title,
      description,
      url: `/comercios/${comercio.id}`,
      siteName: 'ComerciosPY',
      locale: 'es_PY',
      type: 'website',
      images: images.map((url) => ({
        url,
        alt: comercio.nombre
      }))
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
      images
    }
  };
}

export default async function ComercioDetailPage({ params }: ComercioDetailPageProps) {
  const { id } = await params;
  const comercio = await getPublicComercioById(id);
  const publicaciones = comercio ? await getPublicPublicationsByCommerce(comercio.id) : [];

  return (
    <>
      {comercio ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildLocalBusinessJsonLd(comercio)).replace(/</g, '\\u003c')
          }}
        />
      ) : null}
      <CommerceDetailClient commerceId={id} initialComercio={comercio} initialPublicaciones={publicaciones} />
    </>
  );
}
