"use client";

import Link from 'next/link';
import { Edit3, PlusCircle, Sparkles, Store } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { DigitalBusinessCard } from '@/components/comercios/digital-business-card';
import { RenewalNotice } from '@/components/subscription/renewal-notice';
import { SubscriptionSummaryCard } from '@/components/subscription/subscription-summary-card';
import { useAuth } from '@/lib/firebase/auth-context';
import { getComercioById, getPublicationsByCommerce, markPublicationAsSold } from '@/lib/firebase/firestore';
import { samplePublicaciones } from '@/lib/mockData';
import { isSubscriptionExpired } from '@/lib/subscription';
import { PublicacionCard } from '@/components/publicaciones/publicacion-card';
import type { Comercio, Publicacion } from '@/types';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const subscriptionExpired = profile?.rol === 'comercio' && isSubscriptionExpired(profile);
  const publicationPreviewItems = useMemo(
    () => publicaciones.map((publicacion) => ({ publicacion, comercio })),
    [comercio, publicaciones]
  );

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.comercioId) return;

      try {
        const comercioData = await getComercioById(profile.comercioId);
        setComercio(comercioData);
      } catch {
        setComercio(null);
      }

      try {
        const publicacionesData = await getPublicationsByCommerce(profile.comercioId);
        setPublicaciones(publicacionesData);
      } catch {
        setPublicaciones(samplePublicaciones.filter((item) => item.comercioId === profile.comercioId));
      }
    };

    loadData();
  }, [profile?.comercioId]);

  const handleMarkSold = async (publicacion: Publicacion) => {
    setActionError('');
    setMarkingSoldId(publicacion.id);

    try {
      await markPublicationAsSold(publicacion.id);
      setPublicaciones((current) => current.filter((item) => item.id !== publicacion.id));
    } catch {
      setActionError('No se pudo marcar como vendido. Proba otra vez.');
    } finally {
      setMarkingSoldId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl py-24 text-center text-slate-500">Cargando panel...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-glow">
          <h1 className="text-2xl font-semibold">Acceso requerido</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Entra con la cuenta creada para tu comercio.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
            Iniciar sesion
          </Link>
        </div>
      </main>
    );
  }

  if (subscriptionExpired) {
    return (
      <main className="min-h-screen bg-surface text-slate-950">
        <div className="lg:flex lg:min-h-screen">
          <Sidebar />
          <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-8">
            <SubscriptionSummaryCard owner={profile} />
            <RenewalNotice owner={profile} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-slate-950">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar />
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-8">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Panel del comercio</p>
                  <h1 className="mt-2 text-3xl font-semibold">{comercio?.nombre ?? profile?.nombre ?? 'Mi comercio'}</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Actualiza tu ficha, carga fotos y publica novedades con ayuda de IA.</p>
                </div>
                {!subscriptionExpired ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href="/perfil" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      <Edit3 className="h-4 w-4" />
                      Editar ficha
                    </Link>
                    <Link href="/publicar" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                      <PlusCircle className="h-4 w-4" />
                      Publicar
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <Store className="h-5 w-5 text-accent" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Estado</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{subscriptionExpired ? 'Pausado' : comercio?.activo ? 'Activo' : 'Pendiente'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <PlusCircle className="h-5 w-5 text-emerald-600" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Publicaciones</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{publicaciones.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <Sparkles className="h-5 w-5 text-slate-700" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Asistente IA</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{subscriptionExpired ? 'Bloqueado' : 'Listo'}</p>
              </div>
            </section>

            {profile?.rol === 'comercio' ? <SubscriptionSummaryCard owner={profile} /> : null}

            {comercio ? (
              <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
                <DigitalBusinessCard comercio={comercio} />
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="text-lg font-semibold text-slate-950">Tu ficha es tu tarjeta</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Usa este enlace para presentarte en WhatsApp, estados, redes sociales o mensajes directos. Cada cliente abre tu ficha con telefono, ubicacion, horario, fotos y publicaciones.
                  </p>
                  {!subscriptionExpired ? (
                    <Link href={`/comercios/${comercio.id}`} className="mt-5 inline-flex rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                      Ver tarjeta publica
                    </Link>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Tus publicaciones</h2>
                  <p className="mt-1 text-sm text-slate-500">Contenido visible en la ficha del comercio.</p>
                </div>
                {!subscriptionExpired ? (
                  <Link href="/publicar" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Nueva
                  </Link>
                ) : null}
              </div>
              {actionError ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-accent">{actionError}</p>
              ) : null}
              <div className="grid gap-3 lg:grid-cols-3">
                {publicaciones.length > 0 ? (
                  publicaciones.map((publicacion) => (
                    <PublicacionCard
                      key={publicacion.id}
                      publicacion={publicacion}
                      comercio={comercio}
                      onMarkSold={handleMarkSold}
                      markingSold={markingSoldId === publicacion.id}
                      previewItems={publicationPreviewItems}
                    />
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">Todavia no hay publicaciones.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
