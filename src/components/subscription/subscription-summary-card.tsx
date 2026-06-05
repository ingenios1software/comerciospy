import { CalendarClock, CreditCard, MessageCircle, Wallet } from 'lucide-react';
import { adminWhatsapp } from '@/lib/admin-contact';
import { daysUntilSubscription, isSubscriptionExpired, isSubscriptionExpiringSoon, type SubscriptionOwner } from '@/lib/subscription';
import { buildWhatsappUrl } from '@/lib/utils/format';
import type { PaymentStatus, SubscriptionStatus } from '@/types';

type SubscriptionSummaryCardProps = {
  owner?: SubscriptionOwner | null;
};

const subscriptionLabels: Record<SubscriptionStatus, string> = {
  trial: 'Prueba',
  active: 'Activa',
  past_due: 'Pago pendiente',
  expired: 'Vencida',
  cancelled: 'Cancelada'
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Atrasado',
  cancelled: 'Cancelado'
};

function formatDate(value?: string) {
  if (!value) return 'Sin fecha cargada';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(value?: number, currency = 'PYG') {
  if (!value) return 'Sin monto cargado';

  if (currency === 'PYG') {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0
    }).format(value);
  }

  return `${new Intl.NumberFormat('es-PY').format(value)} ${currency}`;
}

function getStatusTone(owner?: SubscriptionOwner | null) {
  if (isSubscriptionExpired(owner) || owner?.suscripcionEstado === 'expired' || owner?.suscripcionEstado === 'cancelled') {
    return {
      label: owner?.suscripcionEstado === 'cancelled' ? 'Cancelada' : 'Vencida',
      className: 'bg-rose-50 text-rose-700 ring-rose-100'
    };
  }

  if (owner?.suscripcionEstado === 'past_due' || owner?.estadoPago === 'overdue' || owner?.estadoPago === 'pending' || isSubscriptionExpiringSoon(owner)) {
    return {
      label: owner?.suscripcionEstado === 'past_due' ? 'Pago pendiente' : 'Atencion',
      className: 'bg-amber-50 text-amber-700 ring-amber-100'
    };
  }

  return {
    label: subscriptionLabels[owner?.suscripcionEstado ?? 'active'],
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  };
}

function getRemainingText(owner?: SubscriptionOwner | null) {
  const remainingDays = daysUntilSubscription(owner?.suscripcionVenceEn);
  if (remainingDays === null) return 'Fecha de pago no cargada.';
  if (remainingDays < 0) return `Vencio hace ${Math.abs(remainingDays)} dias.`;
  if (remainingDays === 0) return 'Vence hoy.';
  return `Faltan ${remainingDays} dias.`;
}

export function SubscriptionSummaryCard({ owner }: SubscriptionSummaryCardProps) {
  const status = getStatusTone(owner);
  const commerceName = owner?.nombre ?? 'mi comercio';
  const whatsappUrl = buildWhatsappUrl(
    adminWhatsapp,
    `Hola, quiero consultar mi plan y fecha de pago de ComerciosPY para ${commerceName}.`
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-accent">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Plan y pago</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{owner?.planNombre ?? 'Sin plan asignado'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Proximo pago: {formatDate(owner?.suscripcionVenceEn)}. {getRemainingText(owner)}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <CalendarClock className="h-4 w-4 text-slate-500" />
          <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Inicio</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatDate(owner?.suscripcionInicio)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <Wallet className="h-4 w-4 text-slate-500" />
          <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Monto mensual</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatAmount(owner?.montoMensual, owner?.moneda)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <CreditCard className="h-4 w-4 text-slate-500" />
          <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Estado de pago</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{paymentLabels[owner?.estadoPago ?? 'pending']}</p>
          <p className="mt-1 text-xs text-slate-500">{owner?.metodoPago ?? 'Metodo sin definir'}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">Estos datos los actualiza el administrador cuando se registra o renueva el pago.</p>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
          <MessageCircle className="h-4 w-4" />
          Consultar pago
        </a>
      </div>
    </section>
  );
}
