import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/utils/format';

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard', '/perfil', '/publicar', '/login', '/carrito', '/favoritos']
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl
  };
}
