import type { MetadataRoute } from 'next';
import { getPublicComerciosForSeo } from '@/lib/firebase/firestore-public';
import { getAppUrl } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

function getLastModified(value?: string) {
  if (!value) return new Date();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const now = new Date();
  const comercios = await getPublicComerciosForSeo();

  return [
    {
      url: `${appUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: `${appUrl}/comercios`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${appUrl}/planes`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6
    },
    {
      url: `${appUrl}/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${appUrl}/eliminar-cuenta`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    ...comercios.map((comercio) => ({
      url: `${appUrl}/comercios/${encodeURIComponent(comercio.id)}`,
      lastModified: getLastModified(comercio.creadoEn),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))
  ];
}
