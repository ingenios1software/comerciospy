"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  MapPin,
  MessageCircle,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Store,
  XCircle
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/firebase/auth-context';
import {
  getAllComerciosForAdmin,
  getAllPlansForAdmin,
  getAllPublicationsForAdmin,
  getAllUsers,
  updateCommerce,
  updatePublication
} from '@/lib/firebase/firestore';
import { formatPrice } from '@/lib/utils/format';
import { isCommercePubliclyVisible, isSubscriptionExpired } from '@/lib/subscription';
import type { Comercio, CommerceMetrics, CommerceVisibilityStatus, PlanComercial, Publicacion, UsuarioApp } from '@/types';

type PublicationFilter = 'pending' | 'rejected' | 'approved' | 'all';

const publicationFilters: Array<{ value: PublicationFilter; label: string }> = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'all', label: 'Todas' }
];

const metricLabels: Array<{ key: keyof CommerceMetrics; label: string }> = [
  { key: 'visitasFicha', label: 'Visitas' },
  { key: 'clicsWhatsapp', label: 'WhatsApp' },
  { key: 'clicsLlamar', label: 'Llamar' },
  { key: 'clicsMapa', label: 'Mapa' },
  { key: 'favoritos', label: 'Favoritos' },
  { key: 'compartidos', label: 'Compartidos' }
];

function getVisibilityStatus(comercio: Comercio): CommerceVisibilityStatus {
  if (comercio.visibilidadEstado) return comercio.visibilidadEstado;
  return comercio.activo ? 'publicado' : 'pendiente';
}

function getMetric(comercio: Comercio, key: keyof CommerceMetrics) {
  return comercio.metricas?.[key] ?? 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-PY').format(value);
}

function getPublicationModeration(publicacion: Publicacion) {
  return publicacion.moderacionEstado ?? 'approved';
}

export default function AdminDashboardPage() {
  const { profile, loading } = useAuth();
  const [users, setUsers] = useState<UsuarioApp[]>([]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [plans, setPlans] = useState<PlanComercial[]>([]);
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('pending');
  const [editingPublication, setEditingPublication] = useState<Publicacion | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const canManage = profile?.rol === 'superadmin';

  const loadData = async () => {
    if (!canManage) return;
    setLoadingData(true);
    setError('');

    try {
      const [usersData, comerciosData, publicacionesData, plansData] = await Promise.all([
        getAllUsers(),
        getAllComerciosForAdmin(),
        getAllPublicationsForAdmin(),
        getAllPlansForAdmin()
      ]);
      setUsers(usersData);
      setComercios(comerciosData);
      setPublicaciones(publicacionesData);
      setPlans(plansData);
    } catch {
      setError('No se pudo cargar el panel Super Admin.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const commerceUsers = useMemo(() => users.filter((user) => user.rol === 'comercio'), [users]);
  const comerciosById = useMemo(() => new Map(comercios.map((comercio) => [comercio.id, comercio])), [comercios]);

  const publicationCounts = useMemo(() => {
    return publicaciones.reduce(
      (counts, publicacion) => {
        const moderation = getPublicationModeration(publicacion);
        counts[moderation] += 1;
        return counts;
      },
      { approved: 0, pending: 0, rejected: 0 } as Record<'approved' | 'pending' | 'rejected', number>
    );
  }, [publicaciones]);

  const kpis = useMemo(() => {
    const visibleComercios = comercios.filter(isCommercePubliclyVisible);
    const pendingComercios = comercios.filter((comercio) => getVisibilityStatus(comercio) === 'pendiente');
    const cities = new Set(comercios.map((comercio) => comercio.ciudad.trim()).filter(Boolean));
    const whatsappClicks = comercios.reduce((total, comercio) => total + getMetric(comercio, 'clicsWhatsapp'), 0);
    const activePlans = plans.filter((plan) => plan.activo).length;
    const expiredUsers = commerceUsers.filter(isSubscriptionExpired);
    const estimatedBilling = commerceUsers
      .filter((user) => !isSubscriptionExpired(user) && user.suscripcionEstado !== 'cancelled')
      .reduce((total, user) => total + (user.montoMensual ?? 0), 0);

    return [
      { label: 'Comercios registrados', value: formatNumber(comercios.length), icon: Building2 },
      { label: 'Comercios activos', value: formatNumber(visibleComercios.length), icon: Store },
      { label: 'Comercios pendientes', value: formatNumber(pendingComercios.length), icon: Clock3, warning: pendingComercios.length > 0 },
      { label: 'Publicaciones activas', value: formatNumber(publicaciones.filter((item) => item.activo && getPublicationModeration(item) === 'approved').length), icon: BadgeCheck },
      { label: 'Publicaciones pendientes', value: formatNumber(publicationCounts.pending), icon: CalendarClock, warning: publicationCounts.pending > 0 },
      { label: 'Ciudades registradas', value: formatNumber(cities.size), icon: MapPin },
      { label: 'Clics en WhatsApp', value: formatNumber(whatsappClicks), icon: MessageCircle },
      { label: 'Planes activos', value: formatNumber(activePlans), icon: CheckCircle2 },
      { label: 'Vencidos', value: formatNumber(expiredUsers.length), icon: XCircle, danger: expiredUsers.length > 0 },
      { label: 'Facturación mensual estimada', value: formatPrice(estimatedBilling) || 'Gs. 0', icon: BarChart3 }
    ];
  }, [commerceUsers, comercios, plans, publicationCounts.pending, publicaciones]);

  const filteredPublications = useMemo(() => {
    return publicaciones
      .filter((publicacion) => publicationFilter === 'all' || getPublicationModeration(publicacion) === publicationFilter)
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  }, [publicationFilter, publicaciones]);

  const pendingComercios = useMemo(
    () => comercios.filter((comercio) => getVisibilityStatus(comercio) === 'pendiente' || getVisibilityStatus(comercio) === 'suspendido'),
    [comercios]
  );

  const topStats = useMemo(
    () =>
      [...comercios]
        .sort((a, b) => getMetric(b, 'visitasFicha') + getMetric(b, 'clicsWhatsapp') - (getMetric(a, 'visitasFicha') + getMetric(a, 'clicsWhatsapp')))
        .slice(0, 8),
    [comercios]
  );

  const approvePublication = async (publicacion: Publicacion) => {
    setStatusMessage('');
    setError('');

    try {
      await updatePublication(publicacion.id, {
        moderacionEstado: 'approved',
        rechazoMotivo: '',
        activo: true
      });
      setPublicaciones((current) =>
        current.map((item) => (item.id === publicacion.id ? { ...item, moderacionEstado: 'approved', rechazoMotivo: '', activo: true } : item))
      );
      setStatusMessage('Publicación aprobada.');
    } catch {
      setError('No se pudo aprobar la publicación.');
    }
  };

  const rejectPublication = async (publicacion: Publicacion) => {
    const reason = window.prompt('Motivo del rechazo', publicacion.rechazoMotivo ?? 'Contenido a revisar') ?? '';
    setStatusMessage('');
    setError('');

    try {
      await updatePublication(publicacion.id, {
        moderacionEstado: 'rejected',
        rechazoMotivo: reason.trim(),
        activo: false
      });
      setPublicaciones((current) =>
        current.map((item) => (item.id === publicacion.id ? { ...item, moderacionEstado: 'rejected', rechazoMotivo: reason.trim(), activo: false } : item))
      );
      setStatusMessage('Publicación rechazada.');
    } catch {
      setError('No se pudo rechazar la publicación.');
    }
  };

  const startEditPublication = (publicacion: Publicacion) => {
    setEditingPublication(publicacion);
    setEditTitle(publicacion.titulo);
    setEditDescription(publicacion.descripcion);
    setEditPrice(publicacion.precio ? String(publicacion.precio) : '');
  };

  const savePublicationEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPublication) return;
    setStatusMessage('');
    setError('');

    const update: Partial<Publicacion> = {
      titulo: editTitle.trim(),
      descripcion: editDescription.trim(),
      precio: editPrice ? Number(editPrice) : null
    };

    try {
      await updatePublication(editingPublication.id, update);
      setPublicaciones((current) => current.map((item) => (item.id === editingPublication.id ? { ...item, ...update } : item)));
      setEditingPublication(null);
      setStatusMessage('Publicación editada.');
    } catch {
      setError('No se pudo editar la publicación.');
    }
  };

  const updateCommerceVisibility = async (comercio: Comercio, visibilidadEstado: CommerceVisibilityStatus) => {
    setStatusMessage('');
    setError('');

    try {
      await updateCommerce(comercio.id, {
        visibilidadEstado,
        activo: visibilidadEstado === 'publicado',
        verificado: visibilidadEstado === 'publicado' ? true : comercio.verificado
      });
      setComercios((current) =>
        current.map((item) =>
          item.id === comercio.id
            ? {
                ...item,
                visibilidadEstado,
                activo: visibilidadEstado === 'publicado',
                verificado: visibilidadEstado === 'publicado' ? true : item.verificado
              }
            : item
        )
      );
      setStatusMessage('Estado del comercio actualizado.');
    } catch {
      setError('No se pudo actualizar el comercio.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl py-24 text-center text-slate-500">Cargando Super Admin...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-slate-950">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar />
        <div className="mx-auto w-full max-w-7xl space-y-5 px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Super Admin</p>
                <h1 className="mt-2 text-3xl font-semibold">Control SaaS ComerciosPY</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Comercios, publicaciones, vencimientos, visibilidad y monetización en un solo panel.</p>
              </div>
              <button
                type="button"
                onClick={loadData}
                disabled={loadingData || !canManage}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
            </div>

            {!canManage ? (
              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Acceso solo para superadmin</p>
                <p>Tu cuenta no puede administrar comercios, planes ni aprobaciones.</p>
              </div>
            ) : null}
          </section>

          {canManage ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <article key={kpi.label} className={`rounded-2xl border bg-white p-4 shadow-soft ${kpi.danger ? 'border-rose-100' : kpi.warning ? 'border-amber-100' : 'border-slate-200'}`}>
                      <Icon className={`h-5 w-5 ${kpi.danger ? 'text-rose-600' : kpi.warning ? 'text-amber-600' : 'text-accent'}`} />
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{kpi.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{kpi.value}</p>
                    </article>
                  );
                })}
              </section>

              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Aprobación</p>
                      <h2 className="mt-2 text-2xl font-semibold">Publicaciones</h2>
                      <p className="mt-1 text-sm text-slate-500">Revisá, editá y moderá contenido publicado por los comercios.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {publicationFilters.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setPublicationFilter(filter.value)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            publicationFilter === filter.value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{statusMessage}</p> : null}
                  {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

                  <div className="mt-5 space-y-3">
                    {filteredPublications.length > 0 ? (
                      filteredPublications.slice(0, 20).map((publicacion) => {
                        const comercio = comerciosById.get(publicacion.comercioId);
                        const moderation = getPublicationModeration(publicacion);

                        return (
                          <article key={publicacion.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                                      moderation === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : moderation === 'rejected'
                                          ? 'bg-rose-50 text-rose-700'
                                          : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {moderation === 'approved' ? 'Aprobada' : moderation === 'rejected' ? 'Rechazada' : 'Pendiente'}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500">{comercio?.nombre ?? publicacion.comercioId}</span>
                                </div>
                                <h3 className="mt-2 text-base font-semibold text-slate-950">{publicacion.titulo}</h3>
                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{publicacion.descripcion}</p>
                                {publicacion.rechazoMotivo ? <p className="mt-2 text-xs font-semibold text-rose-600">Motivo: {publicacion.rechazoMotivo}</p> : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => approvePublication(publicacion)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">
                                  Aprobar
                                </button>
                                <button type="button" onClick={() => rejectPublication(publicacion)} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">
                                  Rechazar
                                </button>
                                <button type="button" onClick={() => startEditPublication(publicacion)} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </button>
                                <Link href={`/comercios/${publicacion.comercioId}#publicaciones`} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
                                  <Eye className="h-3.5 w-3.5" />
                                  Ver ficha
                                </Link>
                              </div>
                            </div>

                            {editingPublication?.id === publicacion.id ? (
                              <form className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4" onSubmit={savePublicationEdit}>
                                <input
                                  value={editTitle}
                                  onChange={(event) => setEditTitle(event.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-red-100"
                                  required
                                />
                                <textarea
                                  rows={3}
                                  value={editDescription}
                                  onChange={(event) => setEditDescription(event.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-red-100"
                                  required
                                />
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <input
                                    type="number"
                                    value={editPrice}
                                    onChange={(event) => setEditPrice(event.target.value)}
                                    placeholder="Precio opcional"
                                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-red-100"
                                  />
                                  <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                    Guardar edición
                                  </button>
                                  <button type="button" onClick={() => setEditingPublication(null)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            ) : null}
                          </article>
                        );
                      })
                    ) : (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No hay publicaciones en este filtro.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Comercios</p>
                        <h2 className="mt-2 text-xl font-semibold">Pendientes y suspendidos</h2>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-accent" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {pendingComercios.length > 0 ? (
                        pendingComercios.slice(0, 8).map((comercio) => (
                          <article key={comercio.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-950">{comercio.nombre}</p>
                                <p className="mt-1 text-xs text-slate-500">{comercio.ciudad || 'Sin ciudad'} · {getVisibilityStatus(comercio)}</p>
                              </div>
                              <Link href={`/comercios/${comercio.id}`} className="rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                                Ver
                              </Link>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button type="button" onClick={() => updateCommerceVisibility(comercio, 'publicado')} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                                <Eye className="h-3.5 w-3.5" />
                                Publicar
                              </button>
                              <button type="button" onClick={() => updateCommerceVisibility(comercio, 'oculto')} className="inline-flex items-center gap-1 rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                                <EyeOff className="h-3.5 w-3.5" />
                                Ocultar
                              </button>
                              <button type="button" onClick={() => updateCommerceVisibility(comercio, 'suspendido')} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white">
                                Suspender
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No hay comercios pendientes.</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-accent" />
                      <h2 className="text-xl font-semibold">Estadísticas</h2>
                    </div>
                    <div className="mt-4 space-y-3">
                      {topStats.map((comercio) => (
                        <article key={comercio.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="font-semibold text-slate-950">{comercio.nombre}</p>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {metricLabels.map((metric) => (
                              <div key={metric.key} className="rounded-xl bg-white p-2 text-center ring-1 ring-slate-200">
                                <p className="text-[10px] font-semibold text-slate-500">{metric.label}</p>
                                <p className="mt-1 text-sm font-black text-slate-950">{formatNumber(getMetric(comercio, metric.key))}</p>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
