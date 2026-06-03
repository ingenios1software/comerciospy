import Link from 'next/link';
import { MessageCircle, ShieldAlert } from 'lucide-react';
import { adminWhatsapp } from '@/lib/admin-contact';
import { getSubscriptionRenewalText } from '@/lib/subscription';
import { buildWhatsappUrl } from '@/lib/utils/format';
import type { SubscriptionOwner } from '@/lib/subscription';

type RenewalNoticeProps = {
  owner?: SubscriptionOwner | null;
  title?: string;
  showBackLink?: boolean;
};

export function RenewalNotice({ owner, title = 'Periodo vencido', showBackLink }: RenewalNoticeProps) {
  const commerceName = owner && 'nombre' in owner ? owner.nombre : '';
  const message = commerceName
    ? `Hola, quiero renovar mi suscripcion de ComerciosPY para ${commerceName}.`
    : 'Hola, quiero renovar mi suscripcion de ComerciosPY.';

  return (
    <section className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">Suscripcion</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-900">
              {getSubscriptionRenewalText(owner)} Tu comercio queda pausado en la guia publica hasta renovar el periodo.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[220px]">
          <a
            href={buildWhatsappUrl(adminWhatsapp, message)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            Renovar por WhatsApp
          </a>
          {showBackLink ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Volver al panel
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
