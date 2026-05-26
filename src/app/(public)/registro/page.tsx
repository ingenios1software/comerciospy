"use client";

import Link from 'next/link';
import { CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import { adminContactMessage, adminWhatsapp } from '@/lib/admin-contact';
import { buildWhatsappUrl } from '@/lib/utils/format';

const steps = [
  'Te escriben por WhatsApp con los datos del negocio.',
  'Vos confirmas el plan, el pago y el contenido inicial.',
  'Creas su usuario y el comercio empieza a cargar publicaciones.'
];

export default function RegistroPage() {
  const whatsappUrl = buildWhatsappUrl(adminWhatsapp, adminContactMessage);

  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Alta administrada</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Aparece en ComerciosPY con una ficha profesional y editable.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              El registro no es automatico. Primero conversamos, confirmamos el plan y despues se crea el acceso para que cada comercio administre su contenido.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-red-700"
            >
              <MessageCircle className="h-4 w-4" />
              Quiero aparecer
            </a>
            <Link
              href="/comercios"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-soft transition hover:border-slate-300"
            >
              Ver guia
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm leading-6 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Control comercial</p>
              <p className="text-xs text-slate-500">Vos decidis quien entra.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
            <p>Este flujo evita cuentas falsas, mantiene la calidad de la guia y te permite vender el alta antes de activar el panel.</p>
            <p>Cuando el comercio ya esta activo, puede entrar con su usuario para cargar fotos, publicaciones, servicios y descripciones con ayuda de IA.</p>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">WhatsApp de altas</p>
            <p className="mt-1">{adminWhatsapp}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
