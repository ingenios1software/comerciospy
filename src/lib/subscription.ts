import type { Comercio, SubscriptionStatus, UsuarioApp } from '@/types';

type SubscriptionSubject = {
  suscripcionEstado?: SubscriptionStatus;
  suscripcionVenceEn?: string;
};

const blockedStatuses: SubscriptionStatus[] = ['expired', 'cancelled'];

function startOfToday(now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today;
}

export function daysUntilSubscription(value?: string, now = new Date()) {
  if (!value) return null;

  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  return Math.ceil((target.getTime() - startOfToday(now).getTime()) / 86400000);
}

export function isSubscriptionExpired(subscription?: SubscriptionSubject | null) {
  if (!subscription) return false;
  if (subscription.suscripcionEstado && blockedStatuses.includes(subscription.suscripcionEstado)) return true;

  const remainingDays = daysUntilSubscription(subscription.suscripcionVenceEn);
  return remainingDays !== null && remainingDays < 0;
}

export function isSubscriptionExpiringSoon(subscription?: SubscriptionSubject | null) {
  const remainingDays = daysUntilSubscription(subscription?.suscripcionVenceEn);
  return remainingDays !== null && remainingDays >= 0 && remainingDays <= 7;
}

export function isCommercePubliclyVisible(comercio?: Comercio | null) {
  return Boolean(comercio?.activo) && !isSubscriptionExpired(comercio);
}

export function getSubscriptionRenewalText(subscription?: SubscriptionSubject | null) {
  const remainingDays = daysUntilSubscription(subscription?.suscripcionVenceEn);

  if (remainingDays !== null && remainingDays < 0) {
    return `Vencio hace ${Math.abs(remainingDays)} dias.`;
  }

  if (subscription?.suscripcionEstado === 'cancelled') {
    return 'La suscripcion esta cancelada.';
  }

  return 'La suscripcion necesita renovacion.';
}

export function getSubscriptionVenceAt(value?: string) {
  if (!value) return null;

  const expiresAt = new Date(`${value}T23:59:59.999-04:00`);
  return Number.isNaN(expiresAt.getTime()) ? null : expiresAt;
}

export type SubscriptionOwner = UsuarioApp | Comercio;
