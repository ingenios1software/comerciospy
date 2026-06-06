"use client";

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Trash2 } from 'lucide-react';
import { adminWhatsapp } from '@/lib/admin-contact';
import { useAuth } from '@/lib/firebase/auth-context';
import { buildWhatsappUrl } from '@/lib/utils/format';

export default function DeleteAccountPage() {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [commerceName, setCommerceName] = useState('');
  const [details, setDetails] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const effectiveEmail = email || user?.email || profile?.email || '';
  const effectiveName = commerceName || profile?.nombre || '';
  const requestMessage = useMemo(
    () =>
      [
        'Hola, solicito eliminar mi cuenta y los datos asociados en ComerciosPY.',
        `Email de la cuenta: ${effectiveEmail || 'No indicado'}`,
        `Nombre o comercio: ${effectiveName || 'No indicado'}`,
        details.trim() ? `Detalle: ${details.trim()}` : '',
        'Confirmo que deseo iniciar el proceso de eliminacion.'
      ]
        .filter(Boolean)
        .join('\n'),
    [details, effectiveEmail, effectiveName]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    window.open(buildWhatsappUrl(adminWhatsapp, requestMessage), '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-slate-200 pb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-accent">
            <Trash2 className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-accent">Control de cuenta</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Solicitar eliminacion de cuenta</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Desde aqui podes iniciar la eliminacion de tu cuenta de ComerciosPY y los datos asociados. La solicitud se envia a administracion para verificar tu identidad antes de borrar informacion.
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Que se elimina</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              'Acceso y perfil de usuario.',
              'Ficha comercial y datos de contacto.',
              'Fotos, videos y publicaciones asociadas.',
              'Datos operativos que ya no deban conservarse.'
            ].map((item) => (
              <div key={item} className="flex gap-3 border-b border-slate-200 pb-3 text-sm text-slate-600">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Algunos registros pueden conservarse cuando sean necesarios para cumplir obligaciones legales, prevenir fraude o resolver reclamos. La verificacion y eliminacion normalmente se completan dentro de 30 dias.
          </p>
        </section>

        <form className="mt-8 space-y-5 border-t border-slate-200 pt-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="delete-email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email de la cuenta
            </label>
            <input
              id="delete-email"
              type="email"
              value={effectiveEmail}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-red-100"
              required
            />
          </div>
          <div>
            <label htmlFor="delete-name" className="mb-2 block text-sm font-semibold text-slate-700">
              Nombre o comercio
            </label>
            <input
              id="delete-name"
              value={effectiveName}
              onChange={(event) => setCommerceName(event.target.value)}
              placeholder="Nombre para identificar la cuenta"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-red-100"
              required
            />
          </div>
          <div>
            <label htmlFor="delete-details" className="mb-2 block text-sm font-semibold text-slate-700">
              Detalle opcional
            </label>
            <textarea
              id="delete-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={3}
              placeholder="Informacion que nos ayude a identificar la cuenta"
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-red-100"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 accent-red-700"
              required
            />
            Confirmo que deseo iniciar la eliminacion de esta cuenta y sus datos asociados.
          </label>
          <button
            type="submit"
            disabled={!confirmed}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Enviar solicitud por WhatsApp
            <ExternalLink className="h-4 w-4" />
          </button>
          {submitted ? (
            <p className="text-sm leading-6 text-emerald-700">
              Se abrio WhatsApp con la solicitud preparada. Enviala para que administracion pueda comenzar la verificacion.
            </p>
          ) : null}
        </form>

        <p className="mt-8 text-sm text-slate-600">
          Consulta como tratamos tus datos en nuestra{' '}
          <Link href="/privacidad" className="font-semibold text-accent hover:underline">
            politica de privacidad
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
