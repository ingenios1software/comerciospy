import { getAppUrl } from './utils/format';

export const appShareTitle = 'ComerciosPY';

export const appShareText = 'Busca gratis comercios, servicios y contactos por ciudad en ComerciosPY.';

export function getAppShareUrl() {
  return getAppUrl();
}

export function getAppWhatsappShareUrl() {
  const message = `${appShareText} ${getAppShareUrl()}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
